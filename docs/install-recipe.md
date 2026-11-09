# dsh-purge 真实安装 / 重装链路（pnpm 11 实测）

本文件记录一次**从零到装好**的完整安装链路实测（2026-11-09，本机 DSH 0.2.2-rc.1，
内置 pnpm **11.28.5**，node v22.23.2）。此前一直以为「全量 `pnpm install` 从来跑不通」，
实际卡点只有两个：`ERR_PNPM_IGNORED_BUILDS` 和 `allowBuilds` 的键写法。

## 结论

`postinstall`（`scripts/ensure-profile-bundle.mjs`）能在真实安装链路里跑通，
并会自动把用户层 profile 的旧本体 insert 迁移成新 id `dsh-purge-profile`。
实测输出：

```
.../node_modules/dsh-purge postinstall$ node scripts/ensure-profile-bundle.mjs
.../dsh-purge postinstall: dsh-purge: appended to bundles (<profileDir>)
.../dsh-purge postinstall: dsh-purge: wrote body insert (<profileDir>\cordis.patch.yml)
.../dsh-purge postinstall: dsh-purge: allowed pnpm build for dsh-purge
.../dsh-purge postinstall: Done
+ dsh-purge 1.2.0
Done in 15.3s using pnpm v11.28.5
```

## 命令

```powershell
$pnpm = 'D:\DeepSeek Harness\resources\runtime\primary-runtime\dependencies\pnpm\bin\pnpm.cjs'
Set-Location <profileDir>   # package.json 里 name 以 dsh-profile- 开头，或带 dsh.profile.bundles
& node $pnpm install "dsh-purge@github:stl88083365/dsh-purge-patched" `
    --config.confirmModulesPurge=false --reporter=append-only
```

`--config.confirmModulesPurge=false` 是必须的：pnpm 10/11 在没有 TTY 时遇到要重建
`node_modules` 会直接 `ERR_PNPM_ABORTED_REMOVE_MODULES_DIR_NO_TTY`。

## allowBuilds 必须这样写

`pnpm-workspace.yaml`：

```yaml
packages: []

allowBuilds:
  dsh-purge: true
  "dsh-purge@https://codeload.github.com/stl88083365/dsh-purge-patched/tar.gz/<commit sha>": true
```

实测过的**错误写法**（pnpm 11.28.5）：

| 写法 | 结果 |
| --- | --- |
| `package.json` 里 `pnpm.onlyBuiltDependencies` | 被忽略并 warn：`The "pnpm" field in package.json is no longer read by pnpm` |
| `onlyBuiltDependencies: [dsh-purge]`（纯包名，写在 workspace yaml） | `ERR_PNPM_IGNORED_BUILDS`，exit 1 |
| `onlyBuiltDependencies: ["dsh-purge@<codeload url>"]` | 同上，`ERR_PNPM_IGNORED_BUILDS` |
| `allowBuilds: [...]`（数组） | `[ERROR] The allowBuilds field should be an object, but got array` |
| `allowBuilds:` 对象但键是裸 URL | 不认账 → `ERR_PNPM_IGNORED_BUILDS` |
| **`allowBuilds:` 对象 + 键 `包名@<codeload url/sha>`** | **exit 0，postinstall 全套执行** |

键里的 sha 只能等 pnpm 解析完才知道，所以 `lib/profile-insert.js` 的
`purgePnpmBuildSpecs()` 会从 profile 的 `pnpm-lock.yaml` 里读 `dsh-purge` 实际解析到的
`tarball` URL，拼成合格键；`ensurePnpmAllowBuild()` 把它和裸包名一起写进
`pnpm-workspace.yaml`（#193）。

## 首次装新 commit 时的两步走

新 commit 的 sha 换掉之后，`allowBuilds` 里原来那条键就不再匹配，第一次装会 exit 1
（包已经落到 `node_modules`，脚本没跑）。此时再跑一次
`node -e "import('./lib/profile-insert.js').then(m=>console.log(m.ensurePnpmAllowBuild('<profileDir>')))"`
（或让 postinstall 之外任何一次 `ensureAllProfileInstall` 触发），把新 sha 的键补进去，
然后重跑上面的 install 命令即可 exit 0 并跑 postinstall。DSH 插件市场的安装按钮做的是同一件事
（它在装之前先问一次 `pnpm approve-builds` 等价的选择）。

## 装完怎么验

```powershell
# 包内不该再有本体 overlay，也不该有旧红队覆盖项
Select-String <installed>\cordis.patch.yml -Pattern '^-\s*id:\s*(dsh-purge|redteam)'
# 用户层 profile 的本体行 id
Select-String <profileDir>\cordis.patch.yml -Pattern '^-\s*id:\s*dsh-purge'
# 应该是：- id: dsh-purge-profile（config 18 键），且没有顶层 `- id: dsh-purge / disabled: true`
```
