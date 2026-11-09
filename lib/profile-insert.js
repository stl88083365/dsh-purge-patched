/**
 * 用户层 profile/cordis.patch.yml 的本体 insert（#154 / #159 / #191）。
 *
 * 包内 overlay 只改已入队行的 inject/config，不能再 insert 一次（Hub 已入队会
 * already queued）。postinstall 和演练台子行都走这里：行不存在就写一条。
 *
 * #191：文件本身是一个完整文档时（宿主生成的空 flow 序列 `[]`），不能再追加，
 * 追加会变成第二个文档，宿主启动解析失败。
 */
import fs from "node:fs";
import path from "node:path";
import { atomicWriteSync } from "./core.js";

export const PURGE_NAME = "dsh-purge";

/**
 * 本体行在用户层的行 id（#192）。
 *
 * 必须和包内 bundle patch 的 overlay id 不同：宿主的插件开关是按行 id 往用户层
 * 写 `- id: <id> / disabled: true|false` 的覆盖项。若本体行的 id 与 bundle patch
 * 里那笔 overlay 同 id，开关就会连带把那笔 overlay 一起关掉，表现成「插件被自己
 * 关掉、UI 静默消失」。分开之后，开关只作用在用户层这条 insert 行上。
 */
export const PURGE_ROW_ID = "dsh-purge-profile";

/** 历史 id（老版本 insert 用的），迁移时认这些。 */
export const LEGACY_ROW_IDS = ["dsh-purge", "dsh-purge-main"];

/**
 * 本体行的完整配置：原先写在包内 bundle patch 的 `- id: dsh-purge` overlay 里，
 * 现在收进 insert 自身，bundle patch 不再引用本体行（#192）。
 */
export const INSERT_CONFIG = [
  ["enabled", "true"],
  ["autoApplyOnStart", "false"],
  ["autoUpdateOnStart", "false"],
  ["autoRevertOnMissing", "false"],
  ["injectOnce", "false"],
  ["stripMnemon", "true"],
  ["verbose", "false"],
  ['postPrompt', '""'],
  ["postPromptOrder", "5100"],
  ["autoRetry", "true"],
  ["retryMax", "3"],
  ["autoContinue", "false"],
  ["continueMax", "3"],
  ['continueText', '"继续"'],
  ["capabilityProtocol", "true"],
  ["hooksDenyBypass", "true"],
  ["anchorMode", "auto"],
  ["subagentControl", "true"],
];

export const INSERT_BLOCK = [
  "- insert:",
  `    - id: ${PURGE_ROW_ID}`,
  "      name: dsh-purge",
  "      inject: [systemPrompt, tools]",
  "      config:",
  ...INSERT_CONFIG.map(([k, v]) => `        ${k}: ${v}`),
  "",
].join("\n");

export function profileHasPurgeBodyInsert(text) {
  const lines = String(text || "").split(/\r?\n/);
  let insertIndent = -1;
  for (const line of lines) {
    if (/^-\s*insert:\s*$/.test(line) || /^\s+-\s*insert:\s*$/.test(line)) {
      insertIndent = (line.match(/^[ \t]*/) || [""])[0].length;
      continue;
    }
    if (insertIndent < 0) continue;
    const indent = (line.match(/^[ \t]*/) || [""])[0].length;
    const trimmed = line.trim();
    if (trimmed && indent <= insertIndent && /^-\s/.test(trimmed)) {
      insertIndent = -1;
      if (/^-\s*insert:\s*$/.test(trimmed)) {
        insertIndent = indent;
      }
      continue;
    }
    // 本体行：PURGE_ROW_ID（新），或历史 id dsh-purge / dsh-purge-main（#159 临时绕过写法）
    if (/^-\s*id:\s*dsh-purge(-main|-profile)?\s*$/.test(trimmed)) return true;
    // 历史上也有人只写 name: dsh-purge 的裸行
    if (/^-\s*name:\s*dsh-purge\s*$/.test(trimmed)) return true;
  }
  return false;
}

