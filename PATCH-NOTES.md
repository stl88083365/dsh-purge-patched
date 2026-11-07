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

## 2026-11-07 适配：DSH 0.2.2-rc.1 + 一键更新切自库（1.1.93）

### 宿主升级（0.2.1-rc.5 -> 0.2.2-rc.1）

- 更新源是官方 nightly feed：`https://download.deepseek.com/dsh-desk/feeds/win-x64/nightly.yml`
  （GitHub release 只有源码包，不含 Windows 安装包）。安装包
  `https://download.deepseek.com/dsh-desk/bin/win-x64/deepseek-harness-0.2.2-rc.1-win-x64.exe`
  （293,425,336 B，Authenticode `Valid`，签名者 `CN="Hangzhou DeepSeek Artificial Intelligence Co., Ltd."`）。
- 静默安装：`installer /S /D=D:\DeepSeek Harness`（exit 0）。安装器会删掉旧的解包目录与
  `app.asar.bak`，只留 sealed `app.asar`（213,202,918 B）。
- **0.2.2 的 runtime 已移除 CLI**：`resources\runtime\` 只剩 `office-skills\`，
  `dsh.cmd` / `dsh.ps1` / `dsh` 全 missing。因此 `shim` 显示 `missing`、
  `--dump-config` 一类 CLI 验证链不可用，属预期行为，不是故障。
- sealed asar 解包：`sealedAsarHandoff()` 第一步就 `if (adapterFor(surface) !== "desktop") return null;`，
  纯 CLI 下 surface 被判为 `web`，**永不解包**。故改用自写脚本直接调底层
  `lib/extract-asar.js`（绕过 surface 判定）：
  `C:\Users\lbxp\dsh-update\unpack-022.mjs`，输出
  `{"count":20519,"overlay":{"copied":1583},"moved":{"renamed":true,"bak":"D:/DeepSeek Harness/resources/app.asar.bak"}}`。
  宿主自此从 `resources\app` 运行。
- 回滚宿主：把 `D:\DeepSeek Harness\resources\app.asar.bak` 改名回 `app.asar`，清掉 `resources\app`。

### 0.2.2 把官方包拆分/搬迁——8 条补丁漂移的根因

| 补丁 | 旧目标 | 0.2.2 新位置 |
|---|---|---|
| #60 run_code 沙箱话术 | `dsh-tools/lib/types/ptc.js` | `dsh-tool-executor-ptc/lib/types/ptc.js` + `lib/index.js` |
| #62 工具审批管道 | `dsh-tools/lib/index.js`、`lib/types/index.js` | `dsh-tools/lib/pipeline.js` |
| #54 交付物提示词 | `dsh-client-ui-deliverables/lib/index.js` | `dsh-deliverable-file-references/lib/index.js` |
| #74 组装前钩子 | agent-loop `claim` + `assemble(...)` 两行连写 | `claim` 后插了 model 选择与 `tools.resolve`，`assemble` 改对象展开 |
| #67 messages 守卫 | 4 tab 缩进 | run loop 多包一层 try，变 5 tab |
| #40 system-prompt 注入 | 早返回 `return transformed` | `return { ...transformed, tools }` |
| #14 升级授权 | `displayReason: {en,zh}` 内联对象 | `displayReason: escalationDisplayReason(mode, justification)` |
| #17 观察策略 | `editIntent` 内联读前检查 | `return this.requirePresent(target, actor, "edit")` |

### `lib/core.js` 改动

1. 新增 `firstExistingList(groups)`：按顺序取第一组存在的候选，旧宿主自动回退，
   避免新旧两份同时进 patch 目标而误判漂移。
2. `targetFiles` 四个键改写/新增：
   - `deliverables-prompt` 优先 `dsh-deliverable-file-references/lib/index.js`，回退 `dsh-client-ui-deliverables`
   - `dsh-tools-ptc` 优先 `dsh-tool-executor-ptc/lib/types/ptc.js`，回退 `dsh-tools/lib/types/ptc.js`
   - 新增 `dsh-tools-ptc-exec`（`dsh-tool-executor-ptc/lib/index.js` → `dsh-tools/lib/index.js`）
   - 新增 `tools-pipeline`（`dsh-tools/lib/pipeline.js` → `lib/types/pipeline.js` → `lib/index.js`）
3. 逐条补 pattern：#14 追加第 3 条、#40 追加第 8 条（正则）、#67 追加 5 tab 版、
   #74 追加只锚 `const claimed = this.inbox.claim(target, position.turn);` 单行版、
   #17 追加 `requirePresent` 版；#60 改 `file` 为 `["dsh-tools-ptc-exec","dsh-tools-ptc"]`；
   #62 改 `file` 为 `["tools-pipeline"]`。

**实测结果**：`--apply` 报告 **69/86 已清洗、0 待清洗、0 漂移**。
剩余 `na` 均为 desktop-only 项（surface=web 时不适用），`skipped` 仅 #80。

### 一键更新改指自库

- `lib/update.js`：`REPO` → `stl88083365/dsh-purge-patched`，`STABLE_REF` → `main`
  （用户库默认分支是 main，若仍为 master 则 codeload 会 404）。`BETA_REF = "beta"` 未动，
  自库无 beta 分支，测试版 lane 会一直为空。
- `client.js` 两处 `welcome.repo` 同步改自库地址。
- `package.json`：version `1.1.93`（高于上游最高 1.1.92，避免混淆）；
  `repository/homepage/bugs` → 自库；`dsh.install.tarball` →
  `https://codeload.github.com/stl88083365/dsh-purge-patched/tar.gz/refs/heads/main`，
  `zip` → `.../zip/refs/heads/main`，`git` → 自库 `.git`；
  `dshTarget: "0.2.2-rc.1"`，`dshTargets: ["0.2.2-rc.1","0.2.1-rc.2","0.2.1-rc.5"]`。
