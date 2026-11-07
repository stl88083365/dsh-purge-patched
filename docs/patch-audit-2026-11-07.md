# 全量补丁真实性审计（2026-11-07，宿主 0.2.2-rc.1）

本文件记录一次对全部 86 条补丁的落地审计结果，以及审计方法。可随时用仓库自带脚本复跑：

```powershell
$env:DSH_BASE = "D:\DeepSeek Harness"; $env:DSH_SURFACE = "desktop"
npm run audit:patches                      # 摘要 + 需要人工复核的补丁
npm run audit:patches -- --json out.json   # 附带结构化数据
```

脚本：`scripts/audit-patches.mjs`，退出码 0 = 没有硬缺口。

## 为什么不能只看 marker

状态页的 `applied` 来自 marker 命中，而 `markersAny` 补丁**只要命中任意一个标记就算整条 applied**。
官方改写另一句时，补丁不会重打，状态却仍然是绿的 —— `#12` 就是这么漏掉的：
状态 `applied`，但 `ASK_SENTENCE` 还是"会弹审批"的官方原文。

所以审计口径是逐条 replacement 判定：

| 类型 | 判据 | 失败标记 |
|---|---|---|
| 插入型（`replace` 包含 `pattern`） | 新增的每一行都在产物里 | `INSERT_INCOMPLETE` |
| 改写型 | 原文已消失、替换文本已在位 | `PATTERN_LEFT` / `NOT_APPLIED` |
| 删除型（`pattern` 包含 `replace`） | 残留已清零 | `LEFTOVER` |

再加上：所有被补丁动过的 `.js` 跑 `node --check`，`.json` 跑 `JSON.parse`；
同一文件里完全相同的 `[dsh-purge]` 行出现两次以上记为 `DUP`（重复插入）。

## 结果（desktop 面，宿主 0.2.2-rc.1）

| 指标 | 值 |
|---|---|
| 补丁总数 | 86 |
| 被触及宿主文件 | 58 |
| replacement verdict 总数 | 367 |
| 落地（OK） | 220 |
| `NOT_APPLIED` | 134 |
| `PATTERN_LEFT` | 0 |
| `LEFTOVER` | 0 |
| `INSERT_INCOMPLETE` | 1 |
| 语法错误 | 0 |
| 重复插入 | 0 |
| 硬缺口（gaps） | 0 |
| 需人工复核（needsReview） | #40、#80、#83 |

### 134 条 `NOT_APPLIED` 为什么不是故障

同一补丁的多条 replacement 是**不同宿主版本的写法变体**（0.1.5 数值 schema / 0.1.7 union /
0.2 provider-managed …），命中任一即算这条补丁在这个文件上落地；再叠加官方 0.2.2 改措辞
（`undefined` → `void 0`、整句重写、引号风格）与"replace 里只有半句"的字面差异，
逐条按字面比对必然刷出大片红。

按"同一补丁 + 同一文件，任一 replacement 命中即落地"合并后，只剩 3 条要人工看。

### 需人工复核的 3 条

| # | 补丁 | 结论 |
|---|---|---|
| 40 | COMPLETE_PROMPT_KEEP_INJECT | 已落地。`dsh-system-prompt\lib\index.js` L402–L413 有 `dsh-purge` 段落分流 + `// [dsh-purge] every mode keeps system inject`；字面对不上是因为后续补丁往同一个 `return { … }` 里加了 `tools` 字段 |
| 83 | DESKTOP_HOST_CLOSE_NO_FATAL | 已落地。`resources\app\lib\main.js` L10056 `signal kill … 静默 resolve`、L10057 `close no-fail v2`；字面对不上是因为 `#84` 随后删掉了 `else this.fail(... stopped ...)` 这一行 |
| 80 | MINIMAL_OFFICIAL_TOOLSET | 正常。自标记撤销型补丁，0.2.2 官方 minimal 表本来就没有它要撤的东西 |

这三条都属"前一条写入、后一条改写同一段"的补丁链，脚本把它们列进 `needsReview` 而不是硬缺口；
真正停在官方原文的漏（例如 #12）会同时命中 `NOT_APPLIED` + 官方措辞仍在位，需要人工定性。

## 本次修掉的两个真问题

### #12 APPROVAL_ASK_SENTENCE_BYPASS 假绿

- 0.2.2 把 ask 句开头从 `Approval policy: ask.` 改成
  `Approval prompts are enabled in this session:`，旧 pattern 永不命中。
- 这条是 `markersAny`，被别的标记喂绿 → 状态页一直显示 applied。
- 修复：补一条锚新措辞的 replacement（bare 文本，双/单引号两种宿主写法都能命中），旧 pattern 留给老宿主。
- 验证：`dsh-user-approval\lib\index.js` L41 与 `lib\types\index.js` L21 均变为 auto-granted 文案。

> 踩坑：第一版把 `// [dsh-purge] …` 注释拼在 replace 末尾，pattern 是 bare 文本，
> 注释就落进了字符串字面量（模型看到的话术尾部带注释）。已去掉注释并清掉残留。

### 宿主里的重复插入（#92 / #93）

| 补丁 | 重复位置 | 内容 |
|---|---|---|
| #92 | `main.js` L10043–L10048 / L10049–L10054 | 6 行：exit 留痕 + `appendFileSync(…desktop.hostExit)` |
| #93 | `main.js` L21465–L21491 / L21492–L21518 | 27 行：`/* [dsh-purge] desktop exit trace */` 整块 |

原因：两条补丁在加 `skipIfMarked` 之前被重复 apply；`skipIfMarked` 只防"再插一次"，
不会清掉已经插了两份的现状。处理：整块逐行相等判定后删掉第二份（共 33 行），
`main.js.dedupe.bak` 留底。只影响 `%TEMP%\dsh-purge-desktop.log` 的重复行，不影响启动链路。

## 审计边界

- 没有运行时行为验证：0.2.2 桌面版不自开 web UI，无 GUI 会话时 `cu.screenshot()` 报 `NO_SESSION`，
  本轮证据都是"宿主源码 + 落盘文本"级别。
- `#33 TOOL_SHELL_DENIAL_PROMPT` / `#36 TOOL_FS_ESCALATION_SCHEMA` 是"多句追加型"，
  0.2.2 重写工具描述后部分句子不再命中（本次 9/22、7/24），但工具描述里已有中性的
  `Approval is auto-granted.` 措辞，按"核心意图已达"处理。
- `markersAny` 的设计弱点仍在：命中任意 marker 就整条 applied，官方改另一句不会重打。
  是否改成"逐条 replacement 补齐"需单独评估幂等与重复插入风险。

## 脚本自身的坑（写在这里免得后来人再踩）

`targetFiles()` 有些键（`escalation` / `tool-fs` / `subagent` …）返回的是**字符串单路径**而不是数组。
直接 `for (const fp of files[key])` 会逐字符遍历、把读不到的路径误判成"内容未落盘"。
一律用：

```js
const norm = (v) => (Array.isArray(v) ? v : v ? [v] : []);
```
