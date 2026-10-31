# dsh-purge-patched 维护说明（2026-10-31 换线 1.1.85 版）

本仓库 = 官方上游 **YuJunZhiXue/dsh-purge** master（1.1.85 线，commit 9716ca3）完整内容 + 本维护说明。
版权与署名归上游，见 `LICENSE` / `NOTICE`。

## 为什么换线（背景）

- 2026-10-25 建仓时，本仓库基于 **dsh-purge-plus 1.4.3**（ShadowCat2233/dsh-purge-plus，桌面端实际安装源）
  并附带 `lib/windows-restart.js` 桌面重启补丁（wscript + WScript.Shell.Run 脱离式，替换官方 CIM 创建进程方案）。
- 2026-10-26 核对后确认：**官方原版 YuJunZhiXue/dsh-purge 才是活跃主线**（最近提交 af7cd22 为 2026-10-26，
  含 #162/#159 修复），且官方已**在 `lib/desktop.js` 内置等价的 WScript.Shell.Run 重启方案**
  （`officialRestartScript` 中 `sh.Run('"' + exe + '"', 1, false)`，CIM 只用于枚举进程），
  与我们 10-25 实测可行的方案一致。
- 因此：**切换到官方原版线为新基线，删除旧补丁三件套**（`windows-restart.js` / `.patched-wsh` / `.bak-cim` /
  `restart-windows.ps1` / `test/windows-restart.mjs`）。官方内置修复取代本地补丁，无功能损失。

## 新基线校验（替换旧 ws.Run 校验）

官方桌面重启链路在 `lib/desktop.js`，校验重启方案存在：

```powershell
Select-String "C:\Users\lbxp\.dsh\profiles\desktop\node_modules\dsh-purge\lib\desktop.js" -Pattern 'sh\.Run\('
```

有输出 = 官方重启链路在；无输出 = 被覆盖/损坏。

## 覆盖风险（重点，仍适用）

`dsh plugin add/remove` 或 pnpm 解析依赖时，会把 `dsh-purge` 按 package.json 声明的 tarball **重新安装**，
可能覆盖本目录内容（历史已实测发生两次）。依赖源已在本机 profile 改为本仓库 tarball：
`https://github.com/stl88083365/dsh-purge-patched/archive/refs/heads/main.tar.gz`，
重装时仍会拉取本仓库内容。

每次操作插件后必做校验（见上）。版本号以 `package.json` 为准（跟踪官方 1.1.85 线，语义版本沿用官方）。

## 回滚

