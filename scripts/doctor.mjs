#!/usr/bin/env node
/**
 * doctor.mjs —— 升级前后一条命令看清“插件现在还能做什么”（只读）。
 *
 * 串起来源不同的四份证据：
 *   1. 宿主版本 / dshTargets 是否覆盖
 *   2. 补丁落地（复用 scripts/audit-patches.mjs，逐 replacement 判定）
 *   3. 锚点脆性（lib/patch-anchor.js，有多少条靠官方文案整句）
 *   4. 注入取证（scripts/verify-inject.mjs，会话日志里内核到底进没进请求）
 *
 * 用法：
 *   node scripts/doctor.mjs                 # 打印 + 写 $DSH_HOME/dsh-purge/doctor-<ts>.md
 *   node scripts/doctor.mjs --no-write
 *   node scripts/doctor.mjs --json
 */

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath, pathToFileURL } from "node:url";
import { resolveNodeBinary } from "../lib/apply-tx.js";

const here = path.dirname(fileURLToPath(import.meta.url));
const libDir = path.join(here, "..", "lib");
const argv = process.argv.slice(2);
const noWrite = argv.includes("--no-write");
const asJson = argv.includes("--json");

const DSH_HOME = process.env.DSH_HOME || path.join(os.homedir(), ".dsh");
process.env.DSH_HOME = DSH_HOME;

const core = await import(pathToFileURL(path.join(libDir, "core.js")).href);
const { lintPatches } = await import(pathToFileURL(path.join(libDir, "patch-anchor.js")).href);
const { resolveInjectionMode, describeInjection } = await import(pathToFileURL(path.join(libDir, "inject-channel.js")).href);
const { computeSurfaceMode, describeMode, shouldAutoApply } = await import(pathToFileURL(path.join(libDir, "surface-mode.js")).href);

const nodeBin = resolveNodeBinary();
const runNode = (script, args = []) => {
  const out = spawnSync(nodeBin.bin, [...nodeBin.args, path.join(here, script), ...args], {
    env: { ...process.env, ...nodeBin.env, DSH_HOME },
    encoding: "utf8",
    maxBuffer: 64 * 1024 * 1024,
  });
  return { ok: out.status === 0, stdout: out.stdout || "", stderr: out.stderr || "", status: out.status };
};

// ---------- 1. 宿主 ----------
let state = null;
try { state = await core.gatherState(); } catch (error) { state = { gather_error: String(error?.message || error) }; }

// ---------- 2. 补丁落地 ----------
const auditTmp = path.join(os.tmpdir(), `dsh-purge-audit-${Date.now()}.json`);
const auditRun = runNode("audit-patches.mjs", ["--json", auditTmp]);
let audit = null;
try { audit = JSON.parse(fs.readFileSync(auditTmp, "utf8")).summary; } catch { audit = null; }
try { fs.unlinkSync(auditTmp); } catch { /* ignore */ }

// ---------- 3. 锚点 ----------
const anchors = lintPatches(core.ALL_PATCHES);

// ---------- 4. 注入 ----------
const injection = resolveInjectionMode({ injectionMode: process.env.DSH_PURGE_INJECTION_MODE || "auto" });
const injectRun = runNode("verify-inject.mjs", ["--json", "--all", "--limit", "3"]);
let injectEvidence = null;
try {
  const list = JSON.parse(injectRun.stdout).results || [];
  // 优先拿“确实看到内核”的那条会话当证据；都在写/读不了就退到最新一条并标未知。
  injectEvidence = list.find((r) => r.ok) || list[0] || null;
  if (injectEvidence) injectEvidence.scanned = list.length;
} catch { injectEvidence = null; }

// ---------- 档位 ----------
const probe = {
  patches: audit?.patches ?? state?.display_total ?? 0,
  drifted: state?.display_drifted ?? state?.patches_drifted ?? 0,
  gaps: audit?.gaps?.length ?? 0,
};
const surface = computeSurfaceMode({
  hostSupported: state?.host_supported !== false,
  hostVersion: state?.host_version,
  hostTarget: state?.host_target,
  probe,
});

const report = {
  generatedAt: new Date().toISOString(),
  dshHome: DSH_HOME,
  host: {
    version: state?.host_version ?? null,
    target: state?.host_target ?? null,
    supported: state?.host_supported !== false,
    surface: state?.surface ?? null,
    install: state?.desktop_install || state?.ai_base || null,
    gatherError: state?.gather_error ?? null,
  },
  surface: { mode: surface.mode, reasons: surface.reasons, driftRatio: surface.driftRatio, autoApplyAllowed: shouldAutoApply(surface.mode) },
  patches: audit ? {
    total: audit.patches,
    touchedFiles: audit.touchedFiles,
    verdicts: audit.verdicts,
    gaps: audit.gaps,
    needsReview: audit.needsReview,
    syntaxErrors: audit.syntaxErrors,
    duplicates: audit.duplicates,
  } : { error: (auditRun.stderr || "audit failed").slice(0, 400) },
  anchors: anchors.totals,
  fragilePatches: anchors.rows.filter((r) => r.fragile > 0).slice(0, 10).map((r) => ({ id: r.id, name: r.name, fragile: r.fragile, anchors: r.anchors.length })),
  injection: {
    mode: injection.mode,
    requested: injection.requested,
    reason: injection.reason,
    route: injection.route,
    channelLine: (() => { try { return describeInjection(injection, null); } catch { return injection.mode; } })(),
  },
  injectEvidence: injectEvidence ? {
    session: injectEvidence.file,
    kernelInSystem: injectEvidence.kernelInSystem,
    kernelInUser: injectEvidence.kernelInUser,
    sentinelHits: injectEvidence.sentinelHits,
    codec: injectEvidence.codec,
    ok: injectEvidence.ok,
    unknown: injectEvidence.unknown === true,
    scanned: injectEvidence.scanned,
  } : null,
};

