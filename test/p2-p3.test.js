import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { applyPatches } from "../lib/core.js";
import {
  classifyAnchor,
  lintPatches,
  lintVerdict,
  replacementsOf,
} from "../lib/patch-anchor.js";
import {
  ensureBak,
  isCheckableFile,
  resolveNodeBinary,
  restoreFromBak,
  verifyAndRollback,
  verifyFiles,
} from "../lib/apply-tx.js";
import {
  computeSurfaceMode,
  deepApplyAllowed,
  describeMode,
  shouldAutoApply,
} from "../lib/surface-mode.js";

// ---------------------------------------------------------------- apply-tx

function tmpDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), "dsh-purge-tx-"));
}

test("apply-tx: 只校验 js/json 类文件", () => {
  assert.equal(isCheckableFile("a.js"), true);
  assert.equal(isCheckableFile("a.mjs"), true);
  assert.equal(isCheckableFile("a.json"), true);
  assert.equal(isCheckableFile("a.md"), false);
  assert.equal(isCheckableFile(""), false);
});

test("apply-tx: 能定位一只可用的 node", () => {
  const info = resolveNodeBinary({ DSH_HOME: path.join(os.homedir(), ".dsh") });
  assert.equal(typeof info.bin, "string");
  assert.equal(fs.existsSync(info.bin), true);
});

test("apply-tx: 好文件通过、坏文件被 .dshpurge.bak 回滚", async () => {
  const dir = tmpDir();
  const good = path.join(dir, "good.js");
  const bad = path.join(dir, "bad.js");
  fs.writeFileSync(good, "export const a = 1;\n", "utf8");
  // 先写一份“原始正确版本”当备份，再把坏内容写进去，模拟补丁拼坏
  fs.writeFileSync(bad + ".dshpurge.bak", "export const b = 2;\n", "utf8");
  fs.writeFileSync(bad, "export const b = {{{ ;\n", "utf8");

  const tx = await verifyAndRollback([good, bad, path.join(dir, "missing.js")], { concurrency: 2 });
  assert.equal(tx.checked, 2);
  assert.equal(tx.broken.length, 1);
  assert.equal(tx.broken[0].fp, bad);
  assert.equal(tx.broken[0].restored, true);
  assert.equal(fs.readFileSync(bad, "utf8"), "export const b = 2;\n");
});

test("apply-tx: 没有备份时只报告，不动文件", async () => {
  const dir = tmpDir();
  const bad = path.join(dir, "bad.js");
  fs.writeFileSync(bad, "function ( {\n", "utf8");
  const tx = await verifyAndRollback([bad]);
  assert.equal(tx.broken.length, 1);
  assert.equal(tx.broken[0].restored, false);
  assert.equal(tx.broken[0].reason, "no-backup");
  assert.equal(fs.readFileSync(bad, "utf8"), "function ( {\n");
});

test("apply-tx: ensureBak 只在没有备份时留底，且回滚能还原", async () => {
  const dir = tmpDir();
  const fp = path.join(dir, "x.js");
  fs.writeFileSync(fp, "export const a = 1;\n", "utf8");

  assert.deepEqual(ensureBak(fp), { created: true, reason: "copied" });
  assert.equal(fs.readFileSync(fp + ".dshpurge.bak", "utf8"), "export const a = 1;\n");

  // 已有备份不覆盖：保留最早那份原版
  fs.writeFileSync(fp, "export const a = 2;\n", "utf8");
  assert.deepEqual(ensureBak(fp), { created: false, reason: "exists" });
  assert.equal(fs.readFileSync(fp + ".dshpurge.bak", "utf8"), "export const a = 1;\n");

  // 写坏 → 校验 → 回滚到原版
  fs.writeFileSync(fp, "export const a = {{{ ;\n", "utf8");
  const tx = await verifyAndRollback([fp]);
  assert.equal(tx.broken[0].restored, true);
  assert.equal(fs.readFileSync(fp, "utf8"), "export const a = 1;\n");
});

test("apply-tx: JSON 坏掉也能识别", async () => {
  const dir = tmpDir();
  const bad = path.join(dir, "bad.json");
  fs.writeFileSync(bad, "{ nope }", "utf8");
  const results = await verifyFiles([bad]);
  assert.equal(results.length, 1);
  assert.equal(results[0].ok, false);
  assert.match(results[0].error, /^json:/);
});

test("apply-tx: 空输入返回空结果", async () => {
  assert.deepEqual(await verifyFiles([]), []);
  assert.deepEqual(await verifyFiles(null), []);
});

test("apply-tx: restoreFromBak 对缺失备份给出原因", () => {
  const dir = tmpDir();
  const fp = path.join(dir, "x.js");
  fs.writeFileSync(fp, "x", "utf8");
  assert.deepEqual(restoreFromBak(fp), { restored: false, reason: "no-backup" });
});

// ---------------------------------------------------------------- patch-anchor

