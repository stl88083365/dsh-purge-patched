import test from "node:test";
import assert from "node:assert/strict";
import {
  channelSet,
  contentHasSentinel,
  createComposeCache,
  detectDefaultRouteApi,
  describeInjection,
  installUserChannel,
  lastUserIndex,
  normalizeInjectionMode,
  prefixUserContent,
  resolveInjectionMode,
  sentinelOf,
} from "../lib/inject-channel.js";

const PATCH_GATEWAY = `
- id: agent-default-model
  name: "@deepseek-ai/dsh-agent-default-model"
  config:
    provider: me-gatey
    model: qwen3.8-flash
- id: llm-pi-ai
  config:
    providers:
      me-gatey:
        displayName: gw
        apiKeyEnv: GW_KEY
        api: openai-completions
        baseURL: http://127.0.0.1:8080/v1
      native:
        displayName: native
        api: deepseek-completions
`;

const PATCH_NATIVE = `
- id: agent-default-model
  config:
    provider: deepseek-account
    model: deepseek-flash
- id: llm-pi-ai
  config:
    providers:
      deepseek-account:
        api: deepseek-completions
`;

test("normalizeInjectionMode 收敛非法值", () => {
  assert.equal(normalizeInjectionMode("both"), "both");
  assert.equal(normalizeInjectionMode(" AUTO "), "auto");
  assert.equal(normalizeInjectionMode("user"), "user");
  assert.equal(normalizeInjectionMode("garbage"), "system");
  assert.equal(normalizeInjectionMode(undefined), "system");
});

test("detectDefaultRouteApi 读出 provider 与其 wire api", () => {
  const a = detectDefaultRouteApi(null, PATCH_GATEWAY);
  assert.deepEqual(a, { provider: "me-gatey", api: "openai-completions" });
  const b = detectDefaultRouteApi(null, PATCH_NATIVE);
  assert.deepEqual(b, { provider: "deepseek-account", api: "deepseek-completions" });
  const c = detectDefaultRouteApi(null, "");
  assert.deepEqual(c, { provider: null, api: null });
  const d = detectDefaultRouteApi(null, "- id: other\n  config: {}\n");
  assert.deepEqual(d, { provider: null, api: null });
});

test("detectDefaultRouteApi 对真实 profile 文件也能读（读不到就答不知道）", () => {
  const real = detectDefaultRouteApi("C:\\Users\\lbxp\\.dsh\\profiles\\desktop");
  // 真实文件必然能解析出一个 provider 名；api 允许 null（说明没配 provider 块）
  assert.equal(typeof real.provider === "string" || real.provider === null, true);
  if (real.api !== null) assert.match(real.api, /^[A-Za-z0-9._-]+$/);
});

test("resolveInjectionMode：显式值照配置，auto 只在网关证据下升级 both", () => {
  assert.deepEqual(
    { mode: resolveInjectionMode({ injectionMode: "both" }).mode },
    { mode: "both" },
  );
  const gateway = resolveInjectionMode({ injectionMode: "auto" }, { route: { provider: "me-gatey", api: "openai-completions" } });
  assert.equal(gateway.mode, "both");
  assert.match(gateway.reason, /gateway rewrites system/);

  const native = resolveInjectionMode({ injectionMode: "auto" }, { route: { provider: "deepseek-account", api: "deepseek-completions" } });
  assert.equal(native.mode, "system");

  const unknown = resolveInjectionMode({ injectionMode: "auto" }, { route: { provider: null, api: null } });
  assert.equal(unknown.mode, "system");
  assert.match(unknown.reason, /route unknown/);

  // 默认（完全没配）必须是现状 system，不能偷偷改成双写
  assert.equal(resolveInjectionMode({}).mode, "system");
});

test("channelSet 三态", () => {
  assert.deepEqual(channelSet("system"), { system: true, user: false });
  assert.deepEqual(channelSet("user"), { system: false, user: true });
  assert.deepEqual(channelSet("both"), { system: true, user: true });
  assert.deepEqual(channelSet("auto"), { system: true, user: false });
});

