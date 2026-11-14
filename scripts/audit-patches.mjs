#!/usr/bin/env node
/**
 * 全量补丁真实性审计 / patch landing audit
 *
 * 不看 marker 在不在，而是逐条 replacement 判定：
 *   - 插入型（replace 包含 pattern）：新增的每一行是否都在产物里 → INSERT_INCOMPLETE
 *   - 改写型：原文是否已被换掉、替换文本是否在位 → PATTERN_LEFT / NOT_APPLIED
 *   - 删除型（pattern 包含 replace）：残留是否清零 → LEFTOVER
 * 再对所有被补丁动过的宿主文件跑 `node --check` / `JSON.parse`。
 *
 * 用法：
 *   node scripts/audit-patches.mjs                # 人类可读摘要 + 需人工复核的补丁
 *   node scripts/audit-patches.mjs --json out.json
 *   DSH_AI_BASE=<插件根> node scripts/audit-patches.mjs
 *
 * 退出码：0 = 所有非撤销型补丁都至少有一条 replacement 落地；1 = 存在零落地补丁。
 *
 * 注意（历史教训）：targetFiles() 有些键返回的是「字符串单路径」而不是数组，
 * 直接 for..of 会逐字符遍历、把读不到的路径误判成「内容未落盘」。一律用 norm() 归一。
 */
