/**
 * 补丁写入后的“事务”收尾（P2）。
 *
 * 现状：`core.applyPatches` 是逐条补丁、逐文件直接 `saveText()`。补丁本身的 pattern 命中
 * 校验已经做了（`hitMismatch` 会整条拒写），但**写完的产物是不是还能解析**没人管：
 * 一次 replace 的锚点只命中半句，就可能拼出语法错误，下一次启动宿主直接起不来，
 * 用户只能回滚整个 resources/app。
 *
 * 这里补上最后一环：把所有实际写过的文件统一做语法校验，坏掉的用 `.dshpurge.bak` 覆盖回去
 * 并把对应补丁降级成 drifted —— 宁可少一条补丁，也不留一个起不来的宿主。
 *
 * 为什么不是每写一个文件就同步校验：Windows 上 `node --check` 单次 60~100ms，
 * 58 个文件串行要 6s 左右。批量并行（默认 6 路）能把整个收尾压到 1s 内。
 */

import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const BAK_SUFFIX = ".dshpurge.bak";

/** 能靠语法校验兜住的文件类型；`.yml` 只做“能被读回”的兜底，不引解析器。 */
export function isCheckableFile(fp) {
  return /\.(js|mjs|cjs|json)$/i.test(String(fp || ""));
}

/**
 * 找一只可用的 node 来跑 `--check`。
 * 顺序：显式 env → 桌面自带 runtime → 当前进程（Electron 需 ELECTRON_RUN_AS_NODE=1）→ PATH 上的 node。
 */
export function resolveNodeBinary(env = process.env) {
  const explicit = String(env.DSH_PURGE_NODE || "").trim();
  if (explicit && fs.existsSync(explicit)) return { bin: explicit, args: [], env: {} };

  const home = String(env.DSH_HOME || "").trim();
  const roots = [home, path.join(process.env.USERPROFILE || process.env.HOME || "", ".dsh")].filter(Boolean);
  for (const root of roots) {
    const runtimeRoot = path.join(root, "dsh-runtimes");
    let dirs = [];
    try { dirs = fs.readdirSync(runtimeRoot, { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => d.name); } catch { continue; }
    for (const name of dirs) {
      const candidate = path.join(runtimeRoot, name, "dependencies", "node", "bin", process.platform === "win32" ? "node.exe" : "node");
      if (fs.existsSync(candidate)) return { bin: candidate, args: [], env: {} };
    }
  }

  // Electron 主进程：用同一个 exe 以 node 模式跑，避免依赖 PATH 上有没有 node。
  const isElectron = !!process.versions.electron;
  return {
    bin: process.execPath,
    args: [],
    env: isElectron ? { ELECTRON_RUN_AS_NODE: "1" } : {},
  };
}

function checkOne(binInfo, fp) {
  return new Promise((resolve) => {
    let child;
    try {
      child = spawn(binInfo.bin, [...binInfo.args, "--check", fp], {
        env: { ...process.env, ...binInfo.env },
        stdio: ["ignore", "pipe", "pipe"],
        windowsHide: true,
      });
    } catch (error) {
      resolve({ fp, ok: false, error: `spawn:${error?.message || error}` });
      return;
    }
    let stderr = "";
    child.stderr?.on("data", (chunk) => { if (stderr.length < 4096) stderr += String(chunk); });
    child.on("error", (error) => resolve({ fp, ok: false, error: `spawn:${error?.message || error}` }));
    child.on("close", (code) => {
      if (code === 0) resolve({ fp, ok: true, error: null });
      else {
        const firstLine = stderr.split(/\r?\n/u).map((l) => l.trim()).find(Boolean) || `exit ${code}`;
        resolve({ fp, ok: false, error: firstLine.slice(0, 300) });
      }
    });
  });
}

function checkJson(fp) {
  try {
    JSON.parse(fs.readFileSync(fp, "utf8"));
    return { fp, ok: true, error: null };
  } catch (error) {
    return { fp, ok: false, error: `json:${error?.message || error}` };
  }
}

/**
 * 批量校验一组文件。
 * @param {string[]} files 实际写过的文件（调用方已去重）
 * @param {{concurrency?: number, binInfo?: object}} options
 * @returns {Promise<Array<{fp: string, ok: boolean, error: string|null}>>}
 */
export async function verifyFiles(files, options = {}) {
  const list = [...new Set((files || []).filter((fp) => fp && fs.existsSync(fp) && isCheckableFile(fp)))];
  if (list.length === 0) return [];
  const binInfo = options.binInfo || resolveNodeBinary();
  const concurrency = Math.max(1, Math.min(12, Number(options.concurrency) || 6));
  const out = [];
  let cursor = 0;

  const worker = async () => {
    for (;;) {
      const index = cursor++;
      if (index >= list.length) return;
      const fp = list[index];
      out[index] = /\.json$/i.test(fp) ? checkJson(fp) : await checkOne(binInfo, fp);
    }
  };
  await Promise.all(Array.from({ length: Math.min(concurrency, list.length) }, worker));
  return out.filter(Boolean);
}

/** 用 `.dshpurge.bak` 覆盖回去；没有备份就只报告，不动文件。 */
export function restoreFromBak(fp) {
  const bak = fp + BAK_SUFFIX;
  if (!fs.existsSync(bak)) return { restored: false, reason: "no-backup" };
  try {
    fs.copyFileSync(bak, fp);
    return { restored: true, reason: "copied" };
  } catch (error) {
    return { restored: false, reason: `copy-failed:${error?.message || error}` };
  }
}

/**
 * 写之前确保有回滚料：`.dshpurge.bak` 不存在时，把当前内容（官方原版，或上一次的已补丁版）
 * 存一份。
 *
 * `atomicWriteFile` 只保证写入原子，不留旧内容 —— 没有 bak 时一旦校验失败就无料可回滚，
 * 只能报 drifted 并把坏文件留在宿主里，那正是要避免的。已有 bak 不覆盖：保留最原始那份，
 * 重复 apply 才不会把「已打补丁的版本」当成原版存进去。
 */
export function ensureBak(fp) {
  const bak = fp + BAK_SUFFIX;
  if (fs.existsSync(bak)) return { created: false, reason: "exists" };
  try {
    fs.copyFileSync(fp, bak);
    return { created: true, reason: "copied" };
  } catch (error) {
    return { created: false, reason: `copy-failed:${error?.message || error}` };
  }
}

/**
 * 校验 + 回滚一步到位。
 * @returns {Promise<{checked: number, broken: Array<{fp: string, error: string, restored: boolean, reason: string}>}>}
 */
export async function verifyAndRollback(files, options = {}) {
  const results = await verifyFiles(files, options);
  const broken = [];
  for (const row of results) {
    if (row.ok) continue;
    const rollback = restoreFromBak(row.fp);
    broken.push({ fp: row.fp, error: row.error, restored: rollback.restored, reason: rollback.reason });
  }
  return { checked: results.length, broken };
}