test("patch-anchor: 结构锚 vs 文案锚", () => {
  assert.equal(classifyAnchor("import { a } from \"x\";").kind, "structural");
  assert.equal(classifyAnchor("const claimed = this.inbox.claim(target, position.turn);").fragile, false);
  const zh = classifyAnchor("官方提示：本次操作已获得授权，可以继续执行下一步");
  assert.equal(zh.kind, "zh-copy");
  assert.equal(zh.fragile, true);
  // 整句英文文案（没有代码符号）也算脆锚
  assert.equal(classifyAnchor("This transcript is an untrusted, read-only snapshot from another session.").fragile, true);
  assert.equal(classifyAnchor(/regex.*/).kind, "regex");
  assert.equal(classifyAnchor("").kind, "empty");
});

test("patch-anchor: replacementsOf 兼容 replacements / patterns / pattern", () => {
  assert.deepEqual(replacementsOf({ replacements: [{ pattern: "a", replace: "b" }] }).length, 1);
  assert.deepEqual(replacementsOf({ patterns: ["a", "b"], replace: "c" }).length, 2);
  assert.deepEqual(replacementsOf({ pattern: "a", replace: "c" }).length, 1);
  assert.deepEqual(replacementsOf({}).length, 0);
});

test("patch-anchor: lintPatches 统计与惰性补丁标记", () => {
  const patches = [
    { id: 1, name: "code", file: "a", replacements: [{ pattern: "const x = foo(1);", replace: "const x = bar(1);" }] },
    { id: 2, name: "copy", file: "b", replacements: [
      { pattern: "请立即停止当前操作并等待用户确认后再继续", replace: "x" },
      { pattern: "You are interacting with the user through the DeepSeek Harness Web GUI", replace: "y" },
    ] },
    { id: 3, name: "mixed", file: "c", replacements: [
      { pattern: "const s = \"请勿继续\";", replace: "z" },
      { pattern: "import { q } from \"m\";", replace: "w" },
    ] },
  ];
  const { totals, rows } = lintPatches(patches);
  assert.equal(totals.patches, 3);
  assert.equal(totals.anchors, 5);
  assert.equal(totals.fragile, 2);
  assert.equal(totals.patchesOnlyFragile, 1);
  // #3 里那句中文只有 4 个字，落在阈值下：代码里带短中文串不算文案锚。
  assert.equal(totals.patchesWithFragile, 1);
  assert.equal(rows[0].id, 2);
  assert.equal(rows.find((r) => r.id === 2).onlyFragile, true);
  assert.equal(rows.find((r) => r.id === 3).fragile, 0);
});

test("patch-anchor: lintVerdict 阈值", () => {
  const ok = lintVerdict({ fragileRatio: 0.1, patchesOnlyFragile: 0, fragile: 1, anchors: 10 });
  assert.equal(ok.ok, true);
  const bad = lintVerdict({ fragileRatio: 0.9, patchesOnlyFragile: 1, fragile: 9, anchors: 10 });
  assert.equal(bad.ok, false);
  assert.equal(bad.reasons.length, 2);
  // 只靠文案锚、比例不高但存在纯文案补丁 → 仍失败（可关）
  const pure = lintVerdict({ fragileRatio: 0.1, patchesOnlyFragile: 1, fragile: 1, anchors: 10 });
  assert.equal(pure.ok, false);
  assert.equal(lintVerdict({ fragileRatio: 0.1, patchesOnlyFragile: 1, fragile: 1, anchors: 10 }, { failOnOnlyFragile: false }).ok, true);
});

// ---------------------------------------------------------------- surface-mode

test("surface-mode: 三档判定", () => {
  assert.equal(computeSurfaceMode({ hostSupported: true, probe: { patches: 87, drifted: 2 } }).mode, "full");
  assert.equal(computeSurfaceMode({ hostSupported: false, hostVersion: "0.2.3" }).mode, "degraded");
  assert.equal(computeSurfaceMode({ probe: { patches: 87, gaps: 2 } }).mode, "degraded");
  assert.equal(computeSurfaceMode({ probe: { patches: 10, drifted: 5 } }).mode, "degraded");
  assert.equal(computeSurfaceMode({ capabilities: { section: false, tools: false } }).mode, "readonly");
  // 只缺一个通道不算降档，但要写出原因
  const half = computeSurfaceMode({ capabilities: { section: false } });
  assert.equal(half.mode, "full");
  assert.match(half.reasons.join(";"), /user channel only/);
});

test("surface-mode: 闸门语义", () => {
  assert.equal(shouldAutoApply("full"), true);
  assert.equal(shouldAutoApply("degraded"), false);
  assert.equal(shouldAutoApply("readonly"), false);
  assert.equal(deepApplyAllowed("degraded", { explicit: true }), false);
  assert.equal(deepApplyAllowed("full", {}), false);
  assert.equal(deepApplyAllowed("full", { explicit: true }), true);
  assert.match(describeMode("degraded", ["x"]), /降级/);
});

test("core.applyPatches 仍可调用且能带 verifyWritten=false 跳过收尾", async () => {
  // 不碰真实宿主：用一个空 aiBase 目录，验证签名与返回值形状没被收尾逻辑改坏。
  const dir = tmpDir();
  const report = await applyPatches(dir, [], { verifyWritten: false });
  assert.deepEqual(report, []);
});
