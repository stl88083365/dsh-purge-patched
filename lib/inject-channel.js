/**
 * 双通道注入（P1）：让破甲内核不只依赖 system 提示词段。
 *
 * 背景：dsh-purge 的破甲正文一直走 `systemPrompt.section({ interpolate: false })`。
 * 这条服务 API 在 0.2.x 上稳定，但有两类场景会让它静默失效：
 *   1. 中间层（OpenAI 兼容网关 / harness 重写层）把 `role=system` 整段删掉换成自己的提示词；
 *   2. 宿主升级改了 section 的渲染路径，段落不再进入请求。
 * 两种情况下请求仍然 200，模型却拿不到内核 —— 现象就是“插件还在、破甲没了”。
 *
 * 对策：照 fujiang-armor 的做法把同一份正文再挂一条 user 会话通道 —— 在 `agent/pre-step`
 * 瀑布里把它前置到本步最后一条 user 消息，并用内容哈希哨兵保证幂等。
 *
 * 关键约束：**user 通道只在能复用“同一轮刚渲染过的系统段正文”时才注入**。
 * 不给它自己算正文的机会，就不用猜 redteam / 极简 / mnemon 这些上下文差异，
 * 也不会出现两条通道内容不一致。
 *
 * 通道开关：
 *   injectionMode: "system" | "user" | "both" | "auto"
 *   system = 现状（只挂 system 段）
 *   user   = 只挂 user 前缀（system 段保留，但正文留空）
 *   both   = 两条都挂，哨兵去重
 *   auto   = 默认模型走 OpenAI 兼容网关（api: openai-completions/responses）时用 both，
 *            否则用 system。网关会重写 system，那种链路上只挂 system 段等于没挂。
 */

import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";

export const INJECTION_MODES = Object.freeze(["system", "user", "both", "auto"]);
export const DEFAULT_INJECTION_MODE = "system";

/** 会重写 messages 里 system 段的 wire api。 */
const GATEWAY_API_RE = /^openai-(completions|responses|chat)$/i;

/** 允许外挂的注入模式；非法值一律收敛成默认值，不让拼错的配置把插件炸掉。 */
export function normalizeInjectionMode(value) {
  const v = String(value ?? "").trim().toLowerCase();
  return INJECTION_MODES.includes(v) ? v : DEFAULT_INJECTION_MODE;
}

/**
 * 由本模块位置反推 profile 目录：
 * `…/profiles/<name>/node_modules/dsh-purge/lib/inject-channel.js` → `…/profiles/<name>`。
 * 反推不出来（被打包/复制到别处）就返回 null，调用方按“读不到路由”处理。
 */
export function profileDirOf(moduleUrl = import.meta.url) {
  try {
    const file = moduleUrl.startsWith("file:")
      ? fileURLToPath(moduleUrl)
      : String(moduleUrl);
    const profile = path.resolve(path.dirname(file), "..", "..", "..");
    if (fs.existsSync(path.join(profile, "cordis.patch.yml"))) return profile;
    if (fs.existsSync(path.join(profile, "package.json"))) return profile;
  } catch {
    /* 读不到就退到 unknown */
  }
  return null;
}

function profilePatchFile(profileDir) {
  return profileDir ? path.join(profileDir, "cordis.patch.yml") : "";
}

function readProfilePatch(profileDir) {
  const file = profilePatchFile(profileDir);
  if (!file) return "";
  try {
    return fs.readFileSync(file, "utf8");
  } catch {
    return "";
  }
}

/**
 * 读默认模型路由的 wire api（不引 YAML 解析器，只做缩进内的定点扫描）。
 * 目标是回答一个问题：这条链路会不会重写 system？读不到就答“不知道”。
 *
 * @returns {{provider: string|null, api: string|null}}
 */
