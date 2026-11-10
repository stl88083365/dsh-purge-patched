#!/usr/bin/env node
/**
 * verify-inject.mjs —— 从会话日志里取证：破甲内核到底有没有送到模型。
 *
 * 为什么不用 `purge_status`：那个读的是补丁 marker（“文件改没改”），
 * 判不了“请求里有没有”。宿主升级后最常见的失效是“补丁还在、内核没发出去”，
 * 只有日志能证伪。
 *
 * 数据源：`$DSH_HOME/sessions/<cwd>/<session>/session.v4.jsonl.zstd`
 * （v4 日志按 zstd 压缩；解不开时按未压缩 JSONL 兜底）。
 *
 * 用法：
 *   node scripts/verify-inject.mjs                    # 最近一个会话
 *   node scripts/verify-inject.mjs --session <dir>     # 指定会话目录
 *   node scripts/verify-inject.mjs --all --limit 20    # 最近 20 个会话
 *   node scripts/verify-inject.mjs --mark "<子串>"      # 自定义内核特征串
 *   node scripts/verify-inject.mjs --json
 */

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { zstdDecompressSync } from "node:zlib";

function argOf(name, fallback = null) {
  const argv = process.argv.slice(2);
  const hit = argv.indexOf(`--${name}`);
  if (hit < 0) return fallback;
  const next = argv[hit + 1];
  return next && !next.startsWith("--") ? next : true;
}

const DSH_HOME = process.env.DSH_HOME || path.join(os.homedir(), ".dsh");
const SESSIONS = path.join(DSH_HOME, "sessions");
const json = argOf("json", false) === true;
const all = argOf("all", false) === true;
const limit = Number(argOf("limit", 1)) || 1;

function listSessionFiles() {
  const out = [];
  const walk = (dir, depth) => {
    let entries;
    try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch { return; }
    for (const entry of entries) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) { if (depth < 4) walk(full, depth + 1); continue; }
      if (entry.name === "session.v4.jsonl.zstd" || entry.name === "session.v4.jsonl") {
        try { out.push({ file: full, mtime: fs.statSync(full).mtimeMs }); } catch { /* skip */ }
      }
    }
  };
  walk(SESSIONS, 0);
  return out.sort((a, b) => b.mtime - a.mtime);
}

const ZSTD_MAGIC = 0xfd2fb528;

/**
 * 扫描宿主写出来的“多帧拼接”zstd 容器（session.v4.jsonl.zstd 就是这个格式）。
 * Node 24 的 zstdDecompressSync 只解第一个帧，直接把整个文件丢进去会静默只拿到 211 字节
 * —— 于是“没命中”会被误报成“没内核”。所以按帧切分再逐帧解。
 * 帧结构见 dsh-session-persistence-jsonl 的 scanZstdFrames。
 */
function scanZstdFrames(buffer) {
  const frames = [];
  let offset = 0;
  while (offset < buffer.length) {
    const start = offset;
    if (buffer.length - offset < 4) return { frames, tornStart: start };
    if (buffer.readUInt32LE(offset) !== ZSTD_MAGIC) return { frames, tornStart: null, invalid: true };
    offset += 4;
    if (offset === buffer.length) return { frames, tornStart: start };
    const descriptor = buffer.readUInt8(offset);
    offset += 1;
    const contentSizeFlag = descriptor >>> 6;
    const singleSegment = (descriptor & 32) !== 0;
    const checksum = (descriptor & 4) !== 0;
    const dictionaryFlag = descriptor & 3;
    const dictionaryBytes = dictionaryFlag === 3 ? 4 : dictionaryFlag;
    const contentSizeBytes = contentSizeFlag === 0 ? (singleSegment ? 1 : 0) : 1 << contentSizeFlag;
    const remainingHeaderBytes = (singleSegment ? 0 : 1) + dictionaryBytes + contentSizeBytes;
    if (buffer.length - offset < remainingHeaderBytes) return { frames, tornStart: start };
    offset += remainingHeaderBytes;
    for (;;) {
      if (buffer.length - offset < 3) return { frames, tornStart: start };
      const blockHeader = buffer.readUIntLE(offset, 3);
      offset += 3;
      const lastBlock = (blockHeader & 1) !== 0;
      const blockType = (blockHeader >>> 1) & 3;
      const blockSize = blockHeader >>> 3;
      if (blockType === 3) return { frames, tornStart: start, invalid: true };
      offset += blockType === 1 ? 1 : blockSize;
      if (buffer.length - offset < 0) return { frames, tornStart: start };
      if (lastBlock) break;
    }
    if (checksum) {
      if (buffer.length - offset < 4) return { frames, tornStart: start };
      offset += 4;
    }
    frames.push({ start, end: offset });
  }
  return { frames };
}

function decodeMultiFrame(raw) {
  const scanned = scanZstdFrames(raw);
  if (scanned.invalid || scanned.frames.length === 0) {
    // 不是宿主那种容器（例如单个帧或别的压缩器）：退回一次性解码。
    return { text: zstdDecompressSync(raw).toString("utf8"), frames: 1, torn: false };
  }
  const parts = [];
  for (const frame of scanned.frames) {
    try {
      parts.push(zstdDecompressSync(raw.subarray(frame.start, frame.end)));
    } catch {
      // 单帧损坏就跳过，不让整条日志作废（宿主的 torn 尾部就是这种）
    }
  }
  return { text: Buffer.concat(parts).toString("utf8"), frames: scanned.frames.length, torn: scanned.tornStart !== undefined };
}

