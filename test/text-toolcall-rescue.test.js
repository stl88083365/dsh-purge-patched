import test from "node:test";
import assert from "node:assert/strict";
import { ALL_PATCHES, applyReplacementsToText } from "../lib/core.js";

const byId = (id) => ALL_PATCHES.find((p) => p.id === id);

test("#95 文本工具调用兜底：定义存在且带 marker", () => {
  const p = byId(95);
  assert.ok(p, "#95 应存在");
  assert.equal(p.file[0], "agent-loop");
  assert.ok(p.markers.includes("[dsh-purge] 文本工具调用兜底"));
});

test("#96 待处理任务续跑：定义存在且带 marker", () => {
  const p = byId(96);
  assert.ok(p, "#96 应存在");
  assert.equal(p.file[0], "agent-loop");
  assert.ok(p.markers.includes("[dsh-purge] todo continuation tracker"));
});

test("#95 在 assistant 无 tool-call 时识别正文里的 <tool_call>", () => {
  const p = byId(95);
  const src = p.replacements.map((r) => r.pattern).join("\n");
  const once = applyReplacementsToText(src, p, "");
  assert.equal(once.changed, true);
  assert.match(once.text, /__dshPurgeBadToolCall/);
  assert.match(once.text, /<tool_call\[\\s>\]|<function=/);
});

test("#96 在回合结束时注入续跑 followup，且保留原来的 hasPending 早退", () => {
  const p = byId(96);
  const src = p.replacements.map((r) => r.pattern).join("\n");
  const once = applyReplacementsToText(src, p, "");
  assert.equal(once.changed, true);
  assert.match(once.text, /dsh-purge-continue/);
  assert.match(once.text, /if \(!this\.inbox\.hasPending\) return false;/);
  assert.match(once.text, /phase\.abort = new AbortController\(\);/);
});

test("#96 续跑有次数上限与时间衰减，不会无限空转", () => {
  const p = byId(96);
  const src = p.replacements.map((r) => r.pattern).join("\n");
  const once = applyReplacementsToText(src, p, "");
  assert.match(once.text, /__dshPurgeContinueCap/);
  assert.match(once.text, /__dshPurgeContinueRounds <= _dshPurgeCap/);
  assert.match(once.text, /600000/);
});

test("#95/#96 二次应用不叠加", () => {
  for (const id of [95, 96]) {
    const p = byId(id);
    const src = p.replacements.map((r) => r.pattern).join("\n");
    const once = applyReplacementsToText(src, p, "");
    const twice = applyReplacementsToText(once.text, p, "");
    assert.equal(twice.text, once.text, `#${id} 二次应用仍在增长`);
  }
});
