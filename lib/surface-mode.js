/**
 * 宿主适配档位（P3）。
 *
 * 目标：宿主一升级，插件**不能整块失效**，而要明确告诉用户和代码自己现在能做什么：
 *
 *   full      插件层通道全通 + 补丁健康 → 允许自动 apply、允许深层应用（解 asar / 重启宿主）
 *   degraded  插件层通，但补丁有漂移 / 宿主版本未适配 → 只做注入与只读页，不写宿主
 *   readonly  连 systemPrompt / tools 都拿不到 → 只保留状态页，什么都不写
 *
 * 判定只看**证据**：宿主版本在不在 dshTargets、补丁漂移占比、能力探测结果。
 * 不看“版本号相等”这种假设 —— 官方完全可以同版本改行为。
 */

export const SURFACE_MODES = Object.freeze(["full", "degraded", "readonly"]);

/** 补丁漂移占比超过这个值就降档：说明宿主结构变了，不是个别补丁的小改。 */
export const DEFAULT_DRIFT_RATIO = 0.15;

/**
 * @param {{
 *   hostSupported?: boolean,
 *   hostVersion?: string|null,
 *   hostTarget?: string|null,
 *   probe?: {patches?: number, applied?: number, drifted?: number, pending?: number, gaps?: number}|null,
 *   capabilities?: {section?: boolean, tools?: boolean, events?: boolean}|null,
 * }} input
 * @returns {{mode: "full"|"degraded"|"readonly", reasons: string[], driftRatio: number}}
 */
export function computeSurfaceMode(input = {}) {
  const caps = input.capabilities || {};
  const probe = input.probe || null;
  const reasons = [];

  // 连注入面和工具面都拿不到 = 这个宿主已经没有插件层可做的事
  if (caps.section === false && caps.tools === false) {
    return { mode: "readonly", reasons: ["no systemPrompt.section and no tools registry"], driftRatio: 0 };
  }
  if (caps.section === false) reasons.push("systemPrompt.section unavailable → user channel only");
  if (caps.events === false) reasons.push("agent/pre-step unavailable → system channel only");

  const patches = Number(probe?.patches) || 0;
  const drifted = Number(probe?.drifted) || 0;
  const gaps = Number(probe?.gaps) || 0;
  const driftRatio = patches > 0 ? Number((drifted / patches).toFixed(3)) : 0;

  // 硬条件：命中任一条就降档。个别补丁漂移（官方改一句话）只记录，不降档 ——
  // 否则 87 条里漂 1 条就把整个插件降成“仅插件层”，用户会以为插件坏了。
  const hard = [];
  if (input.hostSupported === false) {
    hard.push(`host ${input.hostVersion || "?"} not in dshTargets (${input.hostTarget || "?"})`);
  }
  if (gaps > 0) hard.push(`${gaps} patch(es) never landed`);
  if (driftRatio > DEFAULT_DRIFT_RATIO) hard.push(`drift ratio ${driftRatio} > ${DEFAULT_DRIFT_RATIO}`);
  if (drifted > 0) reasons.push(`${drifted}/${patches} patch file(s) drifted`);
  reasons.unshift(...hard);

  return { mode: hard.length > 0 ? "degraded" : "full", reasons, driftRatio };
}

/** 只有 full 档才允许启动时自动打补丁：降级档下“自动写宿主”是最容易把宿主写死的一步。 */
export function shouldAutoApply(mode) {
  return mode === "full";
}

/** 深层动作（解包 app.asar / 交换 resources/app / 重启宿主）只允许在 full 档、且用户显式点。 */
export function deepApplyAllowed(mode, options = {}) {
  return mode === "full" && options.explicit === true;
}

/** 状态页/报告用的一行。 */
export function describeMode(mode, reasons = []) {
  const label = mode === "full" ? "完全适配 / full" : mode === "degraded" ? "降级 / degraded（仅插件层）" : "只读 / readonly";
  return reasons.length === 0 ? label : `${label} — ${reasons.join("; ")}`;
}