/**
 * 判断 cordis.patch.yml 的数据部分形态（#191）。
 *
 * 宿主生成的 profile 层 patch 文件可能整体只有一个空 flow 序列 `[]`，
 * 那是**一个完整 YAML 文档**。往文件尾追加 `- insert:` 会变成第二个文档，
 * 宿主启动解析报 "end of the stream or a document separator is expected"。
 *
 * 只看最后一个文档的根节点类型（追加内容落在最后一个文档里）：
 *   - "empty"       没有数据行（空文件 / 只有注释和空行）
 *   - "empty-flow"  数据部分恰好是空 flow 序列 `[]`（可带 `---` 前缀）
 *   - "block-seq"   正常块序列（顶层 `- ...`），沿用旧的追加行为
 *   - "flow-seq"    非空 flow 序列（宿主/用户内容，动不得）
 *   - "unknown"     其它形态（顶层映射等），认不准就不写
 */
export function classifyPatchBody(text) {
  const lines = String(text || "").replace(/\r\n/g, "\n").split("\n");
  const dataLines = [];
  for (let i = 0; i < lines.length; i += 1) {
    const trimmed = lines[i].trim();
    if (!trimmed) continue; // 空行
    if (trimmed.startsWith("#")) continue; // 注释行
    dataLines.push({ index: i, trimmed });
  }
  // 按 `---` 切成多个文档，只看最后一个（追加内容会落在最后一个文档里）
  const lastDoc = [];
  for (const item of dataLines) {
    if (item.trimmed === "---") {
      lastDoc.length = 0;
      continue;
    }
    lastDoc.push(item);
  }
  if (lastDoc.length === 0) return { kind: "empty", lines };
  // 空 flow 序列：`[]` / `[ ]`，允许行尾注释
  if (lastDoc.length === 1 && /^\[\s*\]\s*(#.*)?$/.test(lastDoc[0].trimmed)) {
    return { kind: "empty-flow", lines, emptyFlowIndex: lastDoc[0].index };
  }
  if (lastDoc[0].trimmed.startsWith("[")) return { kind: "flow-seq", lines };
  if (/^-(\s|$)/.test(lastDoc[0].trimmed)) {
    // 块序列里混进顶层 flow 序列 → 本身就是坏 YAML，认不准就不动
    if (lastDoc.slice(1).some((item) => item.trimmed.startsWith("["))) return { kind: "unknown", lines };
    return { kind: "block-seq", lines };
  }
  return { kind: "unknown", lines };
}

/**
 * 把已存在的本体 insert 块规范化成当前 INSERT_BLOCK（#192）。
 *
 * 只动我们自己的那块：从 `- insert:` 那一行开始，吞掉其后所有缩进更深的行（含
 * 空行，遇到同级或更浅的下一条 `- ` 就停）。块内容整体替换为 INSERT_BLOCK：
 *   - 行 id 迁到 PURGE_ROW_ID，避免用户层与 bundle patch 的 overlay 撞 id；
 *   - 原先由 bundle overlay 提供的那些 config 键补进 insert 自身。
 * 返回 changed=false 表示已经不是旧块或无需改。
 */
export function canonicalizeInsertBlock(text) {
  const raw = String(text || "");
  const lines = raw.split(/\r?\n/);
  const out = [];
  let changed = false;
  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    const m = /^([ \t]*)-\s*insert:\s*$/.exec(line);
    if (!m) { out.push(line); continue; }
    const baseIndent = m[1].length;
    let end = i + 1;
    while (end < lines.length) {
      const next = lines[end];
      if (!next.trim()) { end += 1; continue; }
      const indent = (next.match(/^[ \t]*/) || [""])[0].length;
      if (indent <= baseIndent && /^[ \t]*-/.test(next)) break;
      end += 1;
    }
    const body = lines.slice(i, end).join("\n");
    if (!/^[ \t]+-\s*id:\s*dsh-purge(-main|-profile)?\s*$/m.test(body)) {
      // 不是本体 insert 块，原样保留
      out.push(...lines.slice(i, end));
      i = end - 1;
      continue;
    }
    if (body.includes(INSERT_BLOCK.replace(/\n$/, ""))) {
      out.push(...lines.slice(i, end));
      i = end - 1;
      continue;
    }
    out.push(...INSERT_BLOCK.replace(/\n$/, "").split("\n"));
    changed = true;
    i = end - 1;
  }
  // 迁移遗留的开关行：id 是历史本体 id、且只带 disabled 的顶层覆盖项。行 id 改成
  // PURGE_ROW_ID 之后它已经指不到任何行，留着只会让宿主报 entry not found。
  const kept = [];
  for (let i = 0; i < out.length; i += 1) {
    const line = out[i];
    if (!/^-\s*id:\s*dsh-purge(-main)?\s*$/.test(line)) { kept.push(line); continue; }
    let end = i + 1;
    while (end < out.length) {
      const next = out[end];
      if (!next.trim()) { end += 1; continue; }
      if (/^[ \t]*-/.test(next)) break;
      end += 1;
    }
    const block = out.slice(i, end).join("\n");
    if (!/^[ \t]+disabled:\s*(true|false)\s*$/m.test(block)) { kept.push(line); continue; }
    changed = true;
    i = end - 1;
  }
  return { text: kept.join("\n"), changed };
}

