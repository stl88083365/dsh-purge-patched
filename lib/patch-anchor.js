/**
 * 补丁锚点分类（P2）。
 *
 * 背景：86 条补丁里有相当一部分 pattern 锚的是官方**文案整句**。官方改一个词
 * （0.2.2 把 `undefined` 写成 `void 0`、把 `Approval policy: ask.` 整句换掉），
 * 这些 pattern 就永久不命中，补丁静默失效 —— #12 假绿就是这么来的。
 *
 * 这里把“锚点类型”变成可判定的东西，让 lint 能在提交前拦住新的文案锚：
 *   structural  —— 锚 import / 函数名 / 变量赋值 / region 注释这类结构
 *   zh-copy     —— 整句中文文案（官方一改就废）
 *   en-copy     —— 整句英文文案
 *   mixed       —— 结构 + 文案混在一起（危险，但比纯文案好定位）
 *   regex       —— RegExp，不参与文案判定
 *
 * 规则本身不阻断写入，只产出报告；`--strict` 下才按阈值失败。
 */

/** 拉丁字母/标点里的代码痕迹：出现即认为锚到了结构。 */
const CODE_TOKENS = /(?:=>|===|!==|[;{}[\]]|\b(?:import|export|const|let|var|function|class|return|await|async|if|else|for|while|switch|case|try|catch|throw|new|typeof|instanceof)\b|\.\s*\w+\s*\(|\w+\s*:\s*)/u;

const CJK_RE = /[\u4e00-\u9fff]/gu;
const STRUCTURAL_HINT_RE = /(?:^|\n)\s*(?:import|export|const|let|var|function|class|return|if|for|while|switch|try|catch)\b|=>|\/\/#region|#region/u;

function cjkCount(text) {
  const hits = String(text).match(CJK_RE);
  return hits ? hits.length : 0;
}

function latinWordCount(text) {
  const hits = String(text).match(/[A-Za-z]{2,}/g);
  return hits ? hits.length : 0;
}

/**
 * 判定一条 pattern 的锚点类型。
 * @param {string|RegExp} pattern
 * @returns {{kind: "regex"|"structural"|"mixed"|"zh-copy"|"en-copy"|"empty", fragile: boolean, reasons: string[]}}
 */
export function classifyAnchor(pattern) {
  if (pattern instanceof RegExp) return { kind: "regex", fragile: false, reasons: ["regexp"] };
  const text = String(pattern ?? "");
  if (text.trim().length === 0) return { kind: "empty", fragile: false, reasons: ["empty"] };

  const reasons = [];
  const cjk = cjkCount(text);
  const structural = STRUCTURAL_HINT_RE.test(text);
  const codey = CODE_TOKENS.test(text);
  const latin = latinWordCount(text);

  if (structural) reasons.push("structural-hint");
  if (cjk >= 6) reasons.push(`cjk:${cjk}`);
  if (text.length > 200) reasons.push(`wide:${text.length}`);

  if (cjk >= 6 && !structural && !(codey && cjk < 12)) {
    return { kind: "zh-copy", fragile: true, reasons };
  }
  if (structural && codey && cjk < 6) return { kind: "structural", fragile: false, reasons };
  if (!structural && !codey && latin >= 4 && text.trim().length >= 24) {
    return { kind: "en-copy", fragile: true, reasons };
  }
  if (structural || codey) return { kind: "mixed", fragile: cjk >= 6, reasons };
  if (cjk >= 6) return { kind: "zh-copy", fragile: true, reasons };
  return { kind: "structural", fragile: false, reasons };
}

/** 一条补丁的 replacements / patterns 归一。 */
export function replacementsOf(patch) {
  if (Array.isArray(patch?.replacements)) return patch.replacements;
  const patterns = Array.isArray(patch?.patterns) ? patch.patterns : patch?.pattern !== undefined ? [patch.pattern] : [];
  return patterns.map((pattern) => ({ pattern, replace: patch?.replace }));
}

const clip = (text, n = 90) => {
  const one = String(text ?? "").replace(/\s+/gu, " ").trim();
  return one.length > n ? `${one.slice(0, n)}…` : one;
};

/**
 * 给整张补丁表打分。
 * @param {Array} patches ALL_PATCHES
 * @returns {{totals: object, rows: Array}}
 */
export function lintPatches(patches = []) {
  const rows = [];
  const totals = { patches: 0, anchors: 0, fragile: 0, zhCopy: 0, enCopy: 0, structural: 0, regex: 0, mixed: 0, patchesWithFragile: 0, patchesOnlyFragile: 0 };

  for (const patch of patches) {
    const anchors = replacementsOf(patch).map((rep) => {
      const verdict = classifyAnchor(rep.pattern);
      return { kind: verdict.kind, fragile: verdict.fragile, reasons: verdict.reasons, sample: clip(rep.pattern) };
    });
    if (anchors.length === 0) continue;
    totals.patches += 1;
    const fragileAnchors = anchors.filter((a) => a.fragile);
    if (fragileAnchors.length > 0) totals.patchesWithFragile += 1;
    if (fragileAnchors.length === anchors.length) totals.patchesOnlyFragile += 1;
    totals.anchors += anchors.length;
    totals.fragile += fragileAnchors.length;
    for (const a of anchors) {
      if (a.kind === "zh-copy") totals.zhCopy += 1;
      else if (a.kind === "en-copy") totals.enCopy += 1;
      else if (a.kind === "structural") totals.structural += 1;
      else if (a.kind === "regex") totals.regex += 1;
      else if (a.kind === "mixed") totals.mixed += 1;
    }
    rows.push({
      id: patch.id,
      name: patch.name,
      file: patch.file,
      anchors,
      fragile: fragileAnchors.length,
      onlyFragile: fragileAnchors.length === anchors.length,
    });
  }

  totals.fragileRatio = totals.anchors > 0 ? Number((totals.fragile / totals.anchors).toFixed(3)) : 0;
  rows.sort((a, b) => b.fragile - a.fragile || Number(a.id) - Number(b.id));
  return { totals, rows };
}

/** `--strict` 用的判定：文案锚占比超过阈值就算不通过。 */
export function lintVerdict(totals, options = {}) {
  const maxRatio = Number.isFinite(options.maxRatio) ? options.maxRatio : 0.35;
  const failOnOnlyFragile = options.failOnOnlyFragile !== false;
  const reasons = [];
  if (totals.fragileRatio > maxRatio) reasons.push(`fragile anchors ${totals.fragile}/${totals.anchors} > ${maxRatio}`);
  if (failOnOnlyFragile && totals.patchesOnlyFragile > 0) reasons.push(`${totals.patchesOnlyFragile} patches anchor only on copy text`);
  return { ok: reasons.length === 0, reasons, maxRatio };
}
