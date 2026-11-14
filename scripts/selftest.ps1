param([int]$WaitSec = 0)
# dsh-purge post-restart self test.
# Finds the host's local port, reads /dsh-purge/status (injection_state), then runs verify-inject.
# Pure ASCII on purpose: Windows PowerShell 5.1 decodes BOM-less UTF-8 as ANSI and breaks on CJK.

$ErrorActionPreference = "Continue"
if ($WaitSec -gt 0) { Start-Sleep -Seconds $WaitSec }

$lines = New-Object System.Collections.Generic.List[string]
function Add-Line([string]$s) { $lines.Add($s) }

Add-Line "# dsh-purge selftest $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
Add-Line ""

$pids = @((Get-Process -ErrorAction SilentlyContinue | Where-Object { $_.ProcessName -like "*DeepSeek*" }).Id)
Add-Line ("host pids: " + ($pids -join ","))

$ports = @()
try {
  $ports = @(Get-NetTCPConnection -State Listen -ErrorAction Stop |
    Where-Object { $pids -contains $_.OwningProcess } |
    Select-Object -ExpandProperty LocalPort -Unique)
} catch {
  Add-Line ("port scan failed: " + $_.Exception.Message)
}
Add-Line ("listen ports: " + ($ports -join ","))

$status = $null
foreach ($p in $ports) {
  try {
    $r = Invoke-WebRequest -Uri ("http://127.0.0.1:" + $p + "/dsh-purge/status") -TimeoutSec 3 -UseBasicParsing -ErrorAction Stop
    if ($r.StatusCode -eq 200) {
      $status = $r.Content | ConvertFrom-Json
      Add-Line ("status route: http://127.0.0.1:" + $p + "/dsh-purge/status")
      break
    }
  } catch { }
}

if (-not $status) {
  Add-Line "no /dsh-purge/status route found (host may not serve web)"
} else {
  Add-Line ""
  Add-Line "## plugin status"
  Add-Line ("- plugin_version: " + $status.plugin_version)
  Add-Line ("- host_version: " + $status.host_version + "  supported=" + $status.host_supported + "  surface_mode=" + $status.surface_mode)
  Add-Line ("- patches: applied=" + $status.patches_applied + " pending=" + $status.patches_pending + " drifted=" + $status.patches_drifted + " total=" + $status.patches_total)
  Add-Line ("- injection_mode: " + $status.injection_mode + "  requested=" + $status.injection_requested)
  Add-Line ("- injection_reason: " + $status.injection_reason)
  if ($status.injection_state) {
    $s = $status.injection_state
    Add-Line ("- user channel: mounted=" + $s.mounted + " listeners=" + $s.listeners + " attempts=" + $s.attempts + " injected=" + $s.injected + " skipped=" + $s.skipped + " last=" + $s.lastReason + " mountError=" + $s.mountError)
    if ($s.mounted -and $s.injected -eq 0) {
      Add-Line "- NOTE: mounted but injected=0 -> send one message in the UI, then run this script again."
    }
  } else {
    Add-Line "- user channel: injection_state missing (plugin older than 1.2.3, or apply not loaded)"
  }
}

$d = Join-Path $env:USERPROFILE ".dsh\profiles\desktop\node_modules\dsh-purge"
Add-Line ""
Add-Line "## session log evidence"
try {
  $out = & node (Join-Path $d "scripts\verify-inject.mjs") --all --limit 3 2>&1
  foreach ($o in $out) { Add-Line ([string]$o) }
} catch {
  Add-Line ("verify-inject failed: " + $_.Exception.Message)
}

$file = Join-Path $env:USERPROFILE "dsh-purge-selftest-report.md"
$lines -join "`n" | Set-Content -LiteralPath $file -Encoding UTF8
Write-Host ($lines -join "`n")
Write-Host ""
Write-Host ("report: " + $file)