export function ensureProfileBodyInsert(profileDir) {
  const fp = path.join(profileDir, "cordis.patch.yml");
  let text = "";
  try { text = fs.readFileSync(fp, "utf8"); } catch { text = ""; }
  if (profileHasPurgeBodyInsert(text)) {
    const canon = canonicalizeInsertBlock(text);
    if (!canon.changed) return { ok: true, wrote: false, path: fp };
    atomicWriteSync(fp, canon.text, "utf8");
    return { ok: true, wrote: true, path: fp, migrated: true };
  }
  const shape = classifyPatchBody(text);
  if (shape.kind === "empty-flow") {
    // `[]` 本身是一个完整文档：把整行替换成 insert 块，绝不追加成第二个文档（#191）
    const blockLines = INSERT_BLOCK.replace(/\n$/, "").split("\n");
    const out = [
      ...shape.lines.slice(0, shape.emptyFlowIndex),
      ...blockLines,
      ...shape.lines.slice(shape.emptyFlowIndex + 1),
    ].join("\n");
    atomicWriteSync(fp, `${out.endsWith("\n") ? out : `${out}\n`}`, "utf8");
    return { ok: true, wrote: true, path: fp };
  }
  if (shape.kind === "flow-seq" || shape.kind === "unknown") {
    // 宿主 / 用户自己的内容，宁可不动也别写坏（#191）
    return { ok: false, wrote: false, path: fp };
  }
  // 空文件 / 只有注释 → 直接写 insert 块；正常块序列 → 沿用旧的追加行为
  const prefix = text && !text.endsWith("\n") ? "\n" : "";
  atomicWriteSync(fp, `${text}${prefix}${text ? "\n" : ""}${INSERT_BLOCK}`, "utf8");
  return { ok: true, wrote: true, path: fp };
}

function readJson(fp) {
  try {
    return JSON.parse(fs.readFileSync(fp, "utf8"));
  } catch {
    return null;
  }
}

function profileOwnsPurge(dir) {
  const pkg = readJson(path.join(dir, "package.json"));
  const bundles = pkg?.dsh?.profile?.bundles;
  if (Array.isArray(bundles) && bundles.includes(PURGE_NAME)) return true;
  try {
    return fs.existsSync(path.join(dir, "node_modules", PURGE_NAME, "package.json"));
  } catch {
    return false;
  }
}

export function listProfileDirs(dshHome) {
  const root = path.join(dshHome || "", "profiles");
  const out = [];
  let names = [];
  try { names = fs.readdirSync(root); } catch { return out; }
  for (const name of names) {
    const dir = path.join(root, name);
    try {
      if (fs.statSync(dir).isDirectory()) out.push(dir);
    } catch { /* skip */ }
  }
  return out;
}