function readLog(file) {
  const raw = fs.readFileSync(file);
  try {
    const decoded = decodeMultiFrame(raw);
    return { text: decoded.text, codec: `zstd(${decoded.frames}f${decoded.torn ? ",torn" : ""})`, error: null };
  } catch (error) {
    // 正在被宿主追加写的会话日志可能只有半个 zstd 帧：重试一次再判失败。
    // 注意不能退回“按 UTF-8 读压缩字节”——那会静默得到 0 命中，把“读不了”误报成“没内核”。
    try {
      const decoded = decodeMultiFrame(fs.readFileSync(file));
      return { text: decoded.text, codec: `zstd(${decoded.frames}f,retry)`, error: null };
    } catch (again) {
      return { text: "", codec: "zstd-unreadable", error: String(again?.message || error) };
    }
  }
}

function defaultMark() {
  // 特征串要能在 JSON 里原样出现：避开引号、反斜杠、尖括号（会被 \n / \" 改写或跨行断开），
  // 优先用 prompt-inject.md 里那句最稳的英文短句。
  try {
    const text = fs.readFileSync(path.join(DSH_HOME, "prompt-inject.md"), "utf8");
    const lines = text.split(/\r?\n/u).map((l) => l.trim());
    const prime = lines.find((l) => l.includes("PRIME DIRECTIVE"));
    if (prime) return "PRIME DIRECTIVE";
    const safe = lines.find((l) => l.length >= 20 && !/["\\<>`]/u.test(l) && !l.startsWith("<!--"));
    if (safe) return safe.slice(0, 24);
  } catch { /* fall back */ }
  return "PRIME DIRECTIVE";
}

const MARK = String(argOf("mark", defaultMark()));
const SENTINEL_RE = /dsh-purge:inject:[0-9a-f]{16}/u;

function inspect(file, mark) {
  const { text, codec, error } = readLog(file);
  const stats = {
    file,
    codec,
    decodeError: error || null,
    bytes: text.length,
    records: 0,
    systemMessages: 0,
    userMessages: 0,
    kernelInSystem: 0,
    kernelInUser: 0,
    sentinelHits: 0,
    firstKernelTurn: null,
    mark,
  };
  if (codec === "zstd-unreadable") {
    stats.ok = false;
    stats.unknown = true;
    return stats;
  }
  for (const line of text.split("\n")) {
    if (!line) continue;
    let record;
    try { record = JSON.parse(line); } catch { continue; }
    stats.records += 1;
    const type = record.type || "";
    if (type === "system/message") {
      stats.systemMessages += 1;
      const body = JSON.stringify(record.data?.message?.content ?? "");
      if (body.includes(mark)) {
        stats.kernelInSystem += 1;
        if (stats.firstKernelTurn === null) stats.firstKernelTurn = record.data?.turn ?? null;
      }
      if (SENTINEL_RE.test(body)) stats.sentinelHits += 1;
    } else if (type === "user/message") {
      stats.userMessages += 1;
      const body = JSON.stringify(record.data?.message?.content ?? "");
      if (body.includes(mark)) stats.kernelInUser += 1;
      if (SENTINEL_RE.test(body)) stats.sentinelHits += 1;
    } else if (type === "request/header") {
      const body = JSON.stringify(record.data ?? "");
      if (body.includes(mark)) stats.kernelInHeader = (stats.kernelInHeader || 0) + 1;
    }
  }
  stats.ok = stats.kernelInSystem + stats.kernelInUser > 0;
  return stats;
}

const explicit = argOf("session", null);
let files;
if (typeof explicit === "string" && explicit !== true) {
  const dir = fs.existsSync(explicit) && fs.statSync(explicit).isDirectory()
    ? path.join(explicit, "session.v4.jsonl.zstd")
    : explicit;
  files = [{ file: dir, mtime: 0 }];
} else {
  const listed = listSessionFiles();
  files = all ? listed.slice(0, limit) : listed.slice(0, 1);
}

if (files.length === 0) {
  console.error(`没有找到会话日志：${SESSIONS}`);
  process.exit(2);
}

const results = files.map((entry) => inspect(entry.file, MARK));

if (json) {
  console.log(JSON.stringify({ dshHome: DSH_HOME, mark: MARK, results }, null, 2));
} else {
  console.log(`DSH_HOME: ${DSH_HOME}`);
  console.log(`内核特征串: ${MARK}`);
  for (const r of results) {
    const rel = path.relative(SESSIONS, r.file);
    console.log("");
    console.log(`会话: ${rel}`);
    console.log(`  编码 ${r.codec} / ${r.bytes} 字节 / ${r.records} 条记录`);
    console.log(`  system/message ${r.systemMessages} 条，含内核 ${r.kernelInSystem}`);
    console.log(`  user/message   ${r.userMessages} 条，含内核 ${r.kernelInUser}`);
    console.log(`  注入哨兵命中 ${r.sentinelHits}${r.sentinelHits > 0 ? "（user 通道在投放）" : "（user 通道未投放）"}`);
    if (r.codec === "zstd-unreadable") {
      console.log(`  结论: ? 会话日志读不了（可能正在写入） ${r.decodeError || ""}`);
    } else {
      console.log(`  结论: ${r.ok ? "✓ 内核已送达模型" : "✗ 这条会话里没有内核"}`);
    }
  }
}

const anyOk = results.some((r) => r.ok);
const allUnknown = results.every((r) => r.unknown);
process.exit(anyOk ? 0 : allUnknown ? 3 : 1);