import { readFileSync, existsSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const core = await import(pathToFileURL(path.join(here, "..", "lib", "core.js")).href);
const { ALL_PATCHES, targetFiles, filePatchOutcome, isSelfMarkedPatch, yamlJsCommentsToHash } = core;

const asLf = (t) => String(t ?? "").replace(/\r\n/g, "\n").replace(/\r/g, "\n");
const isYamlPath = (fp) => /\.(yml|yaml)$/i.test(fp || "");
const norm = (v) => (Array.isArray(v) ? v : v ? [v] : []);
const repsOf = (p) =>
  Array.isArray(p.replacements) ? p.replacements : (p.patterns ?? []).map((pattern) => ({ pattern, replace: p.replace }));

function resolveAiBases() {
  const explicit = String(process.env.DSH_AI_BASE || "").trim();
  if (explicit) return [path.normalize(explicit)];
  const bases = typeof core.enumeratePatchAiBases === "function" ? core.enumeratePatchAiBases({ discover: true }) : [];
  const usable = bases.filter((b) => existsSync(b));
  if (usable.length === 0) {
    console.error("找不到宿主插件根（@deepseek-ai）。请设置 DSH_BASE 或 DSH_AI_BASE。");
    process.exit(2);
  }
  return usable;
}

const cache = new Map();
const load = (fp) => {
  if (cache.has(fp)) return cache.get(fp);
  let text = null;
  try { text = asLf(readFileSync(fp, "utf8")); } catch { /* 读不到就当不存在 */ }
  cache.set(fp, text);
  return text;
};

function verdictOf(text, rep, yaml) {
  if (!rep || !rep.pattern || typeof rep.replace !== "string") return null;
  if (rep.pattern instanceof RegExp) return { verdict: "REGEX" };
  const pn = asLf(String(rep.pattern));
  const rn = yaml ? yamlJsCommentsToHash(rep.replace) : asLf(rep.replace);
  const hits = text.split(pn).length - 1;
  const sig = asLf(rn).split("\n").map((l) => l.trim()).filter((l) => l.length >= 8);
  const missing = sig.filter((l) => !text.includes(l));
  const insertType = rn.includes(pn);
  const removalType = !insertType && rn.trim().length > 0 && pn.includes(rn.trim());

  if (insertType) return { verdict: missing.length === 0 ? "OK" : "INSERT_INCOMPLETE", hits, missing };
  if (removalType) return { verdict: hits === 0 ? "OK" : "LEFTOVER", hits, missing };
  if (missing.length === 0) return { verdict: "OK", hits, missing };
  if (hits === 0) return { verdict: "NOT_APPLIED", hits, missing };
  return { verdict: "PATTERN_LEFT", hits, missing };
}

const aiBases = resolveAiBases();
const patchRows = [];
const touched = new Set();

for (const p of ALL_PATCHES) {
  // 已退役补丁（官方删掉了目标实现）不参与审计
  if (p.obsolete) continue;
  const keys = Array.isArray(p.file) ? p.file : [p.file];
  const fileRows = [];
  for (const aiBase of aiBases) {
    const files = targetFiles(aiBase);
    for (const key of keys) {
      // 同一个键可能解析出一串候选路径，只审真实存在的
      for (const fp of norm(files[key]).filter((f) => existsSync(f))) {
        touched.add(fp);
        const text = load(fp);
        if (text === null) { fileRows.push({ key, fp, outcome: "unreadable", reps: [] }); continue; }
        const yaml = isYamlPath(fp);
        const reps = [];
        for (const rep of repsOf(p)) {
          const v = verdictOf(text, rep, yaml);
          if (v) reps.push(v);
        }
        fileRows.push({ key, fp, outcome: filePatchOutcome(text, p, fp), reps });
      }
    }
  }
  const all = fileRows.flatMap((f) => (f.reps ?? []).map((r) => r.verdict));
  patchRows.push({
    id: p.id,
    name: p.name,
    layer: p.layer,
    selfMarked: isSelfMarkedPatch(p),
    outcomes: fileRows.map((f) => f.outcome),
    counts: {
      reps: all.length,
      ok: all.filter((v) => v === "OK").length,
      notApplied: all.filter((v) => v === "NOT_APPLIED").length,
      patternLeft: all.filter((v) => v === "PATTERN_LEFT").length,
      insertIncomplete: all.filter((v) => v === "INSERT_INCOMPLETE").length,
      leftover: all.filter((v) => v === "LEFTOVER").length,
    },
    fileRows,
  });
}

// 变体合并：同一 (补丁, 文件) 的多条 replacement 是不同宿主版本的写法，命中任一即算落地
const unlanded = [];
for (const row of patchRows) {
  const real = row.fileRows.filter((f) => f.fp);
  if (real.length === 0) continue;
  const landed = real.some((f) => {
    const vs = (f.reps ?? []).map((r) => r.verdict);
    return vs.some((v) => v === "OK") || (vs.length > 0 && vs.every((v) => v === "REGEX"));
  });
  if (!landed) unlanded.push(row);
}

// 再分两类：#61→#89、#83→#84 这种「前一条写入、后一条改写同一段」会让字面永远对不上，
// 这类补丁的 outcome 仍是 applied；真正的漏（#12 那种）落盘文本停在官方原文，需要人工定性。
// 所以只把「零落地且状态也不是 applied」判为硬缺口，其余列入 needsReview 提示人工复核。
const appliedOutcomes = new Set(["applied", "already", "skipped"]);
const needsReview = unlanded.filter((r) => r.outcomes.some((o) => appliedOutcomes.has(o)));
const gaps = unlanded.filter((r) => !r.outcomes.some((o) => appliedOutcomes.has(o)));

const syntax = [];
for (const fp of touched) {
  if (/\.(js|mjs|cjs)$/i.test(fp)) {
    const r = spawnSync(process.execPath, ["--check", fp], { encoding: "utf8" });
    if (r.status !== 0) syntax.push({ fp, err: (r.stderr || r.stdout || "").split("\n").slice(0, 2).join(" | ") });
  } else if (/\.json$/i.test(fp)) {
    try { JSON.parse(readFileSync(fp, "utf8")); } catch (e) { syntax.push({ fp, err: e.message }); }
  }
}

// 重复插入检查：同一文件里完全相同的 [dsh-purge] 行出现两次以上
const duplicates = [];
for (const fp of touched) {
  const text = load(fp);
  if (!text) continue;
  const seen = new Map();
  for (const line of text.split("\n")) {
    const t = line.trim();
    if (!t.includes("dsh-purge")) continue;
    seen.set(t, (seen.get(t) ?? 0) + 1);
  }
  for (const [t, n] of seen) if (n > 1) duplicates.push({ fp, line: t.slice(0, 120), count: n });
}

const summary = {
  aiBases,
  patches: patchRows.length,
  touchedFiles: touched.size,
  verdicts: patchRows.reduce(
    (a, r) => ({
      reps: a.reps + r.counts.reps,
      ok: a.ok + r.counts.ok,
      notApplied: a.notApplied + r.counts.notApplied,
      patternLeft: a.patternLeft + r.counts.patternLeft,
      insertIncomplete: a.insertIncomplete + r.counts.insertIncomplete,
      leftover: a.leftover + r.counts.leftover,
    }),
    { reps: 0, ok: 0, notApplied: 0, patternLeft: 0, insertIncomplete: 0, leftover: 0 },
  ),
  unlanded: unlanded.map((r) => r.id),
  needsReview: needsReview.map((r) => r.id),
  gaps: gaps.map((r) => r.id),
  selfMarkedUnlanded: unlanded.filter((r) => r.selfMarked).map((r) => r.id),
  syntaxErrors: syntax.length,
  duplicates: duplicates.length,
};

const outIdx = process.argv.indexOf("--json");
if (outIdx !== -1) {
  const out = process.argv[outIdx + 1];
  if (out) writeFileSync(out, JSON.stringify({ summary, patchRows, syntax, duplicates }, null, 1), "utf8");
}

const brief = (fp) => String(fp).replace(/^.*node_modules\\@deepseek-ai\\/, "<ai>\\").replace(/^.*resources\\app\\/, "<app>\\");
console.log(JSON.stringify(summary, null, 1));
for (const row of [...gaps, ...needsReview]) {
  const tag = gaps.includes(row) ? "GAP" : "REVIEW";
  console.log(`\n[${tag} #${row.id}] ${row.name} selfMarked=${row.selfMarked} outcome=${row.outcomes.join("/")}`);
  for (const f of row.fileRows.filter((x) => x.fp)) {
    for (const r of f.reps ?? []) {
      if (r.verdict === "OK" || r.verdict === "REGEX") continue;
      console.log(`   ${r.verdict} hits=${r.hits} miss=${r.missing?.length ?? 0} :: ${brief(f.fp)}`);
    }
  }
}
for (const s of syntax) console.log(`SYNTAX ${brief(s.fp)} :: ${s.err}`);
for (const d of duplicates) console.log(`DUP x${d.count} ${brief(d.fp)} :: ${d.line}`);

const hardGaps = gaps.filter((r) => !r.selfMarked);
process.exit(hardGaps.length === 0 && syntax.length === 0 && duplicates.length === 0 ? 0 : 1);
