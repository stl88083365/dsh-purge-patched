# 聊天窗口上方的 dock 不见了（0.2.2-rc.1 排查记录）

适用：插件已安装、宿主半可用，但聊天窗口上方那一排 purge dock / 演练台入口完全不出现，且 DSH 不报任何错。

## 症状

- 聊天窗口上方没有 `PurgeLauncher` / `PurgeDock` / 欢迎弹层。
- `POST http://127.0.0.1:<port>/redteam/api` 仍然返回 200，`GET` 返回 405。

第二条很容易误导人：那条路由是 `dsh-purge/redteam/ui` 注册的，对应 bundle patch 里 `dsh-purge-redteam-ui` 那条行，和 `dsh-purge` 本体是两条独立的行。它能应答**不能**证明 `dsh-purge` 本体被挂载。

## 真正的阻断点：profile 里插入后又把自己禁用

`%DSH_PROFILE_DIR%\desktop\cordis.patch.yml`：

```yaml
- insert:
    - id: dsh-purge
      name: dsh-purge
      inject: [ systemPrompt, tools ]
      config:
        enabled: true
        ...
- id: dsh-purge        # ← 插完又把自己关掉
  disabled: true
```

行被 `disabled: true`，该行的客户端半（`client.js`，即 dock）不会进入 composition，于是静默不出现。

自检命令（Windows PowerShell，路径按自己的 profile 改）：

```powershell
$f = "$env:USERPROFILE\.dsh\profiles\desktop\cordis.patch.yml"
Select-String -LiteralPath $f -Pattern 'id: dsh-purge' -Context 0,1
```

健康状态应当是：`dsh-purge` **只出现在 `- insert:` 段里**，没有任何 `- id: dsh-purge / disabled: true` 的顶层行。

## 修法

删掉那段顶层禁用行，只保留 insert，然后**重启 DSH**（profile 层改动必须重启才重装配）。

## 两个不成立的假设（别再走这两条路）

1. **幽灵 inject 包名**。`dsh.client.inject` 里写 0.2.2 已不存在的包名（如 `@deepseek-ai/dsh-client-runtime`、`@deepseek-ai/dsh-client-ui-slots`）**不会报错**。`dsh-client-modules/lib/client.js` 的 `arriveGraphRow` 对 `row.inject` 逐项查 `graphRows`，查不到直接跳过：

   ```js
   for (const packageName of row.inject) {
     const dependency = this.graphRows.get(packageName);
     if (dependency !== void 0) await this.arriveDependency(row.id, dependency, [], visited);
   }
   ```

   所以清单里包名不对是"不生效"，不是"加载失败"。仍然建议对齐成宿主真实存在的包（官方模板见 `@deepseek-ai/dsh-agent-preset` 内置 `skills/cordis-plugin-development/templates/decoration/package.json`），但别指望它能解决不显示的问题。

2. **槽位名被删**。0.2.2 里 `shell.overlay`、`conversation.chat.node` 仍在 `dsh-client-ui-chat` 中声明；槽位服务仍叫 `slots`（`dsh-client-ui-renderer` 内 `SlotRegistry extends cordis.Service`），另外只提供 `provide("uiRenderer", { mount })`。`client.js` 的 `inject: ["slots","locale","uiConversation"]` 在 0.2.2 依然成立，不需要改。

## 仍然不显示时的下一步

`Ctrl+Shift+I` 开 DevTools，看三件事：

1. `__ModuleLoader__` 里有没有 `dsh-purge` 这个 module（有没有被注册）；
2. `importErrors` 有没有对应条目；
3. `ctx.slots` 是否注入成功（`ShellOverlay` 是否被 `ctx.slots.inject` 接上）。

## 附：`dsh.client` 在 0.2.2 的校验口径

`dsh-client-modules/lib/index.js`：

- `platform` 必须是字符串；
- `inject` 必须是字符串数组；
- `immediately` 必须是 boolean；
- `graphRow()` 里 `...fields.immediately ? {immediately:true} : {}` —— 缺 `immediately` 的插件不会被主动到达，只在被别处 require / 动态 import 时才加载。UI 插件应当显式写 `"immediately": true`。

`client.js` 必须以 `<包名>` 作为注册 id：

```js
window.__ModuleLoader__.load({ id: "dsh-purge", factory: ... })
```

## 防复发

如果这段禁用是插件管理器里"关闭插件"写回的，那么手动改掉后，下一次在设置页再关一次就会再写回来。真正的长期解法是不要在 bundle patch 已经提供了这条行的情况下再对它做 enable/disable 的顶层操作，或者让管理器的开关只作用于 profile 自己的 insert 行。
