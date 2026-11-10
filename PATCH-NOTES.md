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
- 遗留：shim 未重建（0.2.2 无 CLI）；beta lane 空。上游 `skills/redteam/*.md` 已并入（见下节）。

## 2026-11-07 修复 #82 / #80（1.1.94）

### #82 DESKTOP_SHELL_PROFILE_FALLBACK 一直没打上

- 根因：补丁锚点是「import 行 + `//#region ../../packages/util/home-paths/lib/index.js` 两行相邻」。
  0.2.2 的 `resources\app\lib\main.js` 里 import 在第 18 行，region 注释已挪到第 1722 行，
  两行不再相邻 → pattern 永远不命中。desktop 面报 drifted，CLI 面因 `surface=web` 直接判 `na`，
  用户看到的就是"跳过"。
- 改法：新增找到 import 单行的锚点（`expect: 1` 防重复命中），把兜底语句插在 import 之后；
  保留旧的"两行相邻"pattern 作为 0.2.1 及更早宿主回退。
  插入位置在 `import ... stream-protocol` 与后续 bundled 代码之间，属顶层语句，ESM 合法。
- 验证：`DSH_SURFACE=desktop node bin\dsh-purge.js --apply` → `✓ 已清洗 patch #82`；
  `lib/main.js` 第 19–22 行出现 4 行注释 + `process.env.DSH_PROFILE ||= desktop` 兜底；
  `main.js.dshpurge.bak` 已生成；二次 apply 后 marker 计数仍为 1（不叠加）；
  `node --check`（拷成 .mjs）退出码 0。

### #80 MINIMAL_OFFICIAL_TOOLSET 显示 skipped

- 根因：这条是"撤销型"补丁，pattern 全是本插件以前写进宿主 preset 的痕迹
  （`# [dsh-purge] minimal fs tool parity` 等）。0.2.2 的官方 minimal 表本来就只有
  `tool-fs`（`read:false/readImage:true/write:false/edit:false`），没有 `tool-fs-search` / `tool-web`，
  所以一条 pattern 都不命中；`filePatchOutcome` 对这种自标记补丁返回 `skipped`，
  状态页就把它显示成"跳过"，和"打失败了"分不开。
- 改法：目标状态已达成时按 `applied` 记——
  `rollupPatchStatus` 增加 `selfMarked` 分支（apply 报告侧），
  `patchStatus` 对 `filePatchOutcome === "skipped"` 且 `isSelfMarkedPatch(p)` 的补丁记 `applied`（状态页侧）。
  宿主文件不动，不改官方 preset。
- 验证：`✓ [#80] MINIMAL_OFFICIAL_TOOLSET 工具/Tools — applied`。

### 顺手修的 #92/#93 二次应用叠加

- `DESKTOP_HOST_EXIT_TRACE` / `DESKTOP_MAIN_EXIT_TRACE` 的锚点（close 回调头、
  `claimDesktopSingleInstance(...)`）在产物里仍然保留，不加 `skipIfMarked` 每次 apply 都再插一遍。
- 两条补上 `skipIfMarked: true`，靠插入块里的 marker 阻断重复写入。
- `test/patch-status.test.js` 的幂等用例从红的 3 条（#92/#93 + 两条自相矛盾的 rollup 断言）变为 30/30 全绿；
  其中两条 rollup 断言按代码里已写明的"漂移压过 applied"口径改正（多文件补丁任一文件漂移即报 drifted）。

### 本次状态口径

| surface | 结果 |
|---|---|
| `DSH_SURFACE=desktop` | **80/86 已清洗，0 待清洗，0 漂移**（#80 applied、#82 applied） |
| `DSH_SURFACE=web`（CLI 默认） | 70/86 已清洗，0 待清洗；#82 因 desktop-only 记 `na`、#80 applied |


## 2026-11-07 全量补丁真实性审计（1.1.95）

用户要求"检查其他的补丁正确性"。审计口径不是"marker 在不在"，而是逐条 replacement 判定：
插入型看新增行是否全部落盘、改写型看原文是否已被换掉、删除型看残留是否清零，
再对全部被补丁动过的宿主文件跑 `node --check` / `JSON.parse`。

### 审计脚本自身的两轮错判（先说清楚，避免误读历史结论）

