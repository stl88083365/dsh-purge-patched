#!/usr/bin/env node
/**
 * 补齐 Desktop 安装包里缺失的 primary-runtime payload。
 *
 * 背景：0.2.2-rc.1 的 resources\runtime 只带 office-skills，primary-runtime 整个没有；
 * 而 desktop 启动 dsh-desktop-host 时把 source 写死成
 *   <resources>\runtime\primary-runtime
 * 于是 load_workspace_dependencies 在 readPrimaryRuntime(source) 上直接 ENOENT。
 *
 * 处理方式：不碰任何官方文件，只按官方布局把已经装在 Harness home 的 payload
 * （<home>\dsh-runtimes\dsh-primary-runtime）补到官方期望的位置。
 * manifest 一致时官方的 installPrimaryRuntime 只做校验、不复制，所以 home 那份照旧可用。
 *
 * 用法：
 *   node scripts/relocate-primary-runtime.mjs                 # 复制补齐（默认，home 保留）
 *   node scripts/relocate-primary-runtime.mjs --move          # 移动补齐（home 由下次启动重建）
 *   node scripts/relocate-primary-runtime.mjs --dry-run       # 只报告会做什么
 *   DSH_BASE="/path/to/install" node scripts/...              # 非默认安装目录
 */

import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const args = process.argv.slice(2);
const MOVE = args.includes("--move");
const DRY = args.includes("--dry-run");

const base = process.env.DSH_BASE ?? "D:\\DeepSeek Harness";
const bundled = path.join(base, "resources", "runtime", "primary-runtime");
const installed = path.join(os.homedir(), ".dsh", "dsh-runtimes", "dsh-primary-runtime");

const hasManifest = (dir) => {
  try {
    return fs.statSync(path.join(dir, "runtime.json")).isFile();
  } catch {
    return false;
  }
};

if (hasManifest(bundled)) {
  console.log(`[ok] 已存在：${bundled}`);
  process.exit(0);
}
if (!hasManifest(installed)) {
  console.error(`[fail] 两边都没有 runtime.json，无法补齐：\n  bundled  ${bundled}\n  installed ${installed}`);
  console.error("请先用官方安装器或 prepare:primary-runtime 生成 payload。");
  process.exit(2);
}

console.log(`[plan] ${MOVE ? "移动" : "复制"} payload：\n  from ${installed}\n  to   ${bundled}`);
if (DRY) process.exit(0);

fs.mkdirSync(path.dirname(bundled), { recursive: true });
fs.cpSync(installed, bundled, { recursive: true, dereference: true, force: true });
if (!hasManifest(bundled)) {
  console.error(`[fail] 复制后仍缺 runtime.json：${bundled}`);
  process.exit(1);
}

if (MOVE) {
  fs.rmSync(installed, { recursive: true, force: true });
  console.log("[ok] 已移动；下次启动 DSH 时官方安装流程会把 payload 重新装回 home。");
} else {
  console.log("[ok] 已复制；home 里的已装副本保留，官方 manifests 一致，不会重复复制。");
}