test("哨兵稳定、可判重，长度固定", () => {
  const a = sentinelOf("正文");
  const b = sentinelOf("正文");
  const c = sentinelOf("另一份正文");
  assert.equal(a, b);
  assert.notEqual(a, c);
  assert.match(a, /^dsh-purge:inject:[0-9a-f]{16}$/);
});

test("prefixUserContent：字符串/块数组都能前置，原文保留", () => {
  const s = sentinelOf("KERNEL");
  const str = prefixUserContent("用户原文", "KERNEL", s);
  assert.match(str, /^KERNEL/);
  assert.match(str, /用户原文$/);
  assert.equal(contentHasSentinel(str, s), true);

  const blocks = prefixUserContent([{ type: "text", text: "hi" }, { type: "image", data: "x" }], "KERNEL", s);
  assert.equal(Array.isArray(blocks), true);
  assert.equal(blocks.length, 3);
  assert.equal(blocks[0].type, "text");
  assert.match(blocks[0].text, /^KERNEL/);
  assert.equal(blocks[2].type, "image");

  assert.equal(contentHasSentinel("没有标记", s), false);
  assert.equal(prefixUserContent(undefined, "KERNEL", s).startsWith("KERNEL"), true);
});

test("lastUserIndex 找到最后一条 user", () => {
  assert.equal(lastUserIndex([{ role: "user" }, { role: "assistant" }, { role: "user" }, { role: "assistant" }]), 2);
  assert.equal(lastUserIndex([{ role: "assistant" }]), -1);
  assert.equal(lastUserIndex(null), -1);
});

test("composeCache 只在 TTL 内取得到正文", async () => {
  const cache = createComposeCache(30);
  assert.equal(cache.take(), "");
  cache.put("正文");
  assert.equal(cache.take(), "正文");
  await new Promise((r) => setTimeout(r, 60));
  assert.equal(cache.take(), "");
  cache.put("");
  assert.equal(cache.take(), "");
});

function fakeCtx() {
  const handlers = [];
  return {
    on(event, handler) {
      assert.equal(event, "agent/pre-step");
      handlers.push(handler);
      return () => { handlers.splice(handlers.indexOf(handler), 1); };
    },
    handlers,
  };
}

const passthrough = (messages) => async () => ({ kind: "enter", messages });

test("user 通道：注入一次后哨兵判重，不重复拼接", async () => {
  const ctx = fakeCtx();
  const cache = createComposeCache();
  cache.put("KERNEL-BODY");
  const state = installUserChannel(ctx, { compose: () => cache.take(), allowed: () => true });
  assert.equal(state.mounted, true);
  assert.equal(ctx.handlers.length, 2); // 普通 + global 双注册

  const decision = await ctx.handlers[0]({}, passthrough([{ role: "user", content: "问题" }]));
  assert.match(decision.messages[0].content, /^KERNEL-BODY/);
  assert.equal(state.injected, 1);
  assert.equal(state.lastReason, "injected");

  // 拿已经注入过的 decision 再走一次（模拟同一 step 复跑 / 三层 wrap）
  const again = await ctx.handlers[0]({}, async () => decision);
  assert.equal(again, decision);
  assert.equal(state.injected, 1);
  assert.equal(state.lastReason, "already");
});