- v1：把 `targetFiles()` 的某些键当成数组遍历，但 `escalation` / `tool-fs` / `subagent` 等键
  返回的是**字符串单路径**，`for (const fp of 字符串)` 变成了逐字符读文件，
  于是"读不到"被记成"内容未落盘"，跑出 92 条假 `payload_missing`。结论作废。
- v2：补了插入/删除型识别，但仍残留同一处字符串误读，仍是半成品。
- v3（最终）：`const fps = Array.isArray(v) ? v : v ? [v] : []` + 只审 `existsSync` 的真实候选，
  才得到可用数据。

### 最终数据（desktop 面）

| 指标 | 值 |
|---|---|
| 补丁总数 | 86 |
| `syntaxErrors` | 0（所有被改过的 `.js` 都过 `node --check`，`.json` 都过 `JSON.parse`） |
| `PATTERN_LEFT` | 0（没有"原文还在、替换没写进去"的改写型） |
| `LEFTOVER` | 0（没有删除型残留） |
| `NOT_APPLIED` | 137 条 verdict |
| `INSERT_INCOMPLETE` | 1 条 verdict |

这 137 条 `NOT_APPLIED` **绝大多数不是故障**：同一补丁的多条 replacement 是
"不同宿主版本的写法变体"（0.1.5 数值 schema / 0.1.7 union / 0.2 provider-managed 等），
命中任一即算落地；再叠加官方 0.2.2 改写措辞（`undefined`→`void 0`、文案换句）与
"replace 里只有半句"这类字面差异，逐条按字面比对必然刷出大片红。

按"同一补丁同一文件、任一 replacement 命中即落地"合并后，只剩 5 条需要人工定性：

| # | 补丁 | 取证结论 |
|---|---|---|
| 80 | MINIMAL_OFFICIAL_TOOLSET | 自标记撤销型，本来就没加过 → 正常（已按 applied 记） |
| 83 | DESKTOP_HOST_CLOSE_NO_FATAL | 已落地：`main.js` L10055 `signal kill` / L10057 `close no-fail v2` |
| 61 | OFFICIAL_SANDBOX_POLICY_NEUTRAL | 已落地：`dsh-sandbox-policy` L87 已是 `Current file policy: read-only. … approval is auto-granted` + purge 注释；对不上只是期望写的是旧措辞 `Current DSH file policy` |
| 40 | COMPLETE_PROMPT_KEEP_INJECT | 已落地：`dsh-system-prompt` L402–L413 有 `dsh-purge` 段落分流 + `every mode keeps system inject`；`INSERT_INCOMPLETE` 是拿另一版变体比对的假红 |
| 12 | APPROVAL_ASK_SENTENCE_BYPASS | **真实未落地**（见下） |

### #12 真实未落地：ask 提示句还是官方原文

- 0.2.2 把 ask 句开头从 `Approval policy: ask.` 改成了
  `Approval prompts are enabled in this session:`，旧 pattern 永不命中；
  而这条补丁是 `markersAny`，被别的标记喂绿，状态页一直显示 applied。
- 后果：模型在 ask 策略下被文案告知"会弹审批"，会绕道去问，与插件实际"自动放行"相反。
- 改法：在 #12 增加一条锚 0.2.2 新措辞的 replacement（bare 文本，双引号/单引号两种宿主写法都能命中），
  旧 pattern 保留给 0.2.1 及更早宿主。替换文案保持"auto-granted in this session (approval bypass, approval policy: ask)"不变
  （这条文案本身就在 `markersAny` 里，替换后 marker 自然成立）。
- 验证：`✓ 已清洗 patch #12`；两处 `ASK_SENTENCE`（`lib/index.js` L41、`lib/types/index.js` L21）
  均已变为 auto-granted 文案，`node --check` 均退出 0。

> 踩坑记录：第一版 replacement 把 `// [dsh-purge] …` 注释拼在 replace 末尾，
> 而 pattern 是 bare 文本，注释就落进了字符串字面量（模型看到的话术尾部带着 `// [dsh-purge] …`）。
> 已去掉注释并手工清掉两个文件里的残留。

### 顺带清掉宿主里的重复插入（#92 / #93 的历史遗留）