若新基线在桌面端出现问题，可回滚到旧版 plus 1.4.3：
- 本机备份目录：`C:\Users\lbxp\.dsh\profiles\desktop\node_modules\dsh-purge.bak-20261026-plus143\`
- 将备份内容整体复制回 `node_modules\dsh-purge\` 并恢复 package.json 依赖源为 plus tarball。

## 维护四件套（沿用惯例）

1. 装/卸任何插件后：`Select-String` 校验 `desktop.js` 中 `sh.Run(` 存在。
2. 变更前先做 `.bak-YYYYMMDD` 备份（插件目录整体或单个文件）。
3. 重启验证走 dsh-purge 的"桌面重启"，成功以新实例 PID 出现为准（重启日志在
   `C:\Users\lbxp\.dsh\dsh-purge\restart\`）。
4. 失败先看 `dispatch failed: Supervisor readiness timed out` 类日志，再决定是否回滚。

## 2026-10-26 附注

- 已删除上游的 `.github/workflows/release.yml`（发布 CI）：GitHub 拒绝无 `workflow` scope 的 OAuth 推送该文件，且发布流程与插件运行无关。
- 如需恢复自动发布：执行 `gh auth refresh -h github.com -s workflow` 授权后再加回。

## 2026-10-31 换线：官方 1.1.78 -> 1.1.85

- 本次将基线从官方 1.1.78（af7cd22）更新至 1.1.85（9716ca3，2026-10-31 发布），版本号沿用官方。
- 本仓库旧定制 commit f76a30d（revised.size 守卫 + REWIND_DROP_SENT_ON_APPEND）**已被官方 1.1.85 原生收录**
  （lib/core.js 已含等价逻辑与注释），无需再打补丁，cherry-pick 冲突即上游已合入。
- 更新主要内容（官方 #165-#196）：
  - 红队组件重构：`lib/redteam/store-core.js`（约 602 行）、tools/ui/validate 同步更新
  - 新增**子代理审批接管**：`lib/subagent-control.js`（新文件，61 行）
  - 红队模式中文化、尾部锚点（1.1.84）
  - 深色模式主按钮白底白字修复（1.1.85，#196）
  - pnpm 11 兼容：allowBuilds 只写裸包名并清除 dsh-purge@* 键（1.1.81，#185）
  - 补丁失配 drifted 判定 + 宿主版本门禁 + expect 命中数契约（1.1.82，#188 通用部分）
  - cordis.patch.yml 为 [] 时替换而非追加，修复宿主启动解析失败（1.1.82，#191）
  - DSH NEXT 识别与单测收录（1.1.81，#174/#175）
  - 大量新增单测（patch-status/profile-insert/dark-theme/dsh-next/zip-extract 等）
  - 详见上游 `release-notes.md`。
- 校验命令不变（见上）；桌面端依赖源仍为本仓库 tarball。
- 回滚：若新基线异常，旧版备份 `node_modules\dsh-purge.bak-20261026-plus143`（1.4.3）仍可用。

## 2026-10-31 修复：0.2.1-rc.5 宿主 Apply/自动重打后崩溃

- **现象**：rc.5 宿主上点 dsh-purge「应用」（Apply）或 settle 检测到补丁丢失自动重打后，
  Electron 弹 `dsh desktop host stopped` 崩溃框，宿主永久停摆（16:44 / 17:01 两次实测，
  crash 栈均为 `resources/app.asar/lib/main.js:3845`，且 `app.asar` 未被挪走、无 relaunch）。
- **根因（本机实证）**：`restartOfficialHarness` 的 plan 恒选 `powershell` 分支——本机
  `powershell.exe` detached spawn **挂起不执行脚本**（实测 12s+ 无输出），且 `cscript` 报
  **"没有文件扩展名 .js 的脚本引擎"**（JScript 引擎失效）→ `wshJsEngineWorks()` 探针必失败。
  于是 Apply 后 PowerShell 交换脚本写了但从未执行：宿主进程被杀/退出，`app.asar` 没挪走、
  桌面没 relaunch → Electron main 把 host 退出当崩溃弹窗，宿主死透。
- **修复（commit 33d91ee）**：
  - `lib/desktop.js` `restartOfficialHarness`：win32 + 官方 exe 直接走纯 Node helper
    `restart-desktop.js`（先杀 Electron → `moveAsarAside` 挪走 `app.asar` → `execPath --updated`
    relaunch + 前台恢复），不再依赖 PowerShell / JScript 引擎；`exitAfter: 1500` 给足
    helper 启动+杀进程时间，host 退出时 Electron 已死，不再弹崩溃框。
  - `sealedSwapKind()` 统一返回 `"helper"`，`scheduleAsarSwapRestart` 同样不会再选中
    PowerShell 分支。
  - helper 重启链路 2026-10-29 已在本机实测成功；本次修复后 2026-10-31 实测：
    模拟 Apply 重启 → `app.asar` 挪走、补丁版 `resources/app` 启动、5 进程 160s 稳定、
    **0 新增 crash**。
- **验证方式**：Apply/自动重打后检查 `%TEMP%\dsh-purge-restart-desktop.log` 出现
  `asar moved to ...` + `relaunched via execPath`，且 `resources\app.asar` 被挪走
  （`app.asar.bak` 出现）、宿主从 `resources\app` 正常启动、无新 `crash-*` 日志。
- **回滚**：`lib/desktop.js` 备份为 `lib/desktop.js.bak-20261031-prefix`（修前原版）。