export function ensureProfileBundles(profileDir) {
  const fp = path.join(profileDir, "package.json");
  const pkg = readJson(fp);
  if (!pkg) return { ok: false, wrote: false, path: fp };
  pkg.dsh = pkg.dsh && typeof pkg.dsh === "object" ? pkg.dsh : {};
  pkg.dsh.profile = pkg.dsh.profile && typeof pkg.dsh.profile === "object" ? pkg.dsh.profile : {};
  const bundles = Array.isArray(pkg.dsh.profile.bundles) ? pkg.dsh.profile.bundles : [];
  if (bundles.includes(PURGE_NAME)) return { ok: true, wrote: false, path: fp };
  pkg.dsh.profile.bundles = [...bundles, PURGE_NAME];
  atomicWriteSync(fp, `${JSON.stringify(pkg, null, 2)}\n`, "utf8");
  return { ok: true, wrote: true, path: fp };
}

/**
 * pnpm allowBuilds 期望键（#185 / #193）。
 *
 * 两种写法各有用处，所以两样都写：
 *   - 裸包名 `dsh-purge`：registry / 普通 tarball 形态按包名匹配即可；
 *   - `dsh-purge@<lockfile 里的 tarball URL>`：pnpm 11.28.5（DSH 0.2.2 内置）对
 *     `github:` 依赖只按「包名@解析出的 codeload URL」认账，裸包名会被判定成
 *     ERR_PNPM_IGNORED_BUILDS，下一次 install 直接 exit 1、postinstall 不跑（#193 实测）。
 *
 * 合格键不能预先编出来（sha 要等解析完才知道），所以从 profile 的 pnpm-lock.yaml
 * 里取 dsh-purge 实际解析到的 tarball URL。拿不到就只写裸包名。
 *
 * 注：pnpm 11.2.2 曾把 `dsh-purge@https://…` 当成版本联合报 ERR_PNPM_INVALID_VERSION_UNION，
 * 11.28.5 已经没有这个问题；同时 11.28.5 又不再认裸包名，故两者并存最稳。
 */
export function purgePnpmBuildSpecs(profileDir) {
  return [PURGE_NAME, ...purgeLockfileBuildSpecs(profileDir)];
}