- `main.js` 里 `#92` 的 6 行块出现在 L10043–L10048 和 L10049–L10054 两份，
  `#93` 的 27 行块出现在 L21465–L21491 和 L21492–L21518 两份 —— 都是加 `skipIfMarked` 之前
  重复 apply 留下的。`skipIfMarked` 只防"再插一次"，不会清掉已经插了两份的现状。
- 处理：按整块逐行相等判定后删掉第二份，共删除 33 行；`main.js.dedupe.bak` 留底；
  删后 `node --check main.js` 退出 0，`[dsh-purge]` 行不再有重复项。
- 影响面：只影响 `%TEMP%\dsh-purge-desktop.log` 的重复行数与重复注册的退出回调，
  不影响启动链路。

### 审计边界（未做的事，明确写在这里）

- 没有做运行时行为验证：0.2.2 桌面版不自开 web UI，`cu.screenshot()` 在本机报 `NO_SESSION`，
  程序化 GUI 通道不可用；本轮的证据都是"宿主源码 + 落盘文本"级别。
- `#33 TOOL_SHELL_DENIAL_PROMPT` / `#36 TOOL_FS_ESCALATION_SCHEMA` 是"多句追加型"，
  0.2.2 重写工具描述后部分句子不再命中（本次 audit 里 9/22、7/24），
  但工具描述里已经存在中性的 `Approval is auto-granted.` 措辞，可见文案已是中性，
  因此按"核心意图已达"处理，不再逐句追平。
- 补丁层 `markersAny` 的设计弱点保留：只要命中任意一个 marker，整条补丁就算 applied，
  官方改写另一句时不会被重打（#12 就是这么漏的）。本轮只修了漏，没有改 apply 语义。
## 2026-11-07 审计脚本入库 + #61 措辞对齐（1.1.96）

- 新增 `scripts/audit-patches.mjs`（`npm run audit:patches`）：逐条 replacement 判定 + 全量语法检查 +
  重复插入检查，可 `--json` 落结构化数据；`gaps`（真没打）与 `needsReview`（补丁链改写导致字面对不上）分开报。
  脚本已修掉历史坑：`targetFiles()` 有些键返回字符串单路径，必须 `norm()` 归一，否则会逐字符读文件刷假红。
- `#61 OFFICIAL_SANDBOX_POLICY_NEUTRAL` 的 replace 改成终态措辞（直接写 `Current file policy: read-only. …`）：
  `#89 SANDBOX_POLICY_BRAND_NEUTRAL` 本来就会把 `Current DSH file policy: ` 改成 `Current file policy: `，
  写终态后同一条文案不会被判两次改写，审计与二次 apply 都能自洽。宿主现行文本已经是这个终态，无需重打。
- 审计结论落档 `docs/patch-audit-2026-11-07.md`：86 条补丁、367 条 verdict、220 OK、硬缺口 0、
  语法错误 0、重复插入 0；`needsReview` 仅 #40/#80/#83（前两者为补丁链改写与撤销型，非故障）。
## 2026-11-07 #94 glob/grep 容忍 rg exit 2（1.1.97）

- 现象：新会话分析项目时 `Error: glob search failed (exit 2): rg: … IO error … 拒绝访问。 (os error 5)`，
  与搜索条件无关，整个调用失败、结果全丢。
- 根因：`@deepseek-ai/dsh-tool-fs-search/lib/index.js` 的 `runRipgrep()` 把 `exitCode ∉ {0,1}` 一律
  throw `SEARCH_FAILED`，已收集的 stdout 全部丢弃。而 rg 的 exit 2 只表示遍历期出错
  （Windows 上一个 ACL 拒绝访问的目录就够），stdout 里仍是有效的逐行结果。
  glob 还带 `--no-ignore --hidden`，所以 `.gitignore` 里的目录也会被遍历，撞上 denied 目录的概率更高。
- 修法：新增 `dshPurgeToleratesTraversalError()`，仅当 exit=2 **且** stdout 非空 **且** stderr 不是
  正则/glob 解析错误时按部分结果返回；stdout 为空或 pattern 被拒仍走原硬失败，exit 0/1 语义不变。
  glob 与 grep 共用 `runRipgrep()`，因此两者同时生效。
- 验证：在真实项目复现 exit 2 + 335 条结果，打补丁后的判定返回 true；空 stdout / pattern 错误 /
  exit 1 三种边界仍按原语义拒绝；宿主文件 `node --check` 通过；单测 85/85；审计 gaps 0。
