# 升级不失效：dsh-purge 的生存层（P1–P3）

宿主升级后插件“还能不能用”，取决于三件事分别成不成立。这里把三件事拆成三层，
每层都能单独判定、单独降级，不再一荣俱荣一损俱损。

| 层 | 依赖 | 失效后果 | 现在怎么兜 |
|---|---|---|---|
| L0 破甲内核 | `systemPrompt.section` + `agent/pre-step`（服务 API） | 破甲没了 | 双通道，任一可用即生效 |
| L1 宿主补丁 | 官方文件里的文本/结构锚点 | 少几条增强 | 锚点 lint + 写入后语法事务 |
| L2 引导 | 宿主版本 / 面板 | 不知道出了什么事 | 三档状态机 + `doctor` 一条命令 |

## L0 双通道注入（`lib/inject-channel.js`）

- `injectionMode: auto`（默认）：读 profile 的 `cordis.patch.yml`，看默认模型的 provider
  用的是不是 OpenAI 兼容线（`api: openai-completions|responses`）。是 → `both`，否则 `system`。
- `system`：只挂提示词段（旧行为）。
- `user`：正文前置到本步最后一条 user 消息，内容哈希哨兵去重。
- `both`：两条都挂。网关把 `role=system` 整段重写时，这条是唯一还能把内核送到模型的路径。

user 通道只复用「同一 step 里 `assemble` 刚算出的正文」（20s TTL），不自己重算上下文，
所以不会出现两条通道内容不一致；算不出来就这一轮不注入，绝不猜。

代价：`both` 每轮多一份内核（约 5k tokens）。只想要旧行为就显式 `system`。

## L1 补丁治理

- `scripts/lint-anchors.mjs`：把 249 个锚点分成结构锚 / 正则 / 混合 / 文案锚。
  文案锚（整句官方话术）在宿主改一个字后永久失效，`--strict` 可当提交门禁。
- `lib/apply-tx.js`：apply 写完后统一 `node --check`（JS）/ `JSON.parse`（JSON），
  坏掉的用 `.dshpurge.bak` 回滚，并把对应补丁降级成 `drifted`。
  宁可这条不生效，也不留一个起不来的宿主。

## L2 三档状态机（`lib/surface-mode.js`）

| 档位 | 条件 | 允许的动作 |
|---|---|---|
| `full` | 版本在 `dshTargets` 内、无硬缺口、漂移占比 ≤ 15% | 读写宿主、深层应用（解 asar / 重启） |
| `degraded` | 版本不在列表 / 有补丁零落地 / 漂移占比 > 15% | 只做插件层注入，不自动写宿主 |
| `readonly` | 连 `systemPrompt.section` 和 `tools` 都拿不到 | 只留状态页 |

`autoApplyOnStart: true` 时先过档位闸：不是 `full` 就不自动写宿主（返回 `skip:surface-degraded`）。
默认配置 `autoApplyOnStart: false` 连这次探测都不跑。

## 一条命令看清现状

```powershell
# 只读，不写宿主；报告落到 $DSH_HOME/dsh-purge/doctor/doctor-<ts>.md
node "$env:USERPROFILE\.dsh\profiles\desktop\node_modules\dsh-purge\scripts\doctor.mjs"

# 单看补丁落地
node .../scripts/audit-patches.mjs

# 单看锚点脆性（交给 CI 时用 --strict）
node .../scripts/lint-anchors.mjs --strict

# 单看注入取证：解会话日志，统计内核在 system/user 消息里的命中
node .../scripts/verify-inject.mjs --all --limit 3
```

`verify-inject` 按 zstd **多帧**容器切帧解码。注意：Node 24 的 `zstdDecompressSync`
只解第一帧（实测 23.9 MB 的会话只解出 211 字节），直接用一次性 API 会把“读不了”
误报成“没内核”。

## 回滚

```powershell
$d = "$env:USERPROFILE\.dsh\profiles\desktop\node_modules\dsh-purge"
Copy-Item "$d\lib\index.js.bak-20261110-p1" "$d\lib\index.js" -Force
Copy-Item "$d\lib\core.js.bak-20261110-p2" "$d\lib\core.js" -Force
Remove-Item "$d\lib\inject-channel.js","$d\lib\apply-tx.js","$d\lib\patch-anchor.js","$d\lib\surface-mode.js" -Force
Remove-Item "$d\scripts\lint-anchors.mjs","$d\scripts\verify-inject.mjs","$d\scripts\doctor.mjs" -Force
Remove-Item "$d\test" -Recurse -Force
```

## 生效条件

- `lib/*` 的改动要**重启宿主**（工具包在主进程启动时加载）。
- `scripts/*` 立即可用，不需要重启。
- 这些文件在 `node_modules` 里：`dsh plugin add` / pnpm 重装会覆盖，正式化要推回仓库。
