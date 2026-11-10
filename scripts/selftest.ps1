param([int]$WaitSec = 0)
$ErrorActionPreference = "Continue"
if ($WaitSec -gt 0) { Start-Sleep -Seconds $WaitSec }

$report = @()
$report += "# dsh-purge 重启自测 $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
$report += ""

# 1) 找宿主监听的 127.0.0.1 端口（桌面/ web 都可能换端口，不写死）
$pids = (Get-Process | Where-Object { $_.ProcessName -like "*DeepSeek*" }).Id
$ports = @()
try {
  $ports = Get-NetTCPConnection -State Listen -ErrorAction Stop |
    Where-Object { $pids -contains $_.OwningProcess -and $_.LocalAddress -in @("127.0.0.1","0.0.0.0","::") } |
    Select-Object -ExpandProperty LocalPort -Unique
} catch { }
$report += "宿主 PID: $($pids -join ',')  监听端口: $($ports -join ',')"

$status = $null
foreach ($p in $ports) {
  foreach ($path in @("/dsh-purge/status")) {
    try {
      $r = Invoke-WebRequest -Uri "http://127.0.0.1:$p$path" -TimeoutSec 3 -UseBasicParsing -ErrorAction Stop
      if ($r.StatusCode -eq 200) { $status = $r.Content | ConvertFrom-Json; $report += "命中状态路由: http://127.0.0.1:$p$path"; break }
    } catch { }
  }
  if ($status) { break }
}

if (-not $status) {
  $report += "没找到插件状态路由（宿主可能没起 web 服务），只能跑日志取证。"
} else {
  $report += ""
  $report += "## 插件状态"
  $report += "- plugin_version: $($status.plugin_version)"
  $report += "- host_version: $($status.host_version)  supported=$($status.host_supported)  surface_mode=$($status.surface_mode)"
  $report += "- patches: applied=$($status.patches_applied) pending=$($status.patches_pending) drifted=$($status.patches_drifted) total=$($status.patches_total)"
  $report += "- injection_mode: $($status.injection_mode)  requested=$($status.injection_requested)"
  $report += "- injection_reason: $($status.injection_reason)"
  if ($status.injection_state) {
    $s = $status.injection_state
    $report += "- user 通道: mounted=$($s.mounted) attempts=$($s.attempts) injected=$($s.injected) skipped=$($s.skipped) last=$($s.lastReason) mountError=$($s.mountError)"
  } else {
    $report += "- user 通道: 状态字段缺失（插件不是 1.2.3+，或 apply 未跑）"
  }
}

# 2) 日志取证
$d = Join-Path $env:USERPROFILE ".dsh\profiles\desktop\node_modules\dsh-purge"
$report += ""
$report += "## 会话日志取证"
try {
  $out = & node "$d\scripts\verify-inject.mjs" --all --limit 3 2>&1
  $report += ($out | Out-String)
} catch { $report += "verify-inject 失败: $($_.Exception.Message)" }

$file = Join-Path $env:USERPROFILE "dsh-purge-selftest-report.md"
$report -join "`n" | Set-Content -LiteralPath $file -Encoding utf8
Write-Host ($report -join "`n")
Write-Host "`n报告已写入: $file"
