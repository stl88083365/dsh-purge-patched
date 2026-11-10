#!/usr/bin/env node
/**
 * lint-anchors.mjs —— 补丁锚点体检（只读）。
 *
 * 回答一个问题：这 87 条补丁里，有多少条是「靠官方文案整句命中」的？
 * 那种锚点在宿主改一个字之后就永久失效，而且状态页可能还是绿的（#12 假绿）。
 *
 * 用法：
 *   node scripts/lint-anchors.mjs              # 摘要 + 最脆的 15 条
 *   node scripts/lint-anchors.mjs --all        # 列出全部有文案锚的补丁
 *   node scripts/lint-anchors.mjs --json out.json
 *   node scripts/lint-anchors.mjs --strict     # 文案锚超过 35% 或存在「纯文案锚」补丁时退出码 1
 */

import { writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const libDir = path.join(here, "..", "lib");
const { lintPatches, lintVerdict } = await import(pathToFileURL(path.join(libDir, "patch-anchor.js")).href);
const core = await import(pathToFileURL(path.join(libDir, "core.js")).href);

const argv = process.argv.slice(2);
const showAll = argv.includes("--all");
const strict = argv.includes("--strict");
const jsonIdx = argv.indexOf("--json");
const jsonOut = jsonIdx >= 0 ? argv[jsonIdx + 1] : null;

const { totals, rows } = lintPatches(core.ALL_PATCHES);
const verdict = lintVerdict(totals, { maxRatio: Number(process.env.DSH_PURGE_ANCHOR_MAX || 0.35) });

const brief = (fp) => String(fp ?? "").replace(/^.*node_modules\\@deepseek-ai\\/u, "<ai>\\").replace(/^.*resources\\app\\/u, "<app>\\");

if (jsonOut) writeFileSync(jsonOut, JSON.stringify({ totals, verdict, rows }, null, 1), "utf8");

console.log(`补丁 ${totals.patches} 条 / 锚点 ${totals.anchors} 个`);
console.log(`  结构锚 structural ${totals.structural}   正则 regex ${totals.regex}   混合 mixed ${totals.mixed}`);
console.log(`  文案锚 zh-copy ${totals.zhCopy}   en-copy ${totals.enCopy}   合计 ${totals.fragile}（占 ${(totals.fragileRatio * 100).toFixed(1)}%）`);
console.log(`  含文案锚的补丁 ${totals.patchesWithFragile} 条，其中整条只靠文案锚 ${totals.patchesOnlyFragile} 条`);
console.log(`  判定: ${verdict.ok ? "OK" : "FAIL"}${verdict.ok ? "" : ` — ${verdict.reasons.join("; ")}`}`);

const listed = showAll ? rows.filter((r) => r.fragile > 0) : rows.filter((r) => r.fragile > 0).slice(0, 15);
if (listed.length > 0) {
  console.log("");
  console.log(showAll ? "全部含文案锚的补丁：" : "最脆的 15 条（按文案锚数量）：");
  for (const row of listed) {
    console.log(`\n  #${String(row.id).padEnd(3)} ${String(row.name).padEnd(34)} fragile=${row.fragile}/${row.anchors.length}${row.onlyFragile ? "  [纯文案]" : ""}  ${brief(Array.isArray(row.file) ? row.file[0] : row.file)}`);
    for (const a of row.anchors.filter((x) => x.fragile)) {
      console.log(`       ${a.kind.padEnd(8)} ${a.sample}`);
    }
  }
}

process.exit(strict && !verdict.ok ? 1 : 0);