/** 从 pnpm-lock.yaml 里读 dsh-purge 解析到的 tarball URL，拼成 `dsh-purge@<url>`（#193）。 */
function purgeLockfileBuildSpecs(profileDir) {
  if (!profileDir) return [];
  let lock = "";
  try {
    lock = fs.readFileSync(path.join(profileDir, "pnpm-lock.yaml"), "utf8");
  } catch {
    return [];
  }
  const lines = lock.split(/\r?\n/);
  const out = [];
  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    if (!/tarball:\s*https?:\/\//.test(line)) continue;
    const window = lines.slice(Math.max(0, i - 12), i + 1).join("\n");
    if (!window.includes(PURGE_NAME)) continue;
    const m = line.match(/tarball:\s*['"]?(https?:\/\/[^\s'"}\]]+)/);
    if (!m) continue;
    const url = m[1];
    if (!/^https?:\/\//.test(url)) continue;
    const spec = `${PURGE_NAME}@${url}`;
    if (!out.includes(spec)) out.push(spec);
  }
  return out;
}

function isPurgeAllowBuildKey(key) {
  const name = String(key || "").replace(/^['"]|['"]$/g, "");
  return name === PURGE_NAME || name.startsWith(`${PURGE_NAME}@`);
}

/** 导出仅供单测 round-trip（#180）。 */
export function parseAllowBuildLine(line) {
  const text = String(line || "").replace(/\r$/, "");
  // 引号包裹：键整段取出，URL 里的冒号不会切碎键
  const quoted = text.match(/^[ \t]+(?:"([^"]+)"|'([^']+)')[ \t]*:[ \t]*(.*?)\s*$/);
  if (quoted) return { key: quoted[1] !== undefined ? quoted[1] : quoted[2], value: String(quoted[3] || "").trim() };
  // 未加引号的键：要求有缩进（顶层键不算），只在「冒号+空白（或行尾）」处切分，且取最后一次出现的位置——
  // URL 里的 `:` 后面跟的是 `/`，不会断键；`dsh-purge@https: true`（畸形历史键）也能正常切成键+值（#180）
  if (!/^[ \t]+/.test(text)) return null;
  let split = -1;
  for (let i = 0; i < text.length; i += 1) {
    if (text[i] !== ":") continue;
    if (i + 1 >= text.length || /[ \t]/.test(text[i + 1])) split = i;
  }
  if (split < 0) return null;
  const key = text.slice(0, split).trim();
  if (!key) return null;
  return { key, value: text.slice(split + 1).trim() };
}

/** 导出仅供单测 round-trip（#180）。 */
export function formatAllowBuildLine(key) {
  const name = String(key || "");
  // 含 `://` 的 URL 键加引号，避免 YAML 把 URL 里的冒号当分隔符（#180）
  if (name.includes("://")) return `  ${JSON.stringify(name)}: true`;
  return `  ${name}: true`;
}

/**
 * 重写前做最小校验：顶层键、allowBuilds 段内键都不重复，每个键写回格式都能被
 * parseAllowBuildLine 无损还原。校验不过就不写盘，宁可不动用户的文件（#180）。
 * 导出仅供单测（#180）。
 */
export function validateAllowBuildRewrite(text) {
  const lines = String(text || "").split("\n");
  let inAllow = false;
  let allowIndent = -1;
  const topKeys = new Set();
  const allowKeys = new Set();
  for (const line of lines) {
    if (!line.trim()) continue;
    const trimmed = line.trim();
    if (trimmed.startsWith("#")) continue; // 注释行原样保留，不参与校验
    if (/^\S/.test(line)) {
      inAllow = /^allowBuilds[ \t]*:/.test(line);
      allowIndent = -1;
      const m = line.match(/^(\S+?)[ \t]*:/);
      if (!m) return false;
      if (topKeys.has(m[1])) return false;
      topKeys.add(m[1]);
      continue;
    }
    if (!inAllow) continue;
    const indent = (line.match(/^[ \t]*/) || [""])[0].length;
    if (allowIndent < 0) allowIndent = indent;
    if (indent < allowIndent) {
      // 缩进回到 allowBuilds 的子键层级以上，说明段已结束
      inAllow = false;
      continue;
    }
    const parsed = parseAllowBuildLine(line);
    if (!parsed || !parsed.key) return false;
    const name = parsed.key;
    if (allowKeys.has(name)) return false;
    // 写回后的行必须能无损解析出同一个键
    if (parseAllowBuildLine(formatAllowBuildLine(name))?.key !== name) return false;
    allowKeys.add(name);
  }
  return true;
}

/**
 * 把 dsh-purge 写成 true，避免装别的插件还报 ERR_PNPM_IGNORED_BUILDS（#168）。
 *
 * #193：期望键 = 裸包名 + `dsh-purge@<lockfile tarball>`（见 purgePnpmBuildSpecs）。
 * 自愈时 `dsh-purge@*` 里只保留当前期望的键，其它历史键（旧 sha、旧截断键
 * `dsh-purge@https`、`@1.1.81` 版本键）一律丢弃；非 purge 键原样保留。
 */
export function rewritePnpmAllowBuilds(raw, profileDir) {
  const wanted = purgePnpmBuildSpecs(profileDir);
  const wantedSet = new Set(wanted);
  const text = String(raw || "").replace(/\r\n/g, "\n");
  const wantedBlock = wanted.map(formatAllowBuildLine);
  if (!text.trim()) {
    return `allowBuilds:\n${wantedBlock.join("\n")}\n`;
  }
  const lines = text.split(/\r?\n/);
  let start = -1;
  for (let i = 0; i < lines.length; i += 1) {
    if (/^allowBuilds[ \t]*:/.test(lines[i])) {
      start = i;
      break;
    }
  }
  if (start < 0) {
    const prefix = text.endsWith("\n") ? "" : "\n";
    return `${text}${prefix}\nallowBuilds:\n${wantedBlock.join("\n")}\n`;
  }
  let end = lines.length;
  const kept = [];
  const seen = new Set();
  for (let i = start + 1; i < lines.length; i += 1) {
    const line = lines[i];
    if (!line.trim()) {
      end = i;
      break;
    }
    if (/^\S/.test(line)) {
      end = i;
      break;
    }
    const trimmed = line.trim();
    if (trimmed.startsWith("#")) {
      kept.push(line);
      continue;
    }
    const parsed = parseAllowBuildLine(line);
    if (!parsed) {
      kept.push(line);
      continue;
    }
    if (isPurgeAllowBuildKey(parsed.key)) {
      // 只保留精确等于期望键的行，且去重；其余历史 purge 键丢弃（#180 自愈）
      if (!wantedSet.has(parsed.key) || seen.has(parsed.key)) continue;
      kept.push(formatAllowBuildLine(parsed.key));
      seen.add(parsed.key);
      continue;
    }
    // 非 purge 键原样保留；同键重复（会让 pnpm 报 duplicated mapping key）只留第一份
    if (seen.has(parsed.key)) continue;
    seen.add(parsed.key);
    kept.push(line);
  }
  for (let i = 0; i < wanted.length; i += 1) {
    if (!seen.has(wanted[i])) {
      kept.push(wantedBlock[i]);
      seen.add(wanted[i]);
    }
  }
  const next = [...lines.slice(0, start + 1), ...kept, ...lines.slice(end)].join("\n");
  return next.endsWith("\n") ? next : `${next}\n`;
}

/** pnpm 11/12 默认拦 postinstall（ERR_PNPM_IGNORED_BUILDS）。写进 profile 的 allowBuilds，下次 add 能跑脚本。 */
export function ensurePnpmAllowBuild(profileDir) {
  const fp = path.join(profileDir, "pnpm-workspace.yaml");
  let text = "";
  try { text = fs.readFileSync(fp, "utf8"); } catch { text = ""; }
  const current = String(text || "").replace(/\r\n/g, "\n");
  const next = rewritePnpmAllowBuilds(current, profileDir);
  if (next === current) return { ok: true, wrote: false, path: fp };
  // 写前校验不过就不写盘，宁可保持现状（#180）
  if (!validateAllowBuildRewrite(next)) return { ok: false, wrote: false, path: fp, reason: "allowBuilds-invalid" };
  atomicWriteSync(fp, next, "utf8");
  return { ok: true, wrote: true, path: fp };
}

/** 已装进 bundles / node_modules 但缺 insert 的 profile，补上本体行。 */
export function ensureAllProfileBodyInserts(dshHome) {
  return ensureAllProfileInstall(dshHome).map((item) => ({
    dir: item.dir,
    ok: item.ok,
    wrote: Boolean(item.insert?.wrote),
    path: item.insert?.path || path.join(item.dir || "", "cordis.patch.yml"),
    error: item.error,
  }));
}

/** bundles + 本体 insert + pnpm allowBuilds。postinstall 被跳过、升级覆盖 overlay 之后靠这条把按钮找回来。 */
export function ensureAllProfileInstall(dshHome) {
  const results = [];
  for (const dir of listProfileDirs(dshHome)) {
    if (!profileOwnsPurge(dir)) continue;
    try {
      const bundles = ensureProfileBundles(dir);
      const insert = ensureProfileBodyInsert(dir);
      const pnpm = ensurePnpmAllowBuild(dir);
      results.push({ dir, ok: true, bundles, insert, pnpm });
    } catch (error) {
      results.push({
        dir,
        ok: false,
        error: error && error.message ? error.message : String(error),
      });
    }
  }
  return results;
}
