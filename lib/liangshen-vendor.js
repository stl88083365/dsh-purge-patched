/**
 * 梁神（@linxin666/dsh-liangshen）随插件一起分发。
 *
 * 仓库里 `vendor/liangshen/` 存的是上游 npm 包 0.4.16 的运行时部分（lib / presets /
 * locale / package.json / cordis.patch.yml / LICENSE 等，去掉 .map 与 src、tools）。
 * 插件启动时把这份 vendor 镜像进各 profile 的 node_modules，并登记进
 * package.json 的 dependencies + dsh.profile.bundles，然后把本插件针对梁神的
 * 补丁（#71 去身份句、#28 phase-1 保留注入段）直接打上去。
 *
 * 只镜像 `vendor` 到用户目录，不改宿主、不改 profile 里别人写的配置；写失败只记
 * 结果，不挡插件启动。
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  ALL_PATCHES,
  applyReplacementsToText,
  atomicWriteSync,
} from "./core.js";

export const LIANGSHEN_PKG = "@linxin666/dsh-liangshen";

/** 判断"已经装好且可用"必须看到的文件。 */
const REQUIRED_FILES = [
  ["lib", "index.js"],
  ["presets", "liangshen", "agent.cordis.yml"],
];

export function liangshenVendorRoot() {
  return path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "vendor", "liangshen");
}

function readJson(fp) {
  try {
    return JSON.parse(fs.readFileSync(fp, "utf8"));
  } catch {
    return null;
  }
}

export function liangshenVendorVersion() {
  return String(readJson(path.join(liangshenVendorRoot(), "package.json"))?.version || "");
}

function installedDir(profileDir) {
  return path.join(profileDir, "node_modules", "@linxin666", "dsh-liangshen");
}

function isComplete(dir) {
  return REQUIRED_FILES.every((rel) => fs.existsSync(path.join(dir, ...rel)));
}

/** 把 vendor 覆盖进目标目录（cpSync 会保留被覆盖文件的 mtime 变化，但内容按 vendor 为准）。 */
function mirrorVendor(target) {
  fs.cpSync(liangshenVendorRoot(), target, { recursive: true, force: true });
}

/** dependencies + dsh.profile.bundles 里都要有，宿主才会把梁神的 bundle patch 叠上去。 */
function ensureProfileRegistration(profileDir) {
  const fp = path.join(profileDir, "package.json");
  const pkg = readJson(fp);
  if (!pkg) return { ok: false, wrote: false, path: fp, reason: "package.json unreadable" };
  const version = liangshenVendorVersion();
  let changed = false;
  pkg.dependencies = pkg.dependencies && typeof pkg.dependencies === "object" ? pkg.dependencies : {};
  if (pkg.dependencies[LIANGSHEN_PKG] !== version) {
    pkg.dependencies[LIANGSHEN_PKG] = version;
    changed = true;
  }
  pkg.dsh = pkg.dsh && typeof pkg.dsh === "object" ? pkg.dsh : {};
  pkg.dsh.profile = pkg.dsh.profile && typeof pkg.dsh.profile === "object" ? pkg.dsh.profile : {};
  const bundles = Array.isArray(pkg.dsh.profile.bundles) ? pkg.dsh.profile.bundles : [];
  if (!bundles.includes(LIANGSHEN_PKG)) {
    pkg.dsh.profile.bundles = [...bundles, LIANGSHEN_PKG];
    changed = true;
  }
  if (!changed) return { ok: true, wrote: false, path: fp };
  atomicWriteSync(fp, `${JSON.stringify(pkg, null, 2)}\n`, "utf8");
  return { ok: true, wrote: true, path: fp };
}

/**
 * 镜像完成后立刻把梁神相关的补丁打上，避免"装好了但状态页报未应用/待处理"。
 * 直接盯着"刚镜像进这个 profile 的副本"打：不走 targetFiles 的 surface 门槛，
 * 否则给非当前 surface 的 profile（如桌面端起 web 面）装配时会被判越界。
 * pattern 仍取自 core 的补丁定义，不在这里另写一份。
 *
 * #24 也在这里：vendor 里的 agent.cordis.yml 是上游原样，`fetch: false`，
 * 漏了这条就会在插件页留下一条"待处理 preset fetch 启用"。
 */
export const LIANGSHEN_PATCH_TARGETS = [
  [24, ["presets", "liangshen", "agent.cordis.yml"]],
  [71, ["presets", "liangshen", "agent.cordis.yml"]],
  [28, ["presets", "liangshen", "minimal-prompt.mjs"]],
];

function patchLiangshenFiles(targetDir) {
  const result = { applied: [], changed: [] };
  for (const [id, rel] of LIANGSHEN_PATCH_TARGETS) {
    const patch = ALL_PATCHES.find((p) => p.id === id);
    if (!patch) continue;
    const fp = path.join(targetDir, ...rel);
    if (!fs.existsSync(fp)) continue;
    let text = "";
    try {
      text = fs.readFileSync(fp, "utf8");
    } catch {
      continue;
    }
    const res = applyReplacementsToText(text, patch, fp);
    if (!res || !res.changed) continue;
    try {
      atomicWriteSync(fp, res.text, "utf8");
      if (!result.changed.includes(fp)) result.changed.push(fp);
      if (!result.applied.includes(id)) result.applied.push(id);
    } catch { /* 单个文件写失败不影响别的 */ }
  }
  return result;
}

/**
 * 给一个 profile 装上/修好梁神。
 * - 目标目录缺文件或版本与 vendor 不一致 → 重新镜像；
 * - 镜像后补 dependencies / bundles / 专用补丁。
 */
export function ensureLiangshenProfile(profileDir) {
  const root = liangshenVendorRoot();
  if (!fs.existsSync(path.join(root, "package.json"))) {
    return { ok: false, installed: false, reason: "vendor missing" };
  }
  const target = installedDir(profileDir);
  const vendorVersion = liangshenVendorVersion();
  const currentVersion = String(readJson(path.join(target, "package.json"))?.version || "");
  let installed = false;
  if (currentVersion !== vendorVersion || !isComplete(target)) {
    try {
      mirrorVendor(target);
      installed = true;
    } catch (error) {
      return {
        ok: false,
        installed: false,
        reason: error && error.message ? error.message : String(error),
      };
    }
  }
  const registration = ensureProfileRegistration(profileDir);
  const patched = patchLiangshenFiles(target);
  return { ok: true, installed, version: vendorVersion, registration, patched };
}