- **端到端验证**（直接调插件 `checkUpdate()`）：
  `{"ok":true,"hasUpdate":false,"updateTarget":"main","localVersion":"1.1.93",
  "remoteVersion":"1.1.85","remoteSha":"3e10abb","via":"mixed"}` ——
  请求确实打在自库 main，远端仍是未推送前的 1.1.85。

### 基线合并：本地安装版 1.1.90 整体作为基线

上游 master 仍是 1.1.85 / `dshTarget: 0.2.1-rc.2`，其最新 release 1.1.92 全库 grep `0.2.2` 零命中，
**上游没有任何 0.2.2 支持**，0.2.2 适配只能自写。因此不整体同步上游，而是把本机安装的
1.1.90（= 上游 1.1.86→1.1.90 全部改进 + rc.5 helper 修复）整体作为基线写入本仓库：
`robocopy /E /XD node_modules .github /XF "*.bak-*"`。

由此并入的上游优点（不逐条 cherry-pick）：

- 1.1.92 随包 `skills/redteam/*.md`（23 条红队技能，`files` 增 `skills`，NOTICE 注明来源）；
- 1.1.91 `dshTargets` 双版本声明、`writeHostFileAtomic()` 保留 POSIX mode、
  回退按钮 `place()` 可见性判定 + 宿主 z-index 下调、`rewritePnpmAllowBuilds()` 按 pnpm 大版本分策略；
- 1.1.90 撤销按钮改 `createPortal` 挂 body（根治"输入框整块消失"）；
- 1.1.89 工作目录提示用会话真实 cwd（`interpolate:false`）+ `assembly.variables` 补 `cwd`、
  桌面静默退出可诊断（`%TEMP%\dsh-purge-desktop.log`）、`atomicWriteFile` 保持 writeFile+rename、
  重复标记负向前瞻改幂等；
- 1.1.88 双版本适配 rc.2 + rc.5。

### 本机验证与遗留

- 插件目录同步：仓库 → `C:\Users\lbxp\.dsh\profiles\desktop\node_modules\dsh-purge`
  （排除 `.git` / `node_modules` / `*.bak-*`），宿主重启后 5 进程稳定、无新 `crash-*` 日志。
- 插件加载硬证据：宿主 13:51:14 启动，`C:\Users\lbxp\.dsh\dsh-purge\last-cwd.txt` 于 13:51:31 被写入。
- **0.2.2 桌面版只开 inspector `127.0.0.1:9230`，不再自动开 web UI**（无 `6218x` 端口）。
  用工具验证界面时注意：要么重启时把 stdout 重定向（日志里才会有 `dsh web: http://127.0.0.1:<port>/?token=...`），
  要么直接在桌面窗口里看。无交互桌面会话下 `cu.screenshot()` 会报 `NO_SESSION / Unable to capture the interactive desktop`。
- 遗留：shim 未重建（0.2.2 无 CLI）；beta lane 空；上游 `skills/redteam/*.md` 尚未整包并入。