- 生效：`--apply` 后需重启 DSH（工具包在主进程启动时加载）。
## 2026-11-07 #95 primary-runtime ENOENT 兜底（1.1.98）

- 现象：`Error: ENOENT: no such file or directory, open 'D:\DeepSeek Harness\resources\runtime\primary-runtime\runtime.json'`
- 根因：0.2.2-rc.1 安装包的 `resources\runtime` 下只带 `office-skills`，`primary-runtime` 整个缺失；
  而 desktop 启动 host 时把 `source` 写死成这个路径（`main.js` L20273 → host argv[4] →
  `dsh-desktop-host` L596），`dsh-tool-workspace-dependencies.readPrimaryRuntime(source)` 直接 ENOENT。
  `load_workspace_dependencies` 是懒加载，所以只有真正去取 Office / Python 路径时才炸。
- 已装 payload：`~/.dsh/dsh-runtimes/dsh-primary-runtime`（257.6 MB，manifest `desktopVersion 0.2.1-rc.5`，
  python 3.12.14 / node 24.21.0 / pnpm 11.28.5 + 13 个 python 包）。manifest 相同时
  `installPrimaryRuntime` 只做校验、不复制，所以回退到它是零成本的。
- 修法：desktop-host 组装 office 插件配置时先判断 `source` / `root` 谁有 `runtime.json`，
  把 `workspace_dependencies` 的 `source` 换成有效那份；`assetRoot` 仍指向安装目录的 `office-skills`，
  office 用的 `node` 跟随实际 payload。两边都没有时维持原行为（报原错误）。
- 验证：直接调真实模块 `installPrimaryRuntime` —— 原样路径复现同一条 ENOENT；
  兜底路径返回 python / node / pnpm 三个绝对路径且都 `existsSync`；打补丁后的选择逻辑四组用例符合预期；
  宿主 `node --check` 0；单测 85/85；审计 gaps 0。
- 生效：重启 DSH。
## 2026-11-07 撤回 #95，改用官方布局补齐 primary-runtime（1.1.99）

- 结论：`#95`（改 `dsh-desktop-host` 的 `source` 兜底）不符合「只做目录/文件适配、不改官方主文件」这条约束，
  已整体撤回：宿主 `dsh-desktop-host/lib/index.js` 用备份还原（SHA-256 与备份一致，24579 B，`node --check` 0），
  备份文件随后删除，补丁表移除 `#95`、`targetFiles` 一并删掉 `desktop-host` 键。
- 根因不变：0.2.2-rc.1 安装包 `resources\runtime` 下只有 `office-skills`，`primary-runtime` 整个缺失；
  desktop 启动 host 时把 `source` 写死成 `<resources>\runtime\primary-runtime`（`main.js` L20273 → argv[4] → host L596），
  `dsh-tool-workspace-dependencies.readPrimaryRuntime(source)` 因此 ENOENT。
- 适配方式（不碰官方代码）：把已装在 `~/.dsh/dsh-runtimes/dsh-primary-runtime` 的 payload
  （257.6 MB / 6157 files / manifest `0.2.1-rc.5`）补到 `D:\DeepSeek Harness\resources\runtime\primary-runtime`。
  官方 `installPrimaryRuntime` 比对 manifest 相同后只做校验、不再复制，home 那份继续当已装副本，
  最终状态与官方设计一致（bundled source + home install）。
- 新增 `scripts/relocate-primary-runtime.mjs`（`npm run fix:runtime`）：默认复制、`--move` 移动、`--dry-run` 预览，
  `DSH_BASE` 可指定安装目录；幂等，重装/更新后再跑一次即可复原。
- 验证：官方模块 `readPrimaryRuntime(新路径)` 解析出完整 manifest；
  `installPrimaryRuntime(新路径, home)` 返回的 python / node / pnpm / site-packages 全部存在；
  脚本在临时 home + base 上跑通复制分支；单测 85/85；审计 `patches 87 / gaps [] / syntaxErrors 0 / duplicates 0`；
  desktop 81/87、web 70/87，均 0 待清洗，`#95` 已不在列表。