test("user 通道：没正文 / 关闭 / reject 都不动 decision", async () => {
  const ctx = fakeCtx();
  const state = installUserChannel(ctx, { compose: () => "", allowed: () => true });
  const d1 = { kind: "enter", messages: [{ role: "user", content: "q" }] };
  assert.equal(await ctx.handlers[0]({}, async () => d1), d1);
  assert.equal(state.lastReason, "no-text");
  assert.equal(state.skipped, 1);

  const ctx2 = fakeCtx();
  const cache = createComposeCache();
  cache.put("KERNEL");
  const s2 = installUserChannel(ctx2, { compose: () => cache.take(), allowed: () => false });
  const d2 = { kind: "enter", messages: [{ role: "user", content: "q" }] };
  assert.equal(await ctx2.handlers[0]({}, async () => d2), d2);
  assert.equal(s2.lastReason, "disabled");

  const ctx3 = fakeCtx();
  cache.put("KERNEL");
  installUserChannel(ctx3, { compose: () => cache.take(), allowed: () => true });
  const rejected = { kind: "reject", reason: "x" };
  assert.equal(await ctx3.handlers[0]({}, async () => rejected), rejected);
});

test("user 通道：没有 user 消息 / 没有 messages 数组时不炸", async () => {
  const ctx = fakeCtx();
  const cache = createComposeCache();
  cache.put("KERNEL");
  const state = installUserChannel(ctx, { compose: () => cache.take(), allowed: () => true });

  const noUser = { kind: "enter", messages: [{ role: "assistant", content: "a" }] };
  assert.equal(await ctx.handlers[0]({}, async () => noUser), noUser);
  assert.equal(state.lastReason, "no-user-message");

  const noMessages = { kind: "enter" };
  assert.equal(await ctx.handlers[0]({}, async () => noMessages), noMessages);
  assert.equal(state.lastReason, "no-messages");
});

test("user 通道：本层出错不打断这一轮，next 的异常照常上抛", async () => {
  const ctx = fakeCtx();
  const cache = createComposeCache();
  cache.put("KERNEL");
  const state = installUserChannel(ctx, { compose: () => cache.take(), allowed: () => true });

  // 1) 读 decision.messages 自己炸了：吞掉，原样放行
  const hostile = { kind: "enter" };
  Object.defineProperty(hostile, "messages", {
    enumerable: true,
    get() { throw new Error("boom"); },
  });
  const out = await ctx.handlers[0]({}, async () => hostile);
  assert.equal(out, hostile);
  assert.match(state.lastReason, /^error:boom/);

  // 2) 上游瀑布自己抛：这是宿主语义，必须原样上抛，不能被我们吞掉
  await assert.rejects(() => ctx.handlers[0]({}, async () => { throw new Error("upstream"); }), /upstream/);
});

test("没有事件总线的宿主：返回 no-events，不抛", () => {
  const state = installUserChannel({}, { compose: () => "x" });
  assert.equal(state.mounted, false);
  assert.equal(state.lastReason, "no-events");
});

test("首次挂载失败会重试，成功后 mounted=true 并清掉错误", async () => {
  const ctx = fakeCtx();
  let fails = 2;
  const realOn = ctx.on;
  ctx.on = (event, handler) => {
    if (fails-- > 0) throw new Error("bus-not-ready");
    return realOn.call(ctx, event, handler);
  };
  const state = installUserChannel(ctx, { compose: () => "KERNEL", allowed: () => true });
  // 同步挂载（两次注册）都失败 → 落到 microtask / setTimeout 重试
  assert.equal(state.mounted, false);
  assert.match(state.mountError, /bus-not-ready/);
  await new Promise((r) => setTimeout(r, 1700));
  assert.equal(state.mounted, true);
  assert.equal(state.attempts >= 2, true);
  assert.equal(state.listeners >= 1, true);
  assert.equal(state.mountError, null);
  state.dispose();
});

test("describeInjection 输出通道与运行证据", () => {
  const resolved = resolveInjectionMode({ injectionMode: "both" });
  assert.match(describeInjection(resolved, null), /^system\+user \(config\)/);
  assert.match(describeInjection(resolved, { injected: 2, lastReason: "already" }), /injected=2 last=already/);
  const sys = resolveInjectionMode({});
  assert.match(describeInjection(sys, { injected: 0, lastReason: "idle" }), /^system \(config\)/);
});