function render(r) {
  const L = [];
  L.push(`# dsh-purge doctor — ${r.generatedAt}`);
  L.push("");
  L.push(`DSH_HOME: \`${r.dshHome}\``);
  L.push("");
  L.push("## 宿主");
  L.push(`- 版本: ${r.host.version || "未知"}（目标 ${r.host.target || "?"}，supported=${r.host.supported}）`);
  L.push(`- 面: ${r.host.surface || "?"}   安装: ${r.host.install || "?"}`);
  if (r.host.gatherError) L.push(`- gatherState 失败: ${r.host.gatherError}`);
  L.push("");
  L.push("## 适配档位");
  L.push(`- **${describeMode(r.surface.mode, r.surface.reasons)}**`);
  L.push(`- 漂移占比 ${r.surface.driftRatio}   自动打补丁 ${r.surface.autoApplyAllowed ? "允许" : "禁止"}`);
  L.push("");
  L.push("## 补丁落地");
  if (r.patches.error) L.push(`- 审计失败: ${r.patches.error}`);
  else {
    L.push(`- 补丁 ${r.patches.total} 条 / 触及 ${r.patches.touchedFiles} 个宿主文件`);
    L.push(`- verdict ${r.patches.verdicts.reps}：OK ${r.patches.verdicts.ok} / NOT_APPLIED ${r.patches.verdicts.notApplied} / PATTERN_LEFT ${r.patches.verdicts.patternLeft} / INSERT_INCOMPLETE ${r.patches.verdicts.insertIncomplete}`);
    L.push(`- 硬缺口 ${r.patches.gaps.length ? r.patches.gaps.join(",") : "无"}   待复核 ${r.patches.needsReview.length ? r.patches.needsReview.join(",") : "无"}`);
    L.push(`- 语法错误 ${r.patches.syntaxErrors}   重复插入 ${r.patches.duplicates}`);
  }
  L.push("");
  L.push("## 锚点脆性");
  L.push(`- 结构锚 ${r.anchors.structural} / 正则 ${r.anchors.regex} / 混合 ${r.anchors.mixed} / 文案锚 ${r.anchors.fragile}（${(r.anchors.fragileRatio * 100).toFixed(1)}%）`);
  L.push(`- 含文案锚的补丁 ${r.anchors.patchesWithFragile} 条，纯文案锚 ${r.anchors.patchesOnlyFragile} 条`);
  if (r.fragilePatches.length) {
    L.push(`- 最脆：${r.fragilePatches.map((p) => `#${p.id}(${p.fragile}/${p.anchors})`).join(" ")}`);
  }
  L.push("");
  L.push("## 注入通道");
  L.push(`- ${r.injection.channelLine}`);
  L.push(`- 路由 ${r.injection.route?.provider || "?"} api=${r.injection.route?.api || "unknown"}（${r.injection.reason}）`);
  L.push("");
  L.push("## 注入取证");
  if (!r.injectEvidence) L.push("- 没有可读的会话日志");
  else if (r.injectEvidence.unknown) L.push(`- 会话日志读不了（可能正在写入）: \`${r.injectEvidence.session}\` — 换 --session 指定一个已结束的会话再试`);
  else {
    L.push(`- 会话: \`${r.injectEvidence.session}\`（扫了 ${r.injectEvidence.scanned || 1} 个）`);
    L.push(`- system/message 含内核 ${r.injectEvidence.kernelInSystem}   user/message 含内核 ${r.injectEvidence.kernelInUser}   哨兵 ${r.injectEvidence.sentinelHits}`);
    L.push(`- 结论: ${r.injectEvidence.ok ? "✓ 内核已送达" : "✗ 这条会话没有内核"}`);
  }
  L.push("");
  L.push("## 建议");
  if (r.surface.mode !== "full") L.push("- 档位不是 full：先在隔离实例（`DSH_HOME=<tmp>` + `--user-data-dir=<tmp>`）里验证，再决定是否申请新补丁锚点；不要直接点深层应用。");
  if (r.anchors.patchesOnlyFragile > 0) L.push("- 存在纯文案锚补丁：把它们改成锚 import / 函数名 + `expect`，见 `scripts/lint-anchors.mjs`。");
  if (r.injectEvidence && !r.injectEvidence.ok) L.push("- 会话日志里没有内核：把 `injectionMode` 调成 `both`，再看这一节。");
  if (r.surface.mode === "full" && r.injectEvidence?.ok) L.push("- 一切正常：注入已送达、补丁无硬缺口。");
  return L.join("\n");
}

const text = render(report);
if (asJson) console.log(JSON.stringify(report, null, 2));
else console.log(text);

if (!noWrite) {
  const dir = path.join(DSH_HOME, "dsh-purge", "doctor");
  try {
    fs.mkdirSync(dir, { recursive: true });
    const stamp = new Date().toISOString().replace(/[:.]/gu, "-").slice(0, 19);
    const file = path.join(dir, `doctor-${stamp}.md`);
    fs.writeFileSync(file, `${text}\n`, "utf8");
    console.error(`\n报告已写入: ${file}`);
  } catch (error) {
    console.error(`报告写入失败: ${error?.message || error}`);
  }
}