- 生效：目录已在位，下次 `load_workspace_dependencies` 直接可用；重启 DSH 非必需。
## 2026-11-11 P1-P3 生存层（1.2.2）

宿主升级后插件"还能不能用"此前完全押在 86 条宿主补丁上：补丁漂移 = 破甲消失。
本次把三层拆开，任何一层失效都不再拖垮整块。

### L0 双通道注入 `lib/inject-channel.js`

- `injectionMode`: `auto`（默认）/ `system` / `user` / `both`。`auto` 读 profile 的
  `cordis.patch.yml`，默认模型 provider 走 `api: openai-completions|responses` 时用 `both`
  （这类网关会把 `role=system` 整段重写），否则保持 `system`。
- user 通道在 `agent/pre-step` 把正文前置到本步最后一条 user 消息，哨兵
  `dsh-purge:inject:<sha256前16位>` 幂等；只复用同一 step 里 `assemble` 刚算出的正文（20s TTL），
  不自己重算上下文。
- 实测：`system` 模式段 20,988B 含内核、0 个 pre-step 回调（与旧行为完全一致）；
  `user` 模式段为空、user 内容 21,040B 含内核 + 哨兵、原文保留、重复注入 0 次。

### L1 写入事务 `lib/apply-tx.js`

`applyPatches` 写完后统一 `node --check`（JS）/ `JSON.parse`（JSON），坏掉的用
`.dshpurge.bak` 回滚并把补丁降级为 `drifted`（`drift_reason: syntax_error`）。
校验器优先用宿主自带 node（`$DSH_HOME/dsh-runtimes/.../node.exe`），Electron 下退
`ELECTRON_RUN_AS_NODE=1`。默认 6 路并发。

### L1.5 锚点体检 `lib/patch-anchor.js` + `scripts/lint-anchors.mjs`

把 249 个锚点分成结构 / 正则 / 混合 / 文案锚。实测：文案锚 23 个（9.2%），
含文案锚的补丁 12 条，纯文案锚 0 条（判定 OK）。`--strict` 可当提交门禁。

### L2 适配档位 `lib/surface-mode.js`

`full` / `degraded` / `readonly`。硬条件：宿主不在 `dshTargets`、补丁零落地、
漂移占比 > 15%。`autoApplyOnStart: true` 时先过闸，非 full 不自动写宿主
（返回 `skip:surface-degraded`）。状态页新增「适配档位 / mode」与「破甲通道 / injection」两行。

### 取证脚码

- `scripts/verify-inject.mjs`：解 `session.v4.jsonl.zstd`，统计 `system/message` 与
  `user/message` 里内核命中与哨兵命中。
  **坑**：Node 24.21 的 `zstdDecompressSync` 只解第一个 zstd 帧（23.9MB 会话只出 211B），
  必须按帧切分（magic `0xfd2fb528`，照 `dsh-session-persistence-jsonl` 的 scanZstdFrames）。
- `scripts/doctor.mjs`：一条命令汇总宿主版本 / 档位 / 补丁落地 / 锚点 / 注入通道 / 日志取证，
  报告写到 `$DSH_HOME/dsh-purge/doctor/doctor-<ts>.md`。

### #71 梁神补丁

- 根因不是开关：梁神（`@linxin666/dsh-liangshen`）没装，`patch_status["71"]="missing_file"`。
- 原 `targetFiles` 写死四条 `profiles/{web,desktop}/node_modules/...`，pnpm 隔离 store /
  用户预设目录 / 改名安装全部漏掉。新增 `liangshenPresetFiles()` 扫四类落点，且只保留
  真的含身份句或已带 marker 的文件（避免把 redteam 等预设拖进 `strictFiles`）。
- 实测（临时 DSH_HOME 三种布局）：用户预设与 pnpm store 两个目标都命中，诱饵被排除；
  真补丁打一遍 `changed=true / marker=true / 句子消失 / pending→applied`。
- 没有标 `optional`：`optional` 会让缺文件落成 `na`，而 `na` 行不进清洗页列表，
  用户会以为补丁消失。

### 测试

`test/inject-channel.test.js` 15 条 + `test/p2-p3.test.js` 14 条，`npm test` 29/29。
`scripts/audit-patches.mjs`：87 条补丁 / 54 文件 / 338 verdict / gaps 0 / syntaxErrors 0 / duplicates 0。