export function detectDefaultRouteApi(profileDir, patchText = null) {
  const text = typeof patchText === "string" && patchText.length > 0
    ? patchText
    : readProfilePatch(profileDir);
  if (!text) return { provider: null, api: null };

  // 1) agent-default-model 那一行里的 provider
  const provider = /id:\s*["']?agent-default-model["']?[\s\S]{0,600}?\n\s+provider:\s*["']?([A-Za-z0-9._@/-]+)/.exec(text)?.[1] ?? null;
  if (!provider) return { provider: null, api: null };

  // 2) providers.<provider> 块里第一条 api:
  const anchor = text.search(new RegExp(`\\n\\s{2,}${provider.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}:\\s*\\n`));
  if (anchor < 0) return { provider, api: null };
  const patch = text.slice(anchor, anchor + 1200);
  const api = /\n\s+api:\s*["']?([A-Za-z0-9._-]+)/.exec(patch)?.[1] ?? null;
  return { provider, api };
}

/**
 * 把配置里的模式解析成实际通道。
 * `auto` 只在拿到“这条路由是 OpenAI 兼容网关”的证据时升级成 both，否则保持 system ——
 * 猜错的代价是每轮多花一份内核 token，所以没证据就不猜。
 *
 * @returns {{mode: "system"|"user"|"both", requested: string, reason: string, route: {provider: string|null, api: string|null}|null}}
 */
export function resolveInjectionMode(config = {}, options = {}) {
  const requested = normalizeInjectionMode(config?.injectionMode ?? options.defaultMode);
  if (requested !== "auto") return { mode: requested, requested, reason: "config", route: null };

  const route = options.route ?? detectDefaultRouteApi(options.profileDir ?? profileDirOf(options.moduleUrl));
  const gateway = !!route?.api && GATEWAY_API_RE.test(route.api);
  return {
    mode: gateway ? "both" : "system",
    requested,
    reason: gateway
      ? `auto: ${route.provider || "?"} uses ${route.api} (gateway rewrites system)`
      : `auto: ${route.provider ? `${route.provider} api=${route.api || "unknown"}` : "route unknown"}, keep system`,
    route,
  };
}

/** 两个通道各自的开关。 */
export function channelSet(mode) {
  const m = normalizeInjectionMode(mode);
  return {
    system: m === "system" || m === "both" || m === "auto",
    user: m === "user" || m === "both",
  };
}

/** 内容哈希哨兵：同一份正文本轮注入过就不再拼第二遍。 */
export function sentinelOf(text) {
  const hex = createHash("sha256").update(String(text ?? ""), "utf8").digest("hex").slice(0, 16);
  return `dsh-purge:inject:${hex}`;
}

function contentText(content) {
  if (typeof content === "string") return content;
  if (!Array.isArray(content)) return "";
  return content
    .map((block) => (block && block.type === "text" ? String(block.text ?? "") : ""))
    .join("\n");
}

export function contentHasSentinel(content, sentinel) {
  if (!sentinel) return false;
  return contentText(content).includes(sentinel);
}

/**
 * 把正文前置到一条 user 消息内容上：
 *   string → "<正文>\n\n<!-- 哨兵 -->\n<原文>"
 *   blocks → 头部插一个 text 块，其余块（图片等）原样跟随
 */
export function prefixUserContent(content, text, sentinel) {
  const head = `${String(text ?? "").trim()}\n\n<!-- ${sentinel} -->\n`;
  if (typeof content === "string") return content.length > 0 ? `${head}\n${content}` : head;
  if (Array.isArray(content)) return [{ type: "text", text: head }, ...content];
  return head;
}

/** 本步最后一条 user 消息的下标；没有则 -1。 */
export function lastUserIndex(messages) {
  if (!Array.isArray(messages)) return -1;
  for (let i = messages.length - 1; i >= 0; i -= 1) {
    if (messages[i] && messages[i].role === "user") return i;
  }
  return -1;
}

/**
 * “刚渲染过的系统段正文”缓存。
 *
 * 顺序是固定的：宿主在同一个 step 里先 `systemPrompt.assemble()`（我们的段落回调在这时跑），
 * 再进 `agent/pre-step` 瀑布。所以 user 通道拿到的永远是同一轮、同一上下文算出来的正文。
 * 超过 TTL 或从未渲染过就返回空 —— 宁可不注入，也不注入一份上下文不对的正文。
 */
export function createComposeCache(ttlMs = 20000) {
  let entry = { text: "", at: 0 };
  return {
    put(text) {
      entry = { text: typeof text === "string" ? text : "", at: Date.now() };
      return entry;
    },
    take() {
      if (!entry.text) return "";
      if (Date.now() - entry.at > ttlMs) return "";
      return entry.text;
    },
    peek() {
      return { ...entry };
    },
  };
}

/**
 * 挂 user 通道。任何异常都原样放回 `decision`，绝不因为注入失败把整轮对话打断。
 *
 * @returns 运行状态对象（供状态页读计数与最后一次判定原因）
 */
export function installUserChannel(ctx, options = {}) {
  const state = {
    mode: options.mode || "user",
    mounted: false,
    injected: 0,
    skipped: 0,
    lastReason: "idle",
    lastAt: 0,
  };
  if (typeof ctx?.on !== "function") {
    state.lastReason = "no-events";
    return state;
  }

  const handler = async (_payload, next) => {
    const decision = await next();
    try {
      if (!decision || decision.kind === "reject") return decision;
      if (typeof options.allowed === "function" && !options.allowed()) {
        state.lastReason = "disabled";
        return decision;
      }
      const messages = Array.isArray(decision.messages) ? decision.messages : null;
      if (messages === null) {
        state.lastReason = "no-messages";
        return decision;
      }
      const idx = lastUserIndex(messages);
      if (idx < 0) {
        state.lastReason = "no-user-message";
        return decision;
      }
      const text = typeof options.compose === "function" ? options.compose() : "";
      if (!text) {
        state.skipped += 1;
        state.lastReason = "no-text";
        return decision;
      }
      const sentinel = sentinelOf(text);
      const message = messages[idx];
      if (contentHasSentinel(message?.content, sentinel)) {
        state.lastReason = "already";
        return decision;
      }
      const rewritten = messages.slice();
      rewritten[idx] = { ...message, content: prefixUserContent(message.content, text, sentinel) };
      state.injected += 1;
      state.lastReason = "injected";
      state.lastAt = Date.now();
      const out = { ...decision, messages: rewritten };
      if (typeof options.onInject === "function") {
        try {
          options.onInject(out, { sentinel, bytes: text.length });
        } catch {
          /* 观测回调失败不影响注入 */
        }
      }
      return out;
    } catch (error) {
      state.lastReason = `error:${String(error?.message || error)}`;
      return decision;
    }
  };

  let dispose = null;
  // 挂载时机与作用域，两条都要处理：
  //   1) 插件 apply 期间 `ctx.on` 可能还没就绪（dsh-purge 自己的 mnemon 过滤也要
  //      late + microtask + setTimeout 三重重试才挂得上）；
  //   2) 不同宿主版本对「是否要 global 作用域才收得到 agent 事件」不一样。
  // 所以普通监听与 global 监听**都注册**：任一成功即算挂上；两个都成功时 handler 每步被调
  // 两次，内容哈希哨兵保证只注入一次（第二次判 already）。
  const mounts = [
    () => ctx.on("agent/pre-step", handler),
    () => ctx.on("agent/pre-step", handler, { global: true }),
  ];
  const disposers = [];
  const mount = () => {
    if (state.mounted) return true;
    state.attempts = (state.attempts || 0) + 1;
    let ok = 0;
    for (const register of mounts) {
      try {
        const d = register();
        ok += 1;
        if (typeof d === "function") disposers.push(d);
      } catch (error) {
        state.mountError = String(error?.message || error);
      }
    }
    if (ok > 0) {
      state.mounted = true;
      state.mountError = null;
      state.listeners = ok;
      return true;
    }
    return false;
  };
  mount();
  if (!state.mounted) {
    try { queueMicrotask(mount); } catch { /* 没有微任务队列就等定时器 */ }
  }
  let retryTimer = null;
  if (!state.mounted) {
    retryTimer = setTimeout(mount, 1500);
    if (typeof retryTimer.unref === "function") retryTimer.unref();
  }
  state.dispose = () => {
    try { if (retryTimer) clearTimeout(retryTimer); } catch { /* ignore */ }
    for (const d of disposers) {
      try { d(); } catch { /* ignore */ }
    }
  };
  return state;
}

/** 状态页用的一行摘要。 */
export function describeInjection(resolved, state) {
  const channels = channelSet(resolved.mode);
  const on = [channels.system ? "system" : "", channels.user ? "user" : ""].filter(Boolean).join("+") || "off";
  const evidence = state ? ` injected=${state.injected} last=${state.lastReason}` : "";
  return `${on} (${resolved.reason})${evidence}`;
}
