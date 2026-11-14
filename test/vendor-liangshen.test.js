import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const vendorRoot = path.join(repoRoot, "vendor", "liangshen");

/* ---------------------------------------------------------------------------
 * 梁神随包分发：vendor 必须在仓库里、必须被 package.json files 带上，
 * 否则 npm 装出来的是"没有梁神"的 dsh-purge。
 */
test("vendor/liangshen: 包元数据与运行时文件齐备", () => {
  const pkg = JSON.parse(fs.readFileSync(path.join(vendorRoot, "package.json"), "utf8"));
  assert.equal(pkg.name, "@linxin666/dsh-liangshen");
  assert.match(pkg.version, /^\d+\.\d+\.\d+/);
  for (const rel of ["lib/index.js", "lib/client.js", "presets/liangshen/agent.cordis.yml", "presets/liangshen/minimal-prompt.mjs", "LICENSE"]) {
    assert.equal(fs.existsSync(path.join(vendorRoot, rel)), true, `缺 ${rel}`);
  }
});

test("package.json: files 字段带上 vendor/liangshen", () => {
  const pkg = JSON.parse(fs.readFileSync(path.join(repoRoot, "package.json"), "utf8"));
  assert.equal(pkg.files.includes("vendor/liangshen"), true);
});

test("NOTICE: 有梁神上游署名", () => {
  const text = fs.readFileSync(path.join(repoRoot, "NOTICE"), "utf8");
  assert.match(text, /@linxin666\/dsh-liangshen/);
  assert.match(text, /Apache License 2\.0/);
});

test("liangshen-vendor: 装配入口可导入且导出两项能力", async () => {
  const mod = await import("file:///" + path.join(repoRoot, "lib", "liangshen-vendor.js").replace(/\\/g, "/"));
  assert.equal(typeof mod.ensureLiangshenProfile, "function");
  assert.equal(mod.LIANGSHEN_PKG, "@linxin666/dsh-liangshen");
  assert.match(mod.liangshenVendorVersion(), /^\d+\.\d+\.\d+/);
});
