# Result: `deps-refresh`

**Shipped:** the Rush lockfile's audit went from 173 advisories (4 critical, 73 high, 84 moderate, 12 low) to 3 (2 moderate, 1 low, none with a fix that a direct bump or a same-major override can deliver), and the root `package-lock.json` Dependabot scans went from 11 high to 1 high (open below `@microsoft/rush`), with Rush 5.182.1 / pnpm 11.28.9, a full lockfile refresh, six direct bumps, two scoped overrides, and a minor/patch refresh of 58 more direct dependencies within their current major.

> **Amended in review rounds 1–2 (2026-11-08).** The line above was first written at `72a83930` as
> *"the monorepo's dependency audit went from 173 advisories … to 4 (2 moderate, 2 low …)"*. Those
> figures described the Rush lockfile only, before `crypto-browserify` was removed. The scoped state now:
>
> | lockfile | before | after |
> |---|---|---|
> | Rush `common/config/rush/pnpm-lock.yaml` | 4 critical, 73 high, 84 moderate, 12 low | 0 critical, 0 high, 2 moderate, 1 low (`elliptic` closed by removing unused `crypto-browserify`) |
> | root `package-lock.json` (what Dependabot scans) | 0 critical, 11 high, 6 moderate, 2 low (distinct advisories; one apparent critical is a name collision, § 2c) | 0 critical, **1 high** (open, § 2c), 1 moderate |
> | `common/autoinstallers/rush-pack-check` | 2 high, 2 moderate | 0 high, 1 moderate (`minimatch`, as in § 2a) |
> | `common/autoinstallers/rush-prettier`, `rush-bundler-check` | none | none |
>
> "0 critical / 0 high" holds for the Rush lockfile and the autoinstallers. It does **not** hold for
> the root `package-lock.json`, where one high remains below `@microsoft/rush`.

Base: `integration/asks` at `c3ab4e48`. Branch `deps-refresh`. No PR opened (per brief).

## 1. Method

- **Audit tool:** `node common/scripts/install-run-rush-pnpm.js audit --json` against the
  installed lockfile. The CLI worked, so the bulk advisory endpoint was used only to check Rush and
  pnpm themselves (§ 5). Raw JSON: `scratchpad/deps/audit-before.json` and
  `scratchpad/deps/audit-after.json` (final lockfile, after the clean install).
- **Version choice:** for every direct range, the latest release in the current major that was
  published before 2026-11-06T00:00Z (at least two days old at the time of the run) and not
  marked deprecated upstream, queried from `registry.npmjs.org`.
- **Range changes:** `rush add -p <pkg>@<range> [--dev|--peer] -s -m` from a consuming project,
  then `rush update`. One `rush update --full` (justified: almost every baseline advisory was a
  transitive pinned by the lockfile below what its parent's range already allowed, and only a full
  re-resolution reaches those). No `npm`, no hand-edited dependency blocks.
- **Order of commits:** `aeb5a83a` security fixes (toolchain, full refresh, direct security bumps,
  overrides) → `5ef14173` minor/patch refresh → `cbe61f9d` hold the Heft family, api.md, change files
  → `67171b4a` ts-extras-mcp → `72a83930` close-out. Review round 1: `3fdcd3e0` root npm lockfile →
  `66c59723` autoinstallers → `819e64d1` ts-extras-mcp same-origin test → `00c2dcba` `@types/node`
  22, `crypto-browserify`, MONOREPO_GUIDE → round-1 docs commit.

## 2. Before / after — Rush lockfile (`common/config/rush/pnpm-lock.yaml`)

As of `72a83930`. Review round 1 removed `crypto-browserify`, which closed `elliptic` and left 3
(2 moderate, 1 low). The root and autoinstaller lockfiles are in § 2c and § 2d.

| severity | before | after |
|---|---|---|
| critical | 4 | 0 |
| high | 73 | 0 |
| moderate | 84 | 2 |
| low | 12 | 2 |
| **total** | **173** | **4** |

### 2a. Advisories left open

| severity | package | installed | advisory | fixed in | why it stays open |
|---|---|---|---|---|---|
| moderate | `glob` | 10.5.0, 13.0.7 | [GHSA-3g3m-2fjr-6pw4](https://github.com/advisories/GHSA-3g3m-2fjr-6pw4) | >=14.0.2 | **Fix needs a major of a transitive, against its parents' ranges.** Every path is build/test tooling (`jest` internals, `test-exclude`, via the Heft rigs). glob 14 changes `walk()` return types, `ignore` semantics and moves to minimatch 11; no consumer (jest 30, test-exclude) ranges it. **Not reachable:** the advisory is AbortSignal cancellation of a walk; the patterns are the repo's own jest config, never untrusted input, and no signal is aborted. |
| moderate | `minimatch` | 9.0.9, 10.2.3, 10.2.6 | [GHSA-g3hv-75wg-m249](https://github.com/advisories/GHSA-g3hv-75wg-m249) | >=11.0.1 | **Fix needs a major of a transitive.** minimatch 11 removes `makeRe()`, `Minimatch#regexp`, the `AST` class and `matchOne()`, and changes matching of empty portions; consumers are `@microsoft/api-extractor`, `@typescript-eslint/typescript-estree`, `glob`, `test-exclude`, `typedoc`, none of which ranges 11. **Not reachable:** a globparts-amplification DoS needs an attacker-chosen pattern; every pattern here is authored in repo config and evaluated by dev-only tools. |
| low | `deepmerge` | 4.3.1 | [GHSA-gcqx-w48m-w2h4](https://github.com/advisories/GHSA-gcqx-w48m-w2h4) | none | **No fix published** (4.3.1 is the latest). Reached only through `jest-config`, merging the repo's own jest configuration. |
| low | `elliptic` | 6.6.1 | [GHSA-848j-6mx2-7j84](https://github.com/advisories/GHSA-848j-6mx2-7j84) | none | **Closed in review round 1.** No fix is published. It was reached only through `crypto-browserify`, an unused direct dependency of `tools/ts-res-browser` and `tools/ts-res-ui-playground`: both webpack configs set `resolve.fallback.crypto: false`, and no source imports it. Both were removed with `rush remove -p crypto-browserify` (`00c2dcba`), and `elliptic` left the lockfile. *(Originally recorded here as "in the webpack polyfill set", which was wrong: nothing polyfilled with it.)* |

### 2c. Root `package-lock.json` (added in review round 1)

`.github/dependabot.yml` scans npm at `/`: the root `package.json`, which pins only
`@microsoft/rush`, and its npm-native `package-lock.json`. Rush never touches either. **Orchestrator
decision (an exception to "never npm", recorded in `state.md` A1):** the root range is set to
`^5.182.1` to match `rush.json`, and the lockfile is regenerated with
`npm install @microsoft/rush@^5.182.1 --package-lock-only --before=2026-11-06T00:00:00Z
--ignore-scripts`, followed by `npm audit fix --package-lock-only --before=…` (no `--force`). The
`--before` date is the same release-age margin used everywhere else. Lock: `@microsoft/rush`
5.178.1 → 5.182.1.

Audited with `npm audit --package-lock-only --json` and with the bulk endpoint, keyed by each
package's *registry* name taken from `resolved`
(`scratchpad/deps/root-audit-{before,after}.json`, `root-bulk-{before2,after}.json`).

**One apparent critical is a false positive.** Keyed by install path, the bulk endpoint matches
`js-yaml` 0.0.6 and 0.0.11 to GHSA-xxvw-45rp-3mj2 (critical, `<2.0.5`) and to three 3.x advisories.
Those two entries are the aliased fork `@zkochan/js-yaml` (`resolved:
…/@zkochan/js-yaml/-/js-yaml-0.0.11.tgz`), installed under `node_modules/js-yaml` paths inside
`@pnpm/lockfile.fs-pnpm-lock-v9` and `@rushstack/rush-pnpm-kit-v8`. `npm audit` does not report
them, and keying by registry name returns nothing for them, before or after.

| severity | package | before | after | advisory | status |
|---|---|---|---|---|---|
| high | `@azure/msal-node` | 5.5.0 | 6.0.1 | [GHSA-xcx6-jx8p-x3h5](https://github.com/advisories/GHSA-xcx6-jx8p-x3h5) (fixed >=7.1.0) | **open** — see below |
| high ×2, moderate ×1 | `brace-expansion` | 1.1.18, 2.1.4, 5.0.9 | 1.1.21, 2.1.7, 5.0.12 | GHSA-qhr7-859c-m2p7, GHSA-6j4f-fj2g-mc7p, GHSA-q2hr-2g5m-vwhr | closed |
| high ×5, moderate ×3, low ×2 | `fast-uri` | 3.1.5 | 3.1.9 | GHSA-5jgf-p345-68v8, -f65p-4m7j-42xc, -fph4-wmhf-6fwf, -jqff-g426-hqxp, -qw65-cvwx-89v3; -hrr3-gc8f-f4qj, -w74x-v6f9-j3xg, -wjr9-j795-jxcr; -333x-w4r6-6crp, -xhq7-xmqj-769h | closed |
| high ×3, moderate ×1 | `js-yaml` | 4.1.1 | 4.3.2 | GHSA-52cp-r559-cp3m, -5p4m-2wfm-xmqj, -2883-xcg3-v3hh; -h67p-54hq-rp68 | closed |
| moderate | `minimatch` | 3.1.5, 5.1.9, 10.2.3 | unchanged | [GHSA-g3hv-75wg-m249](https://github.com/advisories/GHSA-g3hv-75wg-m249) (fixed >=11.0.1) | open, same reasoning as § 2a; `@microsoft/rush-lib` ranges it |

**`@azure/msal-node` stays open: the fix needs a major below `@microsoft/rush`.**
`@rushstack/rush-azure-storage-build-cache-plugin` 5.182.1, which ships with Rush, pins
`@azure/identity ~4.13.1`. 4.13.3 is the newest in that range, and it requires `@azure/msal-node
^6.0.0`. The fix is in msal-node 7.1.0, which only `@azure/identity` 4.14.1 (2026-10-29) ranges.
Reaching it means either an override across msal-node's major beneath Rush, or a Rush release that
moves its pin. Reachability: the plugin loads only when the repo configures an Azure build cache.
`common/config/rush/build-cache.json` here does not select the Azure provider, so neither CI nor a
local run loads `@azure/identity` at all. `npm audit fix --force` proposes downgrading
`@microsoft/rush` to 5.157.0; it was not run.

### 2d. Autoinstaller lockfiles (added in review round 1)

`rush update-autoinstaller --name <n>` for all three. Audited by posting each `pnpm-lock.yaml`'s
packages to the bulk endpoint (`scratchpad/deps/ai-<n>-{before,after}.md`).

| autoinstaller | used by | before | after | changed versions |
|---|---|---|---|---|
| `rush-pack-check` | CI (`verify-tarball-exports`), every publish workflow | high GHSA-qhr7-859c-m2p7, high GHSA-6j4f-fj2g-mc7p, moderate GHSA-q2hr-2g5m-vwhr (`brace-expansion` 5.0.9); moderate GHSA-g3hv-75wg-m249 (`minimatch` 10.2.6) | `minimatch` moderate only (major-only fix, § 2a) | brace-expansion 5.0.9 → 5.0.12 (2026-09-14) |
| `rush-prettier` | `rush prettier` | none | none | tslib 2.8.1 → 2.9.1; prettier stays 2.8.8 |
| `rush-bundler-check` | CI (`verify-bundler-resolution`) | none | none | esbuild 0.28.1 → 0.28.2 (2026-08-08) |

**CI's uses still work.** I ran locally the same steps `ci.yml` runs (`scratchpad/deps/ci-checks.log`):
`install-autoinstaller --name rush-bundler-check`, `verify-esm-entrypoints.mjs` (26 checked, 0
failed), `verify-bundler-resolution.mjs --measure` (22 checked, 0 failed),
`install-autoinstaller --name rush-pack-check`, `verify-tarball-exports.mjs` (28 packages, 218
manifest paths, 0 failed). `install-autoinstaller --name rush-prettier` installs prettier 2.8.8
and pretty-quick.

### 2b. Baseline (all 173), with what closed each

| # | severity | package | installed | advisory | dependency path (example; total paths) | first fixed | resolved by |
|---|---|---|---|---|---|---|---|
| 1 | critical | `handlebars` | 4.7.9 | [GHSA-8r5x-fm3f-whwj](https://github.com/advisories/GHSA-8r5x-fm3f-whwj) | `libraries/ts-agent-memory › ts-jest › handlebars` (31) | >=4.7.10 | lockfile refresh (`rush update --full`) |
| 2 | critical | `handlebars` | 4.7.9 | [GHSA-p8wg-vrv2-v86f](https://github.com/advisories/GHSA-p8wg-vrv2-v86f) | `libraries/ts-agent-memory › ts-jest › handlebars` (31) | >=4.7.10 | lockfile refresh (`rush update --full`) |
| 3 | critical | `proxy-addr` | 2.0.7 | [GHSA-jqcg-44mw-7w3h](https://github.com/advisories/GHSA-jqcg-44mw-7w3h) | `apps/sudoku › @rushstack/heft-web-rig › @rushstack/heft-webpack5-plugin › webpack › webpack-cli › @webpack-cli/serve › webpack-dev-server › express › proxy-addr` (100) | >=2.0.8 | lockfile refresh (`rush update --full`) |
| 4 | critical | `shell-quote` | 1.10.0 | [GHSA-pqg4-j6r4-53mv](https://github.com/advisories/GHSA-pqg4-j6r4-53mv) | `apps/sudoku › @rushstack/heft-web-rig › @rushstack/heft-webpack5-plugin › webpack › webpack-cli › @webpack-cli/serve › webpack-dev-server › launch-editor › shell-quote` (100) | >=1.11.0 | lockfile refresh (`rush update --full`) |
| 5 | high | `@modelcontextprotocol/sdk` | 1.29.0 | [GHSA-22jm-h49p-29qw](https://github.com/advisories/GHSA-22jm-h49p-29qw) | `libraries/ts-extras-mcp › @modelcontextprotocol/sdk` (2) | >=1.32.0 | lockfile refresh; floor raised to ^1.32.2 |
| 6 | high | `@modelcontextprotocol/sdk` | 1.29.0 | [GHSA-46jr-4wx8-v453](https://github.com/advisories/GHSA-46jr-4wx8-v453) | `libraries/ts-extras-mcp › @modelcontextprotocol/sdk` (2) | >=1.32.0 | lockfile refresh; floor raised to ^1.32.2 |
| 7 | high | `@modelcontextprotocol/sdk` | 1.29.0 | [GHSA-6qxp-vccf-f47h](https://github.com/advisories/GHSA-6qxp-vccf-f47h) | `libraries/ts-extras-mcp › @modelcontextprotocol/sdk` (2) | >=1.31.0 | lockfile refresh; floor raised to ^1.32.2 |
| 8 | high | `@modelcontextprotocol/sdk` | 1.29.0 | [GHSA-f897-62hf-6gxq](https://github.com/advisories/GHSA-f897-62hf-6gxq) | `libraries/ts-extras-mcp › @modelcontextprotocol/sdk` (2) | >=1.30.1 | lockfile refresh; floor raised to ^1.32.2 |
| 9 | high | `adm-zip` | 0.5.18 | [GHSA-7q85-xj36-vmfc](https://github.com/advisories/GHSA-7q85-xj36-vmfc) | `libraries/ts-extras-transformers › @huggingface/transformers › onnxruntime-node › adm-zip` (2) | >=0.6.1 | direct bump `@huggingface/transformers` ~4.3.2 (onnxruntime-node 1.30 → adm-zip 0.6.1) |
| 10 | high | `adm-zip` | 0.5.18 | [GHSA-8238-w5pm-2374](https://github.com/advisories/GHSA-8238-w5pm-2374) | `libraries/ts-extras-transformers › @huggingface/transformers › onnxruntime-node › adm-zip` (2) | >=0.6.1 | direct bump `@huggingface/transformers` ~4.3.2 (onnxruntime-node 1.30 → adm-zip 0.6.1) |
| 11 | high | `adm-zip` | 0.5.18 | [GHSA-j5f4-cc29-5x44](https://github.com/advisories/GHSA-j5f4-cc29-5x44) | `libraries/ts-extras-transformers › @huggingface/transformers › onnxruntime-node › adm-zip` (2) | >=0.6.1 | direct bump `@huggingface/transformers` ~4.3.2 (onnxruntime-node 1.30 → adm-zip 0.6.1) |
| 12 | high | `adm-zip` | 0.5.18 | [GHSA-rcw4-f5rp-g42v](https://github.com/advisories/GHSA-rcw4-f5rp-g42v) | `libraries/ts-extras-transformers › @huggingface/transformers › onnxruntime-node › adm-zip` (2) | >=0.6.1 | direct bump `@huggingface/transformers` ~4.3.2 (onnxruntime-node 1.30 → adm-zip 0.6.1) |
| 13 | high | `adm-zip` | 0.5.18 | [GHSA-xcpc-8h2w-3j85](https://github.com/advisories/GHSA-xcpc-8h2w-3j85) | `libraries/ts-extras-transformers › @huggingface/transformers › onnxruntime-node › adm-zip` (2) | >=0.6.0 | direct bump `@huggingface/transformers` ~4.3.2 (onnxruntime-node 1.30 → adm-zip 0.6.1) |
| 14 | high | `axios` | 1.18.1 | [GHSA-3pq3-5fj3-cg6v](https://github.com/advisories/GHSA-3pq3-5fj3-cg6v) | `libraries/ts-bcp47 › axios` (1) | >=1.20.0 | lockfile refresh; floor raised to ^1.21.0 |
| 15 | high | `axios` | 1.18.1 | [GHSA-542g-h47m-68v8](https://github.com/advisories/GHSA-542g-h47m-68v8) | `libraries/ts-bcp47 › axios` (1) | >=1.20.0 | lockfile refresh; floor raised to ^1.21.0 |
| 16 | high | `axios` | 1.18.1 | [GHSA-c29m-xwm3-cm6r](https://github.com/advisories/GHSA-c29m-xwm3-cm6r) | `libraries/ts-bcp47 › axios` (1) | >=1.20.0 | lockfile refresh; floor raised to ^1.21.0 |
| 17 | high | `axios` | 1.18.1 | [GHSA-m8m8-qj5v-23w3](https://github.com/advisories/GHSA-m8m8-qj5v-23w3) | `libraries/ts-bcp47 › axios` (1) | >=1.20.0 | lockfile refresh; floor raised to ^1.21.0 |
| 18 | high | `axios` | 1.18.1 | [GHSA-mghh-pgcx-3jjj](https://github.com/advisories/GHSA-mghh-pgcx-3jjj) | `libraries/ts-bcp47 › axios` (1) | >=1.20.0 | lockfile refresh; floor raised to ^1.21.0 |
| 19 | high | `axios` | 1.18.1 | [GHSA-r4gj-5m52-g5wh](https://github.com/advisories/GHSA-r4gj-5m52-g5wh) | `libraries/ts-bcp47 › axios` (1) | >=1.20.0 | lockfile refresh; floor raised to ^1.21.0 |
| 20 | high | `axios` | 1.18.1 | [GHSA-x97p-jq2g-jp4f](https://github.com/advisories/GHSA-x97p-jq2g-jp4f) | `libraries/ts-bcp47 › axios` (1) | >=1.20.0 | lockfile refresh; floor raised to ^1.21.0 |
| 21 | high | `body-parser` | 1.20.6 | [GHSA-27r3-jxmh-p828](https://github.com/advisories/GHSA-27r3-jxmh-p828) | `apps/sudoku › @rushstack/heft-web-rig › @rushstack/heft-webpack5-plugin › webpack › webpack-cli › @webpack-cli/serve › webpack-dev-server › express › body-parser` (100) | >=1.20.9 | lockfile refresh (`rush update --full`) |
| 22 | high | `body-parser` | 2.3.0 | [GHSA-27r3-jxmh-p828](https://github.com/advisories/GHSA-27r3-jxmh-p828) | `libraries/ts-extras-mcp › @modelcontextprotocol/sdk › express › body-parser` (4) | >=2.4.0 | lockfile refresh (`rush update --full`) |
| 23 | high | `brace-expansion` | 1.1.16 | [GHSA-6j4f-fj2g-mc7p](https://github.com/advisories/GHSA-6j4f-fj2g-mc7p) | `apps/sudoku › @rushstack/heft-web-rig › @rushstack/eslint-config › @rushstack/eslint-plugin › @typescript-eslint/utils › @eslint-community/eslint-utils › eslint › @eslint/config-array › minimatch › brace-expansion` (100) | >=1.1.19 | lockfile refresh (`rush update --full`) |
| 24 | high | `brace-expansion` | 2.1.4 | [GHSA-6j4f-fj2g-mc7p](https://github.com/advisories/GHSA-6j4f-fj2g-mc7p) | `apps/sudoku › @rushstack/heft-web-rig › @rushstack/heft-jest-plugin › @jest/core › @jest/reporters › glob › minimatch › brace-expansion` (100) | >=2.1.5 | lockfile refresh (`rush update --full`) |
| 25 | high | `brace-expansion` | 5.0.7 | [GHSA-6j4f-fj2g-mc7p](https://github.com/advisories/GHSA-6j4f-fj2g-mc7p) | `apps/sudoku › @rushstack/heft-web-rig › @microsoft/api-extractor › minimatch › brace-expansion` (100) | >=5.0.10 | lockfile refresh (`rush update --full`) |
| 26 | high | `brace-expansion` | 1.1.16 | [GHSA-mh99-v99m-4gvg](https://github.com/advisories/GHSA-mh99-v99m-4gvg) | `apps/sudoku › @rushstack/heft-web-rig › @rushstack/eslint-config › @rushstack/eslint-plugin › @typescript-eslint/utils › @eslint-community/eslint-utils › eslint › @eslint/config-array › minimatch › brace-expansion` (100) | >=1.1.17 | lockfile refresh (`rush update --full`) |
| 27 | high | `brace-expansion` | 5.0.7 | [GHSA-mh99-v99m-4gvg](https://github.com/advisories/GHSA-mh99-v99m-4gvg) | `apps/sudoku › @rushstack/heft-web-rig › @microsoft/api-extractor › minimatch › brace-expansion` (100) | >=5.0.8 | lockfile refresh (`rush update --full`) |
| 28 | high | `brace-expansion` | 1.1.16 | [GHSA-qhr7-859c-m2p7](https://github.com/advisories/GHSA-qhr7-859c-m2p7) | `apps/sudoku › @rushstack/heft-web-rig › @rushstack/eslint-config › @rushstack/eslint-plugin › @typescript-eslint/utils › @eslint-community/eslint-utils › eslint › @eslint/config-array › minimatch › brace-expansion` (100) | >=1.1.20 | lockfile refresh (`rush update --full`) |
| 29 | high | `brace-expansion` | 2.1.4 | [GHSA-qhr7-859c-m2p7](https://github.com/advisories/GHSA-qhr7-859c-m2p7) | `apps/sudoku › @rushstack/heft-web-rig › @rushstack/heft-jest-plugin › @jest/core › @jest/reporters › glob › minimatch › brace-expansion` (100) | >=2.1.6 | lockfile refresh (`rush update --full`) |
| 30 | high | `brace-expansion` | 5.0.7 | [GHSA-qhr7-859c-m2p7](https://github.com/advisories/GHSA-qhr7-859c-m2p7) | `apps/sudoku › @rushstack/heft-web-rig › @microsoft/api-extractor › minimatch › brace-expansion` (100) | >=5.0.11 | lockfile refresh (`rush update --full`) |
| 31 | high | `brace-expansion` | 5.0.7 | [GHSA-rgw5-rvv9-x895](https://github.com/advisories/GHSA-rgw5-rvv9-x895) | `apps/sudoku › @rushstack/heft-web-rig › @microsoft/api-extractor › minimatch › brace-expansion` (100) | >=5.0.9 | lockfile refresh (`rush update --full`) |
| 32 | high | `brace-expansion` | 1.1.16 | [GHSA-rgw5-rvv9-x895](https://github.com/advisories/GHSA-rgw5-rvv9-x895) | `apps/sudoku › @rushstack/heft-web-rig › @rushstack/eslint-config › @rushstack/eslint-plugin › @typescript-eslint/utils › @eslint-community/eslint-utils › eslint › @eslint/config-array › minimatch › brace-expansion` (100) | >=1.1.18 | lockfile refresh (`rush update --full`) |
| 33 | high | `browserslist` | 4.28.5 | [GHSA-73wf-gq98-2v4g](https://github.com/advisories/GHSA-73wf-gq98-2v4g) | `apps/sudoku › @rushstack/heft-web-rig › @rushstack/heft-jest-plugin › @jest/core › @jest/reporters › @jest/transform › @babel/core › @babel/helper-compilation-targets › browserslist` (100) | >=4.28.7 | lockfile refresh (`rush update --full`) |
| 34 | high | `browserslist` | 4.28.5 | [GHSA-c83g-rgw3-j3cx](https://github.com/advisories/GHSA-c83g-rgw3-j3cx) | `apps/sudoku › @rushstack/heft-web-rig › @rushstack/heft-jest-plugin › @jest/core › @jest/reporters › @jest/transform › @babel/core › @babel/helper-compilation-targets › browserslist` (100) | >=4.28.7 | lockfile refresh (`rush update --full`) |
| 35 | high | `compression` | 1.8.1 | [GHSA-vc2v-76pw-4v95](https://github.com/advisories/GHSA-vc2v-76pw-4v95) | `apps/sudoku › @rushstack/heft-web-rig › @rushstack/heft-webpack5-plugin › webpack › webpack-cli › @webpack-cli/serve › webpack-dev-server › compression` (100) | >=1.8.2 | lockfile refresh (`rush update --full`) |
| 36 | high | `fast-uri` | 3.1.3 | [GHSA-5jgf-p345-68v8](https://github.com/advisories/GHSA-5jgf-p345-68v8) | `apps/sudoku › @rushstack/heft › @rushstack/heft-config-file › @rushstack/node-core-library › ajv › fast-uri` (100) | >=3.1.6 | lockfile refresh (`rush update --full`) |
| 37 | high | `fast-uri` | 3.1.3 | [GHSA-7p8r-x3mc-p8w7](https://github.com/advisories/GHSA-7p8r-x3mc-p8w7) | `apps/sudoku › @rushstack/heft › @rushstack/heft-config-file › @rushstack/node-core-library › ajv › fast-uri` (100) | >=3.1.5 | lockfile refresh (`rush update --full`) |
| 38 | high | `fast-uri` | 3.1.3 | [GHSA-f65p-4m7j-42xc](https://github.com/advisories/GHSA-f65p-4m7j-42xc) | `apps/sudoku › @rushstack/heft › @rushstack/heft-config-file › @rushstack/node-core-library › ajv › fast-uri` (100) | >=3.1.6 | lockfile refresh (`rush update --full`) |
| 39 | high | `fast-uri` | 3.1.3 | [GHSA-fph4-wmhf-6fwf](https://github.com/advisories/GHSA-fph4-wmhf-6fwf) | `apps/sudoku › @rushstack/heft › @rushstack/heft-config-file › @rushstack/node-core-library › ajv › fast-uri` (100) | >=3.1.6 | lockfile refresh (`rush update --full`) |
| 40 | high | `fast-uri` | 3.1.3 | [GHSA-jqff-g426-hqxp](https://github.com/advisories/GHSA-jqff-g426-hqxp) | `apps/sudoku › @rushstack/heft › @rushstack/heft-config-file › @rushstack/node-core-library › ajv › fast-uri` (100) | >=3.1.6 | lockfile refresh (`rush update --full`) |
| 41 | high | `fast-uri` | 3.1.3 | [GHSA-qw65-cvwx-89v3](https://github.com/advisories/GHSA-qw65-cvwx-89v3) | `apps/sudoku › @rushstack/heft › @rushstack/heft-config-file › @rushstack/node-core-library › ajv › fast-uri` (100) | >=3.1.7 | lockfile refresh (`rush update --full`) |
| 42 | high | `fast-uri` | 3.1.3 | [GHSA-v2hh-gcrm-f6hx](https://github.com/advisories/GHSA-v2hh-gcrm-f6hx) | `apps/sudoku › @rushstack/heft › @rushstack/heft-config-file › @rushstack/node-core-library › ajv › fast-uri` (100) | >=3.1.4 | lockfile refresh (`rush update --full`) |
| 43 | high | `follow-redirects` | 1.16.0 | [GHSA-8r9p-f939-6h3c](https://github.com/advisories/GHSA-8r9p-f939-6h3c) | `apps/sudoku › @rushstack/heft-web-rig › @rushstack/heft-webpack5-plugin › webpack › webpack-cli › @webpack-cli/serve › webpack-dev-server › http-proxy-middleware › http-proxy › follow-redirects` (100) | >=1.16.1 | lockfile refresh (`rush update --full`) |
| 44 | high | `follow-redirects` | 1.16.0 | [GHSA-mrwp-f3q8-3g9p](https://github.com/advisories/GHSA-mrwp-f3q8-3g9p) | `apps/sudoku › @rushstack/heft-web-rig › @rushstack/heft-webpack5-plugin › webpack › webpack-cli › @webpack-cli/serve › webpack-dev-server › http-proxy-middleware › http-proxy › follow-redirects` (100) | >=1.16.2 | lockfile refresh (`rush update --full`) |
| 45 | high | `follow-redirects` | 1.16.0 | [GHSA-q3jh-wrc6-jgq8](https://github.com/advisories/GHSA-q3jh-wrc6-jgq8) | `apps/sudoku › @rushstack/heft-web-rig › @rushstack/heft-webpack5-plugin › webpack › webpack-cli › @webpack-cli/serve › webpack-dev-server › http-proxy-middleware › http-proxy › follow-redirects` (100) | >=1.16.1 | lockfile refresh (`rush update --full`) |
| 46 | high | `hono` | 4.7.11 | [GHSA-3vhc-576x-3qv4](https://github.com/advisories/GHSA-3vhc-576x-3qv4) | `libraries/ts-http-storage › hono` (1) | >=4.11.4 | direct bump `hono` ~4.13.16 (ts-http-storage) |
| 47 | high | `hono` | 4.7.11 | [GHSA-88fw-hqm2-52qc](https://github.com/advisories/GHSA-88fw-hqm2-52qc) | `libraries/ts-http-storage › hono` (1) | >=4.12.25 | direct bump `hono` ~4.13.16 (ts-http-storage) |
| 48 | high | `hono` | 4.7.11 | [GHSA-f67f-6cw9-8mq4](https://github.com/advisories/GHSA-f67f-6cw9-8mq4) | `libraries/ts-http-storage › hono` (1) | >=4.11.4 | direct bump `hono` ~4.13.16 (ts-http-storage) |
| 49 | high | `hono` | 4.7.11 | [GHSA-m732-5p4w-x69g](https://github.com/advisories/GHSA-m732-5p4w-x69g) | `libraries/ts-http-storage › hono` (1) | >=4.10.2 | direct bump `hono` ~4.13.16 (ts-http-storage) |
| 50 | high | `hono` | 4.7.11 | [GHSA-q5qw-h33p-qvwr](https://github.com/advisories/GHSA-q5qw-h33p-qvwr) | `libraries/ts-http-storage › hono` (1) | >=4.12.4 | direct bump `hono` ~4.13.16 (ts-http-storage) |
| 51 | high | `ip-address` | 10.2.0 | [GHSA-mwp4-54f8-5fhr](https://github.com/advisories/GHSA-mwp4-54f8-5fhr) | `libraries/ts-extras-mcp › @modelcontextprotocol/sdk › express-rate-limit › ip-address` (2) | >=10.3.1 | lockfile refresh (`rush update --full`) |
| 52 | high | `js-yaml` | 3.15.0 | [GHSA-2883-xcg3-v3hh](https://github.com/advisories/GHSA-2883-xcg3-v3hh) | `apps/sudoku › @rushstack/heft-web-rig › @rushstack/heft-jest-plugin › @jest/core › @jest/reporters › @jest/transform › babel-plugin-istanbul › @istanbuljs/load-nyc-config › js-yaml` (100) | >=3.15.2 | lockfile refresh |
| 53 | high | `js-yaml` | 4.3.0, 4.1.1 | [GHSA-2883-xcg3-v3hh](https://github.com/advisories/GHSA-2883-xcg3-v3hh) | `apps/sudoku › @rushstack/heft-web-rig › @rushstack/eslint-config › @rushstack/eslint-plugin › @typescript-eslint/utils › @eslint-community/eslint-utils › eslint › @eslint/eslintrc › js-yaml` (116) | >=4.3.2 | direct bump `js-yaml` ~4.3.2 (ts-extras); other copies by lockfile refresh |
| 54 | high | `js-yaml` | 4.1.1 | [GHSA-52cp-r559-cp3m](https://github.com/advisories/GHSA-52cp-r559-cp3m) | `apps/sudoku › postcss-loader › cosmiconfig › js-yaml` (16) | >=4.3.0 | direct bump `js-yaml` ~4.3.2 (ts-extras); other copies by lockfile refresh |
| 55 | high | `js-yaml` | 3.15.0 | [GHSA-5p4m-2wfm-xmqj](https://github.com/advisories/GHSA-5p4m-2wfm-xmqj) | `apps/sudoku › @rushstack/heft-web-rig › @rushstack/heft-jest-plugin › @jest/core › @jest/reporters › @jest/transform › babel-plugin-istanbul › @istanbuljs/load-nyc-config › js-yaml` (100) | >=3.15.1 | lockfile refresh |
| 56 | high | `js-yaml` | 4.3.0, 4.1.1 | [GHSA-5p4m-2wfm-xmqj](https://github.com/advisories/GHSA-5p4m-2wfm-xmqj) | `apps/sudoku › @rushstack/heft-web-rig › @rushstack/eslint-config › @rushstack/eslint-plugin › @typescript-eslint/utils › @eslint-community/eslint-utils › eslint › @eslint/eslintrc › js-yaml` (116) | >=4.3.1 | direct bump `js-yaml` ~4.3.2 (ts-extras); other copies by lockfile refresh |
| 57 | high | `launch-editor` | 2.14.1 | [GHSA-587h-7wmj-h5pm](https://github.com/advisories/GHSA-587h-7wmj-h5pm) | `apps/sudoku › @rushstack/heft-web-rig › @rushstack/heft-webpack5-plugin › webpack › webpack-cli › @webpack-cli/serve › webpack-dev-server › launch-editor` (100) | >=2.14.2 | lockfile refresh (`rush update --full`) |
| 58 | high | `markdown-it` | 14.3.0 | [GHSA-gfr2-rv44-r23c](https://github.com/advisories/GHSA-gfr2-rv44-r23c) | `libraries/ts-bcp47 › typedoc › markdown-it` (21) | >=14.3.3 | lockfile refresh (`rush update --full`) |
| 59 | high | `markdown-it` | 14.3.0 | [GHSA-r7fv-28h4-cvq7](https://github.com/advisories/GHSA-r7fv-28h4-cvq7) | `libraries/ts-bcp47 › typedoc › markdown-it` (21) | >=14.3.2 | lockfile refresh (`rush update --full`) |
| 60 | high | `nanoid` | 3.3.15 | [GHSA-28wg-ghj8-5hjv](https://github.com/advisories/GHSA-28wg-ghj8-5hjv) | `apps/sudoku › @rushstack/heft-web-rig › @rushstack/heft-sass-plugin › postcss › nanoid` (100) | >=3.3.16 | lockfile refresh (`rush update --full`) |
| 61 | high | `nanoid` | 3.3.15 | [GHSA-2v37-7h3g-55p8](https://github.com/advisories/GHSA-2v37-7h3g-55p8) | `apps/sudoku › @rushstack/heft-web-rig › @rushstack/heft-sass-plugin › postcss › nanoid` (100) | >=3.3.18 | lockfile refresh (`rush update --full`) |
| 62 | high | `node-forge` | 1.4.0 | [GHSA-5x38-2vff-x55p](https://github.com/advisories/GHSA-5x38-2vff-x55p) | `apps/sudoku › @rushstack/heft-web-rig › @rushstack/heft-webpack5-plugin › @rushstack/debug-certificate-manager › node-forge` (7) | >=1.4.1 | lockfile refresh (`rush update --full`) |
| 63 | high | `node-forge` | 1.4.0 | [GHSA-7wch-p9px-956x](https://github.com/advisories/GHSA-7wch-p9px-956x) | `apps/sudoku › @rushstack/heft-web-rig › @rushstack/heft-webpack5-plugin › @rushstack/debug-certificate-manager › node-forge` (7) | >=1.4.1 | lockfile refresh (`rush update --full`) |
| 64 | high | `node-forge` | 1.4.0 | [GHSA-86w9-cpqp-85rv](https://github.com/advisories/GHSA-86w9-cpqp-85rv) | `apps/sudoku › @rushstack/heft-web-rig › @rushstack/heft-webpack5-plugin › @rushstack/debug-certificate-manager › node-forge` (7) | >=1.4.1 | lockfile refresh (`rush update --full`) |
| 65 | high | `node-forge` | 1.4.0 | [GHSA-8hrf-8g6f-7xwp](https://github.com/advisories/GHSA-8hrf-8g6f-7xwp) | `apps/sudoku › @rushstack/heft-web-rig › @rushstack/heft-webpack5-plugin › @rushstack/debug-certificate-manager › node-forge` (7) | >=1.4.1 | lockfile refresh (`rush update --full`) |
| 66 | high | `node-forge` | 1.4.0 | [GHSA-hqq3-7jhf-c5jx](https://github.com/advisories/GHSA-hqq3-7jhf-c5jx) | `apps/sudoku › @rushstack/heft-web-rig › @rushstack/heft-webpack5-plugin › @rushstack/debug-certificate-manager › node-forge` (7) | >=1.4.1 | lockfile refresh (`rush update --full`) |
| 67 | high | `node-forge` | 1.4.0 | [GHSA-jc66-7q78-782g](https://github.com/advisories/GHSA-jc66-7q78-782g) | `apps/sudoku › @rushstack/heft-web-rig › @rushstack/heft-webpack5-plugin › @rushstack/debug-certificate-manager › node-forge` (7) | >=1.4.1 | lockfile refresh (`rush update --full`) |
| 68 | high | `postcss` | 8.5.16 | [GHSA-r28c-9q8g-f849](https://github.com/advisories/GHSA-r28c-9q8g-f849) | `apps/sudoku › @rushstack/heft-web-rig › @rushstack/heft-sass-plugin › postcss` (100) | >=8.5.18 | lockfile refresh (`rush update --full`) |
| 69 | high | `react-router` | 7.18.1 | [GHSA-qwww-vcr4-c8h2](https://github.com/advisories/GHSA-qwww-vcr4-c8h2) | `apps/sudoku › react-router-dom › react-router` (1) | >=7.18.2 | lockfile refresh; `react-router-dom` floor raised to ^7.18.5 |
| 70 | high | `serialize-javascript` | 6.0.2 | [GHSA-5c6j-r48x-rmvq](https://github.com/advisories/GHSA-5c6j-r48x-rmvq) | `apps/sudoku › @rushstack/heft-web-rig › css-minimizer-webpack-plugin › serialize-javascript` (5) | >=7.0.3 | override `css-minimizer-webpack-plugin>serialize-javascript` |
| 71 | high | `sharp` | 0.34.5 | [GHSA-f88m-g3jw-g9cj](https://github.com/advisories/GHSA-f88m-g3jw-g9cj) | `libraries/ts-extras-transformers › @huggingface/transformers › sharp` (2) | >=0.35.0 | direct bump `@huggingface/transformers` ~4.3.2 (sharp 0.35.5) |
| 72 | high | `sharp` | 0.34.5 | [GHSA-rgj7-g3m4-5g8c](https://github.com/advisories/GHSA-rgj7-g3m4-5g8c) | `libraries/ts-extras-transformers › @huggingface/transformers › sharp` (2) | >=0.35.4 | direct bump `@huggingface/transformers` ~4.3.2 (sharp 0.35.5) |
| 73 | high | `sharp` | 0.34.5 | [GHSA-wq5f-xc86-pv6w](https://github.com/advisories/GHSA-wq5f-xc86-pv6w) | `libraries/ts-extras-transformers › @huggingface/transformers › sharp` (2) | >=0.35.5 | direct bump `@huggingface/transformers` ~4.3.2 (sharp 0.35.5) |
| 74 | high | `source-map-js` | 1.2.1 | [GHSA-68fv-2mgg-jv7q](https://github.com/advisories/GHSA-68fv-2mgg-jv7q) | `apps/sudoku › @rushstack/heft-web-rig › @rushstack/heft-sass-plugin › postcss › source-map-js` (100) | >=1.2.2 | lockfile refresh (`rush update --full`) |
| 75 | high | `svgo` | 2.8.2 | [GHSA-2p49-hgcm-8545](https://github.com/advisories/GHSA-2p49-hgcm-8545) | `apps/sudoku › @rushstack/heft-web-rig › css-minimizer-webpack-plugin › cssnano › cssnano-preset-default › postcss-svgo › svgo` (5) | >=2.8.3 | lockfile refresh (`rush update --full`) |
| 76 | high | `svgo` | 2.8.2 | [GHSA-w27v-7q3p-w38r](https://github.com/advisories/GHSA-w27v-7q3p-w38r) | `apps/sudoku › @rushstack/heft-web-rig › css-minimizer-webpack-plugin › cssnano › cssnano-preset-default › postcss-svgo › svgo` (5) | >=2.8.4 | lockfile refresh (`rush update --full`) |
| 77 | high | `zod` | 4.4.3 | [GHSA-mrhx-c7xc-m3w5](https://github.com/advisories/GHSA-mrhx-c7xc-m3w5) | `libraries/ts-extras-mcp › @modelcontextprotocol/sdk › zod` (4) | >=4.6.6 | lockfile refresh (`rush update --full`) |
| 78 | moderate | `@hono/node-server` | 1.19.14 | [GHSA-frvp-7c67-39w9](https://github.com/advisories/GHSA-frvp-7c67-39w9) | `libraries/ts-extras-mcp › @modelcontextprotocol/sdk › @hono/node-server` (2) | >=1.19.15 | lockfile refresh (`rush update --full`) |
| 79 | moderate | `@hono/node-server` | 1.19.14 | [GHSA-rmxm-3fg6-px4f](https://github.com/advisories/GHSA-rmxm-3fg6-px4f) | `libraries/ts-extras-mcp › @modelcontextprotocol/sdk › @hono/node-server` (2) | >=2.1.3 | lockfile refresh (`rush update --full`) |
| 80 | moderate | `@modelcontextprotocol/sdk` | 1.29.0 | [GHSA-6prh-2h8m-c8cw](https://github.com/advisories/GHSA-6prh-2h8m-c8cw) | `libraries/ts-extras-mcp › @modelcontextprotocol/sdk` (2) | >=1.32.0 | lockfile refresh; floor raised to ^1.32.2 |
| 81 | moderate | `@modelcontextprotocol/sdk` | 1.29.0 | [GHSA-rvq5-wwqv-78pq](https://github.com/advisories/GHSA-rvq5-wwqv-78pq) | `libraries/ts-extras-mcp › @modelcontextprotocol/sdk` (2) | >=1.32.0 | lockfile refresh; floor raised to ^1.32.2 |
| 82 | moderate | `adm-zip` | 0.5.18 | [GHSA-c6fg-446q-cg94](https://github.com/advisories/GHSA-c6fg-446q-cg94) | `libraries/ts-extras-transformers › @huggingface/transformers › onnxruntime-node › adm-zip` (2) | >=0.6.1 | direct bump `@huggingface/transformers` ~4.3.2 (onnxruntime-node 1.30 → adm-zip 0.6.1) |
| 83 | moderate | `adm-zip` | 0.5.18 | [GHSA-p634-w6r4-rjp2](https://github.com/advisories/GHSA-p634-w6r4-rjp2) | `libraries/ts-extras-transformers › @huggingface/transformers › onnxruntime-node › adm-zip` (2) | >=0.6.1 | direct bump `@huggingface/transformers` ~4.3.2 (onnxruntime-node 1.30 → adm-zip 0.6.1) |
| 84 | moderate | `adm-zip` | 0.5.18 | [GHSA-vwc7-r8mq-g2x9](https://github.com/advisories/GHSA-vwc7-r8mq-g2x9) | `libraries/ts-extras-transformers › @huggingface/transformers › onnxruntime-node › adm-zip` (2) | >=0.6.1 | direct bump `@huggingface/transformers` ~4.3.2 (onnxruntime-node 1.30 → adm-zip 0.6.1) |
| 85 | moderate | `axios` | 1.18.1 | [GHSA-44g4-m2mj-wpvx](https://github.com/advisories/GHSA-44g4-m2mj-wpvx) | `libraries/ts-bcp47 › axios` (1) | >=1.20.0 | lockfile refresh; floor raised to ^1.21.0 |
| 86 | moderate | `axios` | 1.18.1 | [GHSA-4hqw-qxg8-jxx2](https://github.com/advisories/GHSA-4hqw-qxg8-jxx2) | `libraries/ts-bcp47 › axios` (1) | >=1.20.0 | lockfile refresh; floor raised to ^1.21.0 |
| 87 | moderate | `axios` | 1.18.1 | [GHSA-9fr6-4gfg-395g](https://github.com/advisories/GHSA-9fr6-4gfg-395g) | `libraries/ts-bcp47 › axios` (1) | >=1.20.0 | lockfile refresh; floor raised to ^1.21.0 |
| 88 | moderate | `axios` | 1.18.1 | [GHSA-j8rh-479h-cp32](https://github.com/advisories/GHSA-j8rh-479h-cp32) | `libraries/ts-bcp47 › axios` (1) | >=1.20.0 | lockfile refresh; floor raised to ^1.21.0 |
| 89 | moderate | `axios` | 1.18.1 | [GHSA-vh66-26gq-q6x8](https://github.com/advisories/GHSA-vh66-26gq-q6x8) | `libraries/ts-bcp47 › axios` (1) | >=1.20.0 | lockfile refresh; floor raised to ^1.21.0 |
| 90 | moderate | `baseline-browser-mapping` | 2.10.42 | [GHSA-w5vr-8v7q-w6rv](https://github.com/advisories/GHSA-w5vr-8v7q-w6rv) | `apps/sudoku › @rushstack/heft-web-rig › @rushstack/heft-jest-plugin › @jest/core › @jest/reporters › @jest/transform › @babel/core › @babel/helper-compilation-targets › browserslist › baseline-browser-mapping` (100) | >=2.11.0 | lockfile refresh (`rush update --full`) |
| 91 | moderate | `brace-expansion` | 1.1.16 | [GHSA-q2hr-2g5m-vwhr](https://github.com/advisories/GHSA-q2hr-2g5m-vwhr) | `apps/sudoku › @rushstack/heft-web-rig › @rushstack/eslint-config › @rushstack/eslint-plugin › @typescript-eslint/utils › @eslint-community/eslint-utils › eslint › @eslint/config-array › minimatch › brace-expansion` (100) | >=1.1.21 | lockfile refresh (`rush update --full`) |
| 92 | moderate | `brace-expansion` | 2.1.4 | [GHSA-q2hr-2g5m-vwhr](https://github.com/advisories/GHSA-q2hr-2g5m-vwhr) | `apps/sudoku › @rushstack/heft-web-rig › @rushstack/heft-jest-plugin › @jest/core › @jest/reporters › glob › minimatch › brace-expansion` (100) | >=2.1.7 | lockfile refresh (`rush update --full`) |
| 93 | moderate | `brace-expansion` | 5.0.7 | [GHSA-q2hr-2g5m-vwhr](https://github.com/advisories/GHSA-q2hr-2g5m-vwhr) | `apps/sudoku › @rushstack/heft-web-rig › @microsoft/api-extractor › minimatch › brace-expansion` (100) | >=5.0.12 | lockfile refresh (`rush update --full`) |
| 94 | moderate | `colord` | 2.9.3 | [GHSA-2wm5-q62r-hmrv](https://github.com/advisories/GHSA-2wm5-q62r-hmrv) | `apps/sudoku › @rushstack/heft-web-rig › css-minimizer-webpack-plugin › cssnano › cssnano-preset-default › postcss-colormin › colord` (10) | >=2.9.4 | lockfile refresh (`rush update --full`) |
| 95 | moderate | `fast-uri` | 3.1.3 | [GHSA-hrr3-gc8f-f4qj](https://github.com/advisories/GHSA-hrr3-gc8f-f4qj) | `apps/sudoku › @rushstack/heft › @rushstack/heft-config-file › @rushstack/node-core-library › ajv › fast-uri` (100) | >=3.1.8 | lockfile refresh (`rush update --full`) |
| 96 | moderate | `fast-uri` | 3.1.3 | [GHSA-w74x-v6f9-j3xg](https://github.com/advisories/GHSA-w74x-v6f9-j3xg) | `apps/sudoku › @rushstack/heft › @rushstack/heft-config-file › @rushstack/node-core-library › ajv › fast-uri` (100) | >=3.1.9 | lockfile refresh (`rush update --full`) |
| 97 | moderate | `fast-uri` | 3.1.3 | [GHSA-wjr9-j795-jxcr](https://github.com/advisories/GHSA-wjr9-j795-jxcr) | `apps/sudoku › @rushstack/heft › @rushstack/heft-config-file › @rushstack/node-core-library › ajv › fast-uri` (100) | >=3.1.9 | lockfile refresh (`rush update --full`) |
| 98 | moderate | `glob` | 10.5.0, 13.0.6 | [GHSA-3g3m-2fjr-6pw4](https://github.com/advisories/GHSA-3g3m-2fjr-6pw4) | `apps/sudoku › @rushstack/heft-web-rig › @rushstack/heft-jest-plugin › @jest/core › @jest/reporters › glob` (200) | >=14.0.2 | **open** — see below |
| 99 | moderate | `handlebars` | 4.7.9 | [GHSA-xw65-4hp5-5hc7](https://github.com/advisories/GHSA-xw65-4hp5-5hc7) | `libraries/ts-agent-memory › ts-jest › handlebars` (31) | >=4.7.10 | lockfile refresh (`rush update --full`) |
| 100 | moderate | `hono` | 4.7.11 | [GHSA-26pp-8wgv-hjvm](https://github.com/advisories/GHSA-26pp-8wgv-hjvm) | `libraries/ts-http-storage › hono` (1) | >=4.12.12 | direct bump `hono` ~4.13.16 (ts-http-storage) |
| 101 | moderate | `hono` | 4.7.11 | [GHSA-2gcr-mfcq-wcc3](https://github.com/advisories/GHSA-2gcr-mfcq-wcc3) | `libraries/ts-http-storage › hono` (1) | >=4.12.21 | direct bump `hono` ~4.13.16 (ts-http-storage) |
| 102 | moderate | `hono` | 4.7.11 | [GHSA-3hrh-pfw6-9m5x](https://github.com/advisories/GHSA-3hrh-pfw6-9m5x) | `libraries/ts-http-storage › hono` (1) | >=4.12.21 | direct bump `hono` ~4.13.16 (ts-http-storage) |
| 103 | moderate | `hono` | 4.7.11 | [GHSA-458j-xx4x-4375](https://github.com/advisories/GHSA-458j-xx4x-4375) | `libraries/ts-http-storage › hono` (1) | >=4.12.14 | direct bump `hono` ~4.13.16 (ts-http-storage) |
| 104 | moderate | `hono` | 4.12.29 | [GHSA-54fx-42gc-7vw4](https://github.com/advisories/GHSA-54fx-42gc-7vw4) | `libraries/ts-extras-mcp › @modelcontextprotocol/sdk › @hono/node-server › hono` (4) | >=4.12.34 | lockfile refresh (MCP SDK's copy) |
| 105 | moderate | `hono` | 4.7.11 | [GHSA-5pq2-9x2x-5p6w](https://github.com/advisories/GHSA-5pq2-9x2x-5p6w) | `libraries/ts-http-storage › hono` (1) | >=4.12.4 | direct bump `hono` ~4.13.16 (ts-http-storage) |
| 106 | moderate | `hono` | 4.12.29 | [GHSA-5r4p-p66f-jhc7](https://github.com/advisories/GHSA-5r4p-p66f-jhc7) | `libraries/ts-extras-mcp › @modelcontextprotocol/sdk › @hono/node-server › hono` (4) | >=4.13.11 | lockfile refresh (MCP SDK's copy) |
| 107 | moderate | `hono` | 4.7.11 | [GHSA-69xw-7hcm-h432](https://github.com/advisories/GHSA-69xw-7hcm-h432) | `libraries/ts-http-storage › hono` (1) | >=4.12.16 | direct bump `hono` ~4.13.16 (ts-http-storage) |
| 108 | moderate | `hono` | 4.7.11 | [GHSA-6wqw-2p9w-4vw4](https://github.com/advisories/GHSA-6wqw-2p9w-4vw4) | `libraries/ts-http-storage › hono` (1) | >=4.11.7 | direct bump `hono` ~4.13.16 (ts-http-storage) |
| 109 | moderate | `hono` | 4.12.29, 4.7.11 | [GHSA-8j4g-w8fx-2239](https://github.com/advisories/GHSA-8j4g-w8fx-2239) | `libraries/ts-extras-mcp › @modelcontextprotocol/sdk › @hono/node-server › hono` (5) | >=4.12.34 | direct bump `hono` ~4.13.16 (ts-http-storage); MCP SDK's copy by lockfile refresh |
| 110 | moderate | `hono` | 4.7.11 | [GHSA-92vj-g62v-jqhh](https://github.com/advisories/GHSA-92vj-g62v-jqhh) | `libraries/ts-http-storage › hono` (1) | >=4.9.7 | direct bump `hono` ~4.13.16 (ts-http-storage) |
| 111 | moderate | `hono` | 4.7.11 | [GHSA-9r54-q6cx-xmh5](https://github.com/advisories/GHSA-9r54-q6cx-xmh5) | `libraries/ts-http-storage › hono` (1) | >=4.11.7 | direct bump `hono` ~4.13.16 (ts-http-storage) |
| 112 | moderate | `hono` | 4.7.11 | [GHSA-9vqf-7f2p-gf9v](https://github.com/advisories/GHSA-9vqf-7f2p-gf9v) | `libraries/ts-http-storage › hono` (1) | >=4.12.16 | direct bump `hono` ~4.13.16 (ts-http-storage) |
| 113 | moderate | `hono` | 4.12.29, 4.7.11 | [GHSA-crvj-82cr-hjcx](https://github.com/advisories/GHSA-crvj-82cr-hjcx) | `libraries/ts-extras-mcp › @modelcontextprotocol/sdk › @hono/node-server › hono` (5) | >=4.13.5 | direct bump `hono` ~4.13.16 (ts-http-storage); MCP SDK's copy by lockfile refresh |
| 114 | moderate | `hono` | 4.12.29, 4.7.11 | [GHSA-f23p-vx2j-j53r](https://github.com/advisories/GHSA-f23p-vx2j-j53r) | `libraries/ts-extras-mcp › @modelcontextprotocol/sdk › @hono/node-server › hono` (5) | >=4.12.34 | direct bump `hono` ~4.13.16 (ts-http-storage); MCP SDK's copy by lockfile refresh |
| 115 | moderate | `hono` | 4.7.11 | [GHSA-f577-qrjj-4474](https://github.com/advisories/GHSA-f577-qrjj-4474) | `libraries/ts-http-storage › hono` (1) | >=4.12.21 | direct bump `hono` ~4.13.16 (ts-http-storage) |
| 116 | moderate | `hono` | 4.12.29, 4.7.11 | [GHSA-g6gw-c38x-mqfc](https://github.com/advisories/GHSA-g6gw-c38x-mqfc) | `libraries/ts-extras-mcp › @modelcontextprotocol/sdk › @hono/node-server › hono` (5) | >=4.13.5 | direct bump `hono` ~4.13.16 (ts-http-storage); MCP SDK's copy by lockfile refresh |
| 117 | moderate | `hono` | 4.12.29, 4.7.11 | [GHSA-gqvv-2mrq-wpjv](https://github.com/advisories/GHSA-gqvv-2mrq-wpjv) | `libraries/ts-extras-mcp › @modelcontextprotocol/sdk › @hono/node-server › hono` (5) | >=4.13.5 | direct bump `hono` ~4.13.16 (ts-http-storage); MCP SDK's copy by lockfile refresh |
| 118 | moderate | `hono` | 4.12.29, 4.7.11 | [GHSA-hxh3-vqpv-xpqv](https://github.com/advisories/GHSA-hxh3-vqpv-xpqv) | `libraries/ts-extras-mcp › @modelcontextprotocol/sdk › @hono/node-server › hono` (5) | >=4.13.7 | direct bump `hono` ~4.13.16 (ts-http-storage); MCP SDK's copy by lockfile refresh |
| 119 | moderate | `hono` | 4.7.11 | [GHSA-j6c9-x7qj-28xf](https://github.com/advisories/GHSA-j6c9-x7qj-28xf) | `libraries/ts-http-storage › hono` (1) | >=4.12.25 | direct bump `hono` ~4.13.16 (ts-http-storage) |
| 120 | moderate | `hono` | 4.7.11 | [GHSA-p6xx-57qc-3wxr](https://github.com/advisories/GHSA-p6xx-57qc-3wxr) | `libraries/ts-http-storage › hono` (1) | >=4.12.4 | direct bump `hono` ~4.13.16 (ts-http-storage) |
| 121 | moderate | `hono` | 4.7.11 | [GHSA-p77w-8qqv-26rm](https://github.com/advisories/GHSA-p77w-8qqv-26rm) | `libraries/ts-http-storage › hono` (1) | >=4.12.18 | direct bump `hono` ~4.13.16 (ts-http-storage) |
| 122 | moderate | `hono` | 4.7.11 | [GHSA-q7jf-gf43-6x6p](https://github.com/advisories/GHSA-q7jf-gf43-6x6p) | `libraries/ts-http-storage › hono` (1) | >=4.10.3 | direct bump `hono` ~4.13.16 (ts-http-storage) |
| 123 | moderate | `hono` | 4.7.11 | [GHSA-qp7p-654g-cw7p](https://github.com/advisories/GHSA-qp7p-654g-cw7p) | `libraries/ts-http-storage › hono` (1) | >=4.12.18 | direct bump `hono` ~4.13.16 (ts-http-storage) |
| 124 | moderate | `hono` | 4.7.11 | [GHSA-r354-f388-2fhh](https://github.com/advisories/GHSA-r354-f388-2fhh) | `libraries/ts-http-storage › hono` (1) | >=4.11.7 | direct bump `hono` ~4.13.16 (ts-http-storage) |
| 125 | moderate | `hono` | 4.7.11 | [GHSA-r5rp-j6wh-rvv4](https://github.com/advisories/GHSA-r5rp-j6wh-rvv4) | `libraries/ts-http-storage › hono` (1) | >=4.12.12 | direct bump `hono` ~4.13.16 (ts-http-storage) |
| 126 | moderate | `hono` | 4.7.11 | [GHSA-rv63-4mwf-qqc2](https://github.com/advisories/GHSA-rv63-4mwf-qqc2) | `libraries/ts-http-storage › hono` (1) | >=4.12.25 | direct bump `hono` ~4.13.16 (ts-http-storage) |
| 127 | moderate | `hono` | 4.7.11 | [GHSA-v8w9-8mx6-g223](https://github.com/advisories/GHSA-v8w9-8mx6-g223) | `libraries/ts-http-storage › hono` (1) | >=4.12.7 | direct bump `hono` ~4.13.16 (ts-http-storage) |
| 128 | moderate | `hono` | 4.7.11 | [GHSA-w332-q679-j88p](https://github.com/advisories/GHSA-w332-q679-j88p) | `libraries/ts-http-storage › hono` (1) | >=4.11.7 | direct bump `hono` ~4.13.16 (ts-http-storage) |
| 129 | moderate | `hono` | 4.7.11 | [GHSA-w62v-xxxg-mg59](https://github.com/advisories/GHSA-w62v-xxxg-mg59) | `libraries/ts-http-storage › hono` (1) | >=4.12.27 | direct bump `hono` ~4.13.16 (ts-http-storage) |
| 130 | moderate | `hono` | 4.7.11 | [GHSA-wgpf-jwqj-8h8p](https://github.com/advisories/GHSA-wgpf-jwqj-8h8p) | `libraries/ts-http-storage › hono` (1) | >=4.12.25 | direct bump `hono` ~4.13.16 (ts-http-storage) |
| 131 | moderate | `hono` | 4.7.11 | [GHSA-wmmm-f939-6g9c](https://github.com/advisories/GHSA-wmmm-f939-6g9c) | `libraries/ts-http-storage › hono` (1) | >=4.12.12 | direct bump `hono` ~4.13.16 (ts-http-storage) |
| 132 | moderate | `hono` | 4.7.11 | [GHSA-wwfh-h76j-fc44](https://github.com/advisories/GHSA-wwfh-h76j-fc44) | `libraries/ts-http-storage › hono` (1) | >=4.12.25 | direct bump `hono` ~4.13.16 (ts-http-storage) |
| 133 | moderate | `hono` | 4.7.11 | [GHSA-xf4j-xp2r-rqqx](https://github.com/advisories/GHSA-xf4j-xp2r-rqqx) | `libraries/ts-http-storage › hono` (1) | >=4.12.12 | direct bump `hono` ~4.13.16 (ts-http-storage) |
| 134 | moderate | `hono` | 4.7.11 | [GHSA-xgm2-5f3f-mvvc](https://github.com/advisories/GHSA-xgm2-5f3f-mvvc) | `libraries/ts-http-storage › hono` (1) | >=4.12.27 | direct bump `hono` ~4.13.16 (ts-http-storage) |
| 135 | moderate | `hono` | 4.7.11 | [GHSA-xpcf-pg52-r92g](https://github.com/advisories/GHSA-xpcf-pg52-r92g) | `libraries/ts-http-storage › hono` (1) | >=4.12.12 | direct bump `hono` ~4.13.16 (ts-http-storage) |
| 136 | moderate | `hono` | 4.7.11 | [GHSA-xrhx-7g5j-rcj5](https://github.com/advisories/GHSA-xrhx-7g5j-rcj5) | `libraries/ts-http-storage › hono` (1) | >=4.12.21 | direct bump `hono` ~4.13.16 (ts-http-storage) |
| 137 | moderate | `ip-address` | 10.2.0 | [GHSA-22jq-vg5j-6vgg](https://github.com/advisories/GHSA-22jq-vg5j-6vgg) | `libraries/ts-extras-mcp › @modelcontextprotocol/sdk › express-rate-limit › ip-address` (2) | >=10.2.1 | lockfile refresh (`rush update --full`) |
| 138 | moderate | `ip-address` | 10.2.0 | [GHSA-2vr4-cq9g-pvrc](https://github.com/advisories/GHSA-2vr4-cq9g-pvrc) | `libraries/ts-extras-mcp › @modelcontextprotocol/sdk › express-rate-limit › ip-address` (2) | >=10.5.1 | lockfile refresh (`rush update --full`) |
| 139 | moderate | `ip-address` | 10.2.0 | [GHSA-4xrf-jv44-h6hh](https://github.com/advisories/GHSA-4xrf-jv44-h6hh) | `libraries/ts-extras-mcp › @modelcontextprotocol/sdk › express-rate-limit › ip-address` (2) | >=10.2.2 | lockfile refresh (`rush update --full`) |
| 140 | moderate | `ip-address` | 10.2.0 | [GHSA-h3mg-xc3c-68pw](https://github.com/advisories/GHSA-h3mg-xc3c-68pw) | `libraries/ts-extras-mcp › @modelcontextprotocol/sdk › express-rate-limit › ip-address` (2) | >=10.7.1 | lockfile refresh (`rush update --full`) |
| 141 | moderate | `ip-address` | 10.2.0 | [GHSA-j6r3-76f7-8jcv](https://github.com/advisories/GHSA-j6r3-76f7-8jcv) | `libraries/ts-extras-mcp › @modelcontextprotocol/sdk › express-rate-limit › ip-address` (2) | >=10.7.1 | lockfile refresh (`rush update --full`) |
| 142 | moderate | `ip-address` | 10.2.0 | [GHSA-rpw4-54j3-4h4q](https://github.com/advisories/GHSA-rpw4-54j3-4h4q) | `libraries/ts-extras-mcp › @modelcontextprotocol/sdk › express-rate-limit › ip-address` (2) | >=10.5.1 | lockfile refresh (`rush update --full`) |
| 143 | moderate | `ip-address` | 10.2.0 | [GHSA-rxp7-6hxx-x8q5](https://github.com/advisories/GHSA-rxp7-6hxx-x8q5) | `libraries/ts-extras-mcp › @modelcontextprotocol/sdk › express-rate-limit › ip-address` (2) | >=10.7.4 | lockfile refresh (`rush update --full`) |
| 144 | moderate | `js-yaml` | 4.1.1 | [GHSA-h67p-54hq-rp68](https://github.com/advisories/GHSA-h67p-54hq-rp68) | `apps/sudoku › postcss-loader › cosmiconfig › js-yaml` (16) | >=4.1.2 | direct bump `js-yaml` ~4.3.2 (ts-extras); other copies by lockfile refresh |
| 145 | moderate | `launch-editor` | 2.14.1 | [GHSA-698v-4r3x-3vcv](https://github.com/advisories/GHSA-698v-4r3x-3vcv) | `apps/sudoku › @rushstack/heft-web-rig › @rushstack/heft-webpack5-plugin › webpack › webpack-cli › @webpack-cli/serve › webpack-dev-server › launch-editor` (100) | >=2.14.2 | lockfile refresh (`rush update --full`) |
| 146 | moderate | `launch-editor` | 2.14.1 | [GHSA-r825-w8mm-5pxw](https://github.com/advisories/GHSA-r825-w8mm-5pxw) | `apps/sudoku › @rushstack/heft-web-rig › @rushstack/heft-webpack5-plugin › webpack › webpack-cli › @webpack-cli/serve › webpack-dev-server › launch-editor` (100) | >=2.14.2 | lockfile refresh (`rush update --full`) |
| 147 | moderate | `markdown-it` | 14.3.0 | [GHSA-253c-mchw-3w2r](https://github.com/advisories/GHSA-253c-mchw-3w2r) | `libraries/ts-bcp47 › typedoc › markdown-it` (21) | >=14.3.1 | lockfile refresh (`rush update --full`) |
| 148 | moderate | `minimatch` | 10.2.3, 10.2.5, 9.0.9 | [GHSA-g3hv-75wg-m249](https://github.com/advisories/GHSA-g3hv-75wg-m249) | `apps/sudoku › @rushstack/heft-web-rig › @microsoft/api-extractor › minimatch` (264) | >=11.0.1 | **open** — see below |
| 149 | moderate | `node-forge` | 1.4.0 | [GHSA-525v-9gp9-w22h](https://github.com/advisories/GHSA-525v-9gp9-w22h) | `apps/sudoku › @rushstack/heft-web-rig › @rushstack/heft-webpack5-plugin › @rushstack/debug-certificate-manager › node-forge` (7) | >=1.4.1 | lockfile refresh (`rush update --full`) |
| 150 | moderate | `node-forge` | 1.4.0 | [GHSA-5cwg-6vw7-rj6p](https://github.com/advisories/GHSA-5cwg-6vw7-rj6p) | `apps/sudoku › @rushstack/heft-web-rig › @rushstack/heft-webpack5-plugin › @rushstack/debug-certificate-manager › node-forge` (7) | >=1.4.1 | lockfile refresh (`rush update --full`) |
| 151 | moderate | `node-forge` | 1.4.0 | [GHSA-6wvx-3r32-xmcg](https://github.com/advisories/GHSA-6wvx-3r32-xmcg) | `apps/sudoku › @rushstack/heft-web-rig › @rushstack/heft-webpack5-plugin › @rushstack/debug-certificate-manager › node-forge` (7) | >=1.4.1 | lockfile refresh (`rush update --full`) |
| 152 | moderate | `pbkdf2` | 3.1.6 | [GHSA-477h-4r7f-fvrx](https://github.com/advisories/GHSA-477h-4r7f-fvrx) | `tools/ts-res-browser › crypto-browserify › browserify-sign › parse-asn1 › pbkdf2` (6) | >=3.1.7 | lockfile refresh (`rush update --full`) |
| 153 | moderate | `postcss` | 8.5.16 | [GHSA-fxqj-rqcc-2cmp](https://github.com/advisories/GHSA-fxqj-rqcc-2cmp) | `apps/sudoku › @rushstack/heft-web-rig › @rushstack/heft-sass-plugin › postcss` (100) | >=8.5.23 | lockfile refresh (`rush update --full`) |
| 154 | moderate | `postcss-selector-parser` | 6.1.4 | [GHSA-rj75-hqrm-r3gf](https://github.com/advisories/GHSA-rj75-hqrm-r3gf) | `apps/sudoku › @rushstack/heft-web-rig › css-minimizer-webpack-plugin › cssnano › cssnano-preset-default › postcss-calc › postcss-selector-parser` (35) | >=6.1.5 | lockfile refresh (`rush update --full`) |
| 155 | moderate | `postcss-selector-parser` | 7.1.4 | [GHSA-rj75-hqrm-r3gf](https://github.com/advisories/GHSA-rj75-hqrm-r3gf) | `apps/sudoku › @rushstack/heft-web-rig › @rushstack/heft-sass-plugin › postcss-modules › postcss-modules-local-by-default › postcss-selector-parser` (32) | >=7.1.6 | lockfile refresh (`rush update --full`) |
| 156 | moderate | `qs` | 6.15.3 | [GHSA-4mjr-xmp4-gh2g](https://github.com/advisories/GHSA-4mjr-xmp4-gh2g) | `apps/sudoku › @rushstack/heft-web-rig › @rushstack/heft-webpack5-plugin › webpack › webpack-cli › @webpack-cli/serve › webpack-dev-server › express › body-parser › qs` (100) | >=6.16.0 | lockfile refresh (`rush update --full`) |
| 157 | moderate | `qs` | 6.15.3 | [GHSA-6pq8-jhm2-2vcw](https://github.com/advisories/GHSA-6pq8-jhm2-2vcw) | `apps/sudoku › @rushstack/heft-web-rig › @rushstack/heft-webpack5-plugin › webpack › webpack-cli › @webpack-cli/serve › webpack-dev-server › express › body-parser › qs` (100) | >=6.16.1 | lockfile refresh (`rush update --full`) |
| 158 | moderate | `qs` | 6.15.3 | [GHSA-x5fp-wj9c-mxmx](https://github.com/advisories/GHSA-x5fp-wj9c-mxmx) | `apps/sudoku › @rushstack/heft-web-rig › @rushstack/heft-webpack5-plugin › webpack › webpack-cli › @webpack-cli/serve › webpack-dev-server › express › body-parser › qs` (100) | >=6.15.4 | lockfile refresh (`rush update --full`) |
| 159 | moderate | `serialize-javascript` | 6.0.2 | [GHSA-qj8w-gfj5-8c6v](https://github.com/advisories/GHSA-qj8w-gfj5-8c6v) | `apps/sudoku › @rushstack/heft-web-rig › css-minimizer-webpack-plugin › serialize-javascript` (5) | >=7.0.5 | override `css-minimizer-webpack-plugin>serialize-javascript` |
| 160 | moderate | `svgo` | 2.8.2 | [GHSA-4vpr-x523-8j87](https://github.com/advisories/GHSA-4vpr-x523-8j87) | `apps/sudoku › @rushstack/heft-web-rig › css-minimizer-webpack-plugin › cssnano › cssnano-preset-default › postcss-svgo › svgo` (5) | >=2.8.4 | lockfile refresh (`rush update --full`) |
| 161 | moderate | `uuid` | 8.3.2 | [GHSA-w5hq-g745-h8pq](https://github.com/advisories/GHSA-w5hq-g745-h8pq) | `apps/sudoku › @rushstack/heft-web-rig › @rushstack/heft-webpack5-plugin › webpack › webpack-cli › @webpack-cli/serve › webpack-dev-server › sockjs › uuid` (100) | >=11.1.1 | override `sockjs>uuid` |
| 162 | low | `deepmerge` | 4.3.1 | [GHSA-gcqx-w48m-w2h4](https://github.com/advisories/GHSA-gcqx-w48m-w2h4) | `apps/sudoku › @rushstack/heft-web-rig › @rushstack/heft-jest-plugin › @jest/core › jest-config › deepmerge` (100) | no fix published | **open**: no fix published (§ 2a) |
| 163 | low | `elliptic` | 6.6.1 | [GHSA-848j-6mx2-7j84](https://github.com/advisories/GHSA-848j-6mx2-7j84) | `tools/ts-res-browser › crypto-browserify › browserify-sign › elliptic` (4) | no fix published | no fix published; **closed in round 1** by removing unused `crypto-browserify` (gone from the lockfile) |
| 164 | low | `fast-uri` | 3.1.3 | [GHSA-333x-w4r6-6crp](https://github.com/advisories/GHSA-333x-w4r6-6crp) | `apps/sudoku › @rushstack/heft › @rushstack/heft-config-file › @rushstack/node-core-library › ajv › fast-uri` (100) | >=3.1.9 | lockfile refresh (`rush update --full`) |
| 165 | low | `fast-uri` | 3.1.3 | [GHSA-xhq7-xmqj-769h](https://github.com/advisories/GHSA-xhq7-xmqj-769h) | `apps/sudoku › @rushstack/heft › @rushstack/heft-config-file › @rushstack/node-core-library › ajv › fast-uri` (100) | >=3.1.9 | lockfile refresh (`rush update --full`) |
| 166 | low | `hono` | 4.12.29, 4.7.11 | [GHSA-79qm-7rj5-m7r9](https://github.com/advisories/GHSA-79qm-7rj5-m7r9) | `libraries/ts-extras-mcp › @modelcontextprotocol/sdk › @hono/node-server › hono` (5) | >=4.12.34 | direct bump `hono` ~4.13.16 (ts-http-storage); MCP SDK's copy by lockfile refresh |
| 167 | low | `hono` | 4.7.11 | [GHSA-gq3j-xvxp-8hrf](https://github.com/advisories/GHSA-gq3j-xvxp-8hrf) | `libraries/ts-http-storage › hono` (1) | >=4.11.10 | direct bump `hono` ~4.13.16 (ts-http-storage) |
| 168 | low | `hono` | 4.7.11 | [GHSA-hm8q-7f3q-5f36](https://github.com/advisories/GHSA-hm8q-7f3q-5f36) | `libraries/ts-http-storage › hono` (1) | >=4.12.18 | direct bump `hono` ~4.13.16 (ts-http-storage) |
| 169 | low | `markdown-it` | 14.3.0 | [GHSA-vfgh-jcmw-g37q](https://github.com/advisories/GHSA-vfgh-jcmw-g37q) | `libraries/ts-bcp47 › typedoc › markdown-it` (21) | >=14.3.3 | lockfile refresh (`rush update --full`) |
| 170 | low | `node-forge` | 1.4.0 | [GHSA-4487-j8r4-4g2f](https://github.com/advisories/GHSA-4487-j8r4-4g2f) | `apps/sudoku › @rushstack/heft-web-rig › @rushstack/heft-webpack5-plugin › @rushstack/debug-certificate-manager › node-forge` (7) | >=1.4.1 | lockfile refresh (`rush update --full`) |
| 171 | low | `node-forge` | 1.4.0 | [GHSA-4642-5mcj-2rqw](https://github.com/advisories/GHSA-4642-5mcj-2rqw) | `apps/sudoku › @rushstack/heft-web-rig › @rushstack/heft-webpack5-plugin › @rushstack/debug-certificate-manager › node-forge` (7) | >=1.4.1 | lockfile refresh (`rush update --full`) |
| 172 | low | `node-forge` | 1.4.0 | [GHSA-h6cr-wjv9-3cpp](https://github.com/advisories/GHSA-h6cr-wjv9-3cpp) | `apps/sudoku › @rushstack/heft-web-rig › @rushstack/heft-webpack5-plugin › @rushstack/debug-certificate-manager › node-forge` (7) | >=1.4.1 | lockfile refresh (`rush update --full`) |
| 173 | low | `serialize-javascript` | 6.0.2 | [GHSA-m5mm-p8h7-m29v](https://github.com/advisories/GHSA-m5mm-p8h7-m29v) | `apps/sudoku › @rushstack/heft-web-rig › css-minimizer-webpack-plugin › serialize-javascript` (5) | >=7.1.3 | override `css-minimizer-webpack-plugin>serialize-javascript` |

## 3. Overrides

Both in `common/config/rush/pnpm-config.json` `globalOverrides`, each scoped to the one parent
that pulls the vulnerable line in, each commented with its advisories. Verified effective: they
appear in the generated `common/temp/pnpm-workspace.yaml` `overrides:` block and the advisories
are gone from the after-audit.

| override | advisories | reason it is an override |
|---|---|---|
| `css-minimizer-webpack-plugin>serialize-javascript: ^7.1.4` | GHSA-5c6j-r48x-rmvq (high), GHSA-qj8w-gfj5-8c6v (moderate), GHSA-m5mm-p8h7-m29v (low) | `@rushstack/heft-web-rig` pins `css-minimizer-webpack-plugin ~3.4.1`, whose `serialize-javascript ^6` line has no fix. 7.x keeps the same CommonJS default export (`index.js`); its break is the Node >=20 floor and dropping `randombytes`. |
| `sockjs>uuid: ^11.1.1` | GHSA-w5hq-g745-h8pq (moderate) | `sockjs` 0.3.24 is its latest and ranges `uuid ^8.3.2`. It calls only `require('uuid').v4` (`lib/transport.js`), which uuid 11 exports unchanged from its `node.require` CommonJS entry. The advisory (v3/v5/v6 with a caller buffer) is not on that path either; the override is taken because it is cheap and clears the audit. |

**Precondition found on the way:** on the baseline Rush 5.177.2, `globalOverrides` was *silently
ignored* — Rush wrote it into the generated `common/temp/package.json` `pnpm` field, which pnpm 11
no longer reads (`rush-pnpm` printed exactly that warning). Rush 5.178.0's changelog: *"Fix pnpm 11
silently ignoring the `globalOverrides` … Rush now writes these settings to the generated
`common/temp/pnpm-workspace.yaml` for pnpm 11+"*. The same release moved `minimumReleaseAge` the
same way. Anyone who had added an override on 5.177.2 would have seen it accepted and not applied.

## 4. Outdated direct dependencies

### 4a. Taken — security (first commit)

| dependency | from | to | advisories closed |
|---|---|---|---|
| `hono` (ts-http-storage) | ~4.7.11 | ~4.13.16 | 43 (5 high) |
| `js-yaml` (ts-extras) | ~4.1.1 | ~4.3.2 | 4 (3 high) |
| `@huggingface/transformers` (dev + peer, both transformers packages) | ~4.2.0 | ~4.3.2 | sharp ×3 high, adm-zip ×8 |
| `@modelcontextprotocol/sdk` (ts-extras-mcp, ts-extras-re2) | ^1.29.0 | ^1.32.2 | floor raised above 6 SDK advisories (the refresh had already resolved 1.32.2) |
| `axios` (ts-bcp47, dev) | ^1.11.0 | ^1.21.0 | floor raised above 12 |
| `react-router-dom` (apps/sudoku) | ^7.1.3 | ^7.18.5 | floor raised above 1 |
| Rush / pnpm | 5.177.2 / 11.12.0 | 5.182.1 / 11.28.9 | precondition for overrides (§ 3); pnpm `latest-11` tag |

### 4b. Taken — minor / patch refresh (every range that changed, consumers counted)

| dependency | from | to | package.json sites |
|---|---|---|---|
| `@babel/core` | ~7.29.0 | ~7.29.13 | 4 |
| `@babel/preset-env` | ~7.29.0 | ~7.29.7 | 4 |
| `@babel/preset-react` | ~7.28.5 | ~7.29.7 | 4 |
| `@babel/preset-typescript` | ~7.28.5 | ~7.29.7 | 4 |
| `@microsoft/api-documenter` | ^7.28.2 | ^7.30.20 | 11 |
| `@microsoft/api-extractor` | ^7.55.2 | ^7.60.1 | 26 |
| `@rushstack/eslint-config` | 4.6.4 | 4.7.0 | 34 |
| `@rushstack/eslint-patch` | 1.14.1 | 1.16.1 | 2 |
| `@simplewebauthn/browser` | ^13.0.0 | ^13.3.0 | 1 |
| `@simplewebauthn/server` | ^13.0.0 | ^13.3.3 | 1 |
| `@testing-library/dom` | ^10.4.0 | ^10.4.2 | 3 |
| `@testing-library/jest-dom` | ^6.4.2 | ~6.9.1 | 4 |
| `@testing-library/react` | ^16 | ^16.3.3 | 4 |
| `@testing-library/user-event` | ^14.6.1 | ^14.6.8 | 3 |
| `@types/better-sqlite3` | ^7.6.11 | ^7.6.13 | 2 |
| `@types/luxon` | ^3.7.1 | ^3.7.6 | 5 |
| `@types/mustache` | ^4.2.5 | ^4.2.6 | 3 |
| `@types/node` | ^20.14.9 | ^22.20.5 (round 1; ^20.19.43 at `72a83930`) | 38 |
| `@types/papaparse` | ^5.3.14 | ^5.5.2 | 1 |
| `@types/react` | ~19.2.8 | ~19.3.0 | 8 |
| `@types/react-dom` | ~19.2.3 | ~19.3.0 | 7 |
| `@typescript-eslint/eslint-plugin` | ^8.52.0 | ^8.72.1 | 30 |
| `@typescript-eslint/parser` | ^8.52.0 | ^8.72.1 | 30 |
| `argon2` | ^0.45.0 | ^0.45.2 | 1 |
| `autoprefixer` | ~10.4.23 | ~10.6.2 | 5 |
| `babel-loader` | ~10.1.0 | ~10.1.1 | 4 |
| `better-sqlite3` | ^12.0.0 | ^12.11.1 | 2 |
| `commander` | ^11.0.0 | ^11.1.0 | 5 |
| `core-js` | ~3.48.0 | ~3.51.0 | 3 |
| `cspell` | ^8.3.2 | ^8.19.4 | 1 |
| `css-loader` | ~7.1.2 | ~7.1.5 | 4 |
| `eslint` | ^9.39.2 | ^9.39.5 | 33 |
| `eslint-plugin-n` | ^17.23.1 | ^17.24.0 | 24 |
| `eslint-plugin-prettier` | ^5.5.4 | ^5.5.7 | 9 |
| `eslint-plugin-promise` | ^7.2.1 | ^7.3.0 | 27 |
| `eslint-plugin-react` | ^7.34.0 | ^7.37.5 | 4 |
| `eslint-plugin-tsdoc` | ~0.5.2 | ~0.5.4 | 25 |
| `fake-indexeddb` | ~6.2.5 | ~6.2.7 | 1 |
| `fflate` | ~0.8.2 | ~0.8.3 | 2 |
| `html-webpack-plugin` | ~5.6.5 | ~5.6.8 | 4 |
| `idb-keyval` | ^6.2.2 | ^6.3.0 | 1 |
| `json-edit-react` | ~1.29.0 | ~1.30.2 | 3 |
| `ollama` | ^0.6.0 | ^0.6.4 | 1 |
| `papaparse` | ^5.4.1 | ^5.7.0 | 1 |
| `postcss` | ~8.5.6 | ~8.5.32 | 5 |
| `postcss-loader` | ~8.2.0 | ~8.2.1 | 4 |
| `prettier` | ^3.7.4 | ^3.9.10 | 10 |
| `react` | ~19.2.3 | ~19.3.1 | 7 |
| `react-dom` | ~19.2.3 | ~19.3.1 | 7 |
| `rimraf` | ^6.1.2 | ^6.1.4 | 30 |
| `serve-handler` | ~6.1.6 | ~6.1.7 | 2 |
| `tailwindcss` | ^3.4.0 | ^3.4.19 | 5 |
| `ts-jest` | ^29.4.12 | ^29.4.15 | 31 |
| `tslib` | ^2.8.1 | ^2.9.1 | 6 |
| `typedoc` | ~0.28.16 | ~0.28.20 | 15 |
| `typedoc-plugin-markdown` | ~4.9.0 | ~4.14.1 | 6 |
| `webpack` | ~5.105.4 | ~5.112.2 | 4 |
| `webpack-dev-server` | ~5.2.2 | ~5.2.7 | 4 |

Toolchain rows above stay inside their major as the brief requires: `eslint` 9.39.5 (9.x is
marked unsupported upstream — see 4d), `@typescript-eslint/*` 8.72.1, `@types/node` 22.20.5 (moved from 20.19.43 in round 1: 22 is the oldest supported runtime),
`react` / `react-dom` 19.3.1, `prettier` 3.9.10. `typescript` stays 5.9.3, the latest 5.x.
`@testing-library/jest-dom` moves to `~6.9.1`, not `^6.x`: 6.10.0 is deprecated upstream as *"Incorrect
minor release with breaking changes (Node >=22 and required @testing-library/dom peer)"*, and a caret
would resolve it.

### 4c. Held — available in the current major, deliberately not taken

| dependency | at | available | why held |
|---|---|---|---|
| `@rushstack/heft` + `heft-node-rig` / `heft-web-rig` / `heft-jest-plugin` / `heft-lint-plugin` / `heft-api-extractor-plugin` / `heft-sass-plugin` / `heft-webpack5-plugin` | 1.3.0 / 2.11.50 / 1.4.34 / 2.0.17 / 1.2.27 / 1.3.27 / 1.4.11 / 1.3.28 | 1.3.5 / 2.11.56 / 1.4.42 / 2.0.22 / 1.4.2 / 1.3.32 / 1.6.1 / 1.4.2 | Taken first, it failed `rush rebuild` (`scratchpad/deps/rebuild.log`): heft-lint-plugin **1.3.0** "lint[s] files selected by ESLint flat config even when they are not part of the TypeScript program", so every `eslint.config.js` whose override block names `@rushstack/packlets/mechanics` without a `files` glob becomes a config error (`ts-utils`, `repo-template` failed first). And the rigs' `@rushstack/eslint-config` **4.9.0** enables `@rushstack/prefer-ecmascript-private-members: 'warn'` against every `private _member` in the repo, which CI fails on. The Heft plugins pin `@rushstack/heft` exactly, so the family cannot be split (`ERR_PNPM_PEER_DEP_ISSUES`, `scratchpad/deps/update-5.log`). Behaviourally a major; see 4d. |
| `@rushstack/eslint-config` | 4.7.0 (from 4.6.4) | 4.9.0 | Taken to 4.7.0 only: the rigs already ran 4.7.0 and its changelog says the compiled config is runtime-identical. 4.8.0 adds build-output ignores (harmless); 4.9.0 is the private-members rule above. Held at 4.7.0 so the direct and rig copies agree. |
| `re2js` (ts-extras-re2) | 2.8.8 (exact) | 2.9.1 | The package's own policy (ACTIVE_DEVELOPMENT): it "pins `re2js` exactly, and each bump is reviewed against the README's dialect table". That review needs the upstream changelog, and GitHub access to `le0pard/re2js` was not available in this session. No advisory. S. |
| `@typesafe-ai/sdk` (ts-extras-system-one) | ~0.6.0 | 0.7.0 | A 0.x minor; the package's policy treats "every SDK minor [as] a wire change reviewed against the behaviours its README lists". No advisory. Reported as a major. |
| peer ranges (`better-sqlite3 ^12.0.0`, `sqlite-vec`, `ollama ^0.6.0`, `mustache`, react `>=18`, typedoc `>=0.28.0`) | — | — | Consumer-facing; raising a peer floor narrows what a consumer may install, and nothing here needed it. The one peer that moved is `@huggingface/transformers`, because the security fix required it. |

### 4d. Majors available — reported for a follow-up decision

Effort: S ≈ an hour or two, M ≈ a day, L ≈ a stream. **The Node floor does not block any of these.**
`rush.json` `nodeSupportedVersionRange` is `>=22.22.0 <23.0.0 || >=24.15.0 <25.0.0`, the tools'
`engines` agree, and CI runs 24.15.0. Every engines range quoted below is satisfied by that floor.
*(Amended in review round 1: this paragraph first said the floor was Node 20, which it took from a stale
MONOREPO_GUIDE. That guide is now corrected in this branch.)*

| dependency | at → latest | breaking change that affects us | effort |
|---|---|---|---|
| `typescript` | 5.9.3 → 7.0.2 (6.0.3 also out) | New native compiler line; 6.0's deprecations become errors in 7. Every package's tsconfig and the api-extractor / ts-jest / typescript-eslint chain must support it. (api-extractor 7.60 already bundles TS 6.0.3 for its own analysis.) | L |
| Heft family + `@rushstack/eslint-config` 4.9 | see 4c | Non-TS files linted (up to 36 `eslint.config.js` files set `@rushstack/packlets/mechanics` in a block that may need `files` scoping; not counted per block) and `prefer-ecmascript-private-members` across every class. Needs a decision: migrate to `#private`, or a repo-level rule disposition. | L |
| `eslint` | 9.39.5 → 10.14.0 | 9.x is marked "no longer supported" upstream. Needs `@rushstack/eslint-config` / heft-lint-plugin support for 10 first, so it follows the Heft decision. | M |
| `@types/node` | 22.20.5 → 26.6.6 | Taken to the latest 22.x in round 1 (§ 4b), because 22 is the oldest runtime `rush.json` supports. Typing for 24 or later would let code use APIs that are absent on Node 22, which the range still admits. | S |
| pnpm | 11.28.9 → 12.18.0 | Rush 5.182 adds PNPM 12 handling (rejects `--resolution-only`, new store/cache env vars). Needs a Rush-side compatibility check on the install/CI path. | M |
| `@simplewebauthn/server` / `browser` | 13.3.x → 14.0.x | Major of the upstream wrapped by `ts-extras-webauthn` / `ts-web-extras-webauthn` (Result boundaries); option and response shapes re-reviewed against each README's in-scope list. | M |
| `@typesafe-ai/sdk` | 0.6.0 → 0.7.0 | 0.x minor = wire change for `ts-extras-system-one` (14 source files) by that package's policy. | M |
| `js-yaml` | 4.3.2 → 5.5.0 | `ts-extras` yaml packlet is an established ("handle with care") surface; 2 source files. API surface of 5 not assessed here. | S–M |
| `better-sqlite3` | 12.11.1 → 13.0.3 | Node ≥22 (within the floor). Dev + peer of `ts-agent-memory-sqlite-vec` (peer move is consumer-facing); 11 source files touch it. With `@types/better-sqlite3` 7 → 9. | S–M |
| `tailwindcss` | 3.4.19 → 4.3.4 | v4 is CSS-first config and moves the PostCSS plugin to a separate package; 5 packages' build config. | M |
| `@babel/core` + presets | 7.29 → 8.x | ESM-only; Node `^22.18 || >=24.11` is within the floor; webpack builds of the playground / browser tools. | S–M |
| `webpack-dev-server` | 5.2.7 → 6.1.0 | ESM-only; Node ≥22.15 is within the floor; also drops sockjs, which would retire the `sockjs>uuid` override. | S |
| `webpack-cli` | 6.0.1 → 7.3.1 | Node ≥20.9; new optional peers. | S |
| `commander` | 11.1.0 → 15.0.0 | ESM-only, which affects these CommonJS CLIs; Node ≥22.12 is within the floor; 5 CLI packages, 7 source files. | S–M |
| `clipboardy` | 3.0.0 → 5.3.2 | ESM-only since 4; 1 source file. | S |
| `@testing-library/jest-dom` | 6.9.1 → 7.0.1 | Node ≥22 (within the floor) and a required `@testing-library/dom` peer; 4 packages. | S |
| `jest-extended` | 4.0.2 → 7.0.0 | Peers `jest >=27.2.5`, `typescript >=5`; setup-file usage only (0 source imports). | S |
| `eslint-plugin-react-hooks` | 5.2.0 → 7.1.1 | New rules in its recommended set will produce lint findings in the 4 React packages. | M |
| `eslint-plugin-n` | 17.24.0 → 18.5.0 | ESM-only; Node `^20.19 || ^22.13 || >=24`. | S |
| `json-edit-react` | 1.30.2 → 2.0.5 | Major of a UI component used in `ts-res-ui-components` (1 source file); props API not assessed. | S–M |
| `cspell` | 8.19.4 → 10.4.0 | ESM-only; Node ≥22.18 is within the floor; one package's spell-check script. | S |
| transitive `glob` / `minimatch` | 10/13, 9/10 → 14, 11 | See § 2a; arrive when jest / typescript-eslint / api-extractor move. | — |

## 5. Rush and pnpm advisories

The bulk advisory endpoint (`POST https://registry.npmjs.org/-/npm/v1/security/advisories/bulk`)
returned no advisories for `pnpm` 11.12.0 / 11.28.9 or `@microsoft/rush` 5.177.2 / 5.182.1
(queried 2026-11-08).

## 6. Source changes forced by a bump

- **`etc/ts-extras-webauthn.api.md`, `etc/ts-web-extras-webauthn.api.md`** — regenerated by
  api-extractor under `@simplewebauthn/*` 13.3: the re-exported `AuthenticationResponseJSON` and
  `RegistrationResponseJSON` are now rendered through `_2` import aliases. Exported names and
  types are unchanged; no `.ts` file changed.
- **`@fgv/ts-extras-mcp`: one test control, two TSDoc passages, one README line** (`67171b4a`).
  `@modelcontextprotocol/sdk` 1.32, taken for its six advisories, adds a
  `StreamableHTTPClientTransport` `redirectPolicy` that defaults to `'same-origin'`: the SDK now
  asks `fetch` for `redirect: 'manual'` and follows a hop only when it keeps the method and the
  origin. In `egress.test.ts`, the test *"a 307 from the MCP origin to another origin is refused,
  and the static header never reaches it"* opened with a control asserting the old behaviour
  (*"without static headers the platform follows the redirect"*,
  `expect(other.seen.length).toBeGreaterThan(0)`). It went red in the first repo-wide `rush test`
  (`scratchpad/deps/test.log`), which also took branch coverage to 99.86 %. The control now
  asserts that the MCP origin was reached and the other origin was not. The static-header half of
  the test is unchanged.
  The `IMcpHttpTransportParams.fetch` and `createHttpTransport` TSDoc and the README said the
  default `globalThis.fetch` path follows redirects; they now name the SDK's same-origin default.
  The package's own `redirect: 'error'` for requests that carry static headers (`egress.ts`) still
  overrides the SDK's `'manual'`, so its protection is unchanged; it is now a second layer behind
  the SDK's. This is CODING_STANDARDS' "widened behaviour, no signature moved" class: `rush rebuild`
  was clean and only the suite saw it. The change file tells consumers.
  Prettier 2.8 still flags formatting at lines 182–234 of `egress.test.ts`, which this change did not
  touch and which fail the same check on the base. The edited lines conform, and the file was not
  reformatted.
- **Round 1: the package's own guard is pinned again** (`819e64d1`). With SDK 1.32 refusing the
  cross-origin hop itself, the test above passes whether or not `egress.ts:476`
  (`redirect: 'error'` for requests that carry static headers) exists. A new test, *"a same-origin
  307 is refused for a request carrying static headers, though the SDK would follow it"*, has the
  MCP server answer `/mcp` with a 307 to `/mcp-elsewhere` on the same origin. It asserts that the
  connect fails and that only `/mcp` is ever requested. **Watched red:** with line 476 changed to
  `{ ...init, headers }`, `rushx test` failed exactly that test (`egress.test.js`, 19 passed, 1
  failed; `scratchpad/deps/p21-red.log`), and the cross-origin test still passed. With the line
  restored, all 20 passed (`p21-green1.log`). The cross-origin case is kept.
  The same round corrected two sentences that still said a consumer `fetch` owns its redirect
  handling: `IMcpHttpTransportParams.headers` TSDoc and the `egress.ts` comment. They now say that
  the SDK calls any fetch with `redirect: 'manual'` and follows same-origin hops for a fetch that
  honours it. The `.fetch` paragraph gained the same qualifier.
- **Round 1: `crypto-browserify` removed** from `tools/ts-res-browser` (a `dependencies` entry in a
  published tool) and `tools/ts-res-ui-playground` (`00c2dcba`). It is unused: both
  `webpack.config.js` files set `resolve.fallback.crypto: false`, and a grep of `src`, configs and
  manifests finds no import. This closed `elliptic` (§ 2a).
- **Round 1: `@types/node` ^20.19.43 → ^22.20.5** (the latest 22.x older than the cutoff), because
  22.22 is the oldest runtime `rush.json` supports. The build, lint and test are green on it.
- **Noted, pre-existing, not changed:** `@fgv/ts-http-storage` exposes `Hono` in its public API
  (`createStorageRoutes(...): Hono`, `etc/ts-http-storage.api.md`) while depending on `hono`
  directly rather than as a peer. A consumer holding a different `hono` copy gets a type-identity
  mismatch. The `~4.7 → ~4.13` move makes that more likely, for consumers who pin hono themselves.
- **No other TypeScript, test or lint-config source changed.** The Heft-family bump would have
  forced config changes in up to 36 `eslint.config.js` files plus a repo-wide private-member migration;
  it was held instead (4c).
- Mechanical, not a source change: Rush refreshed `common/scripts/install-run*.js` for 5.182.1,
  and `rush add` dropped one empty `"dependencies": {}` block from
  `libraries/ts-agent-memory-sqlite-vec/package.json`.

## 7. Release-age policy

- No `minimumReleaseAge*` setting exists in `pnpm-config.json`, so pnpm 11's default (1440
  minutes) applies; nothing was excluded.
- Every version chosen by hand was published before 2026-11-06T00:00Z.
- All 316 `name@version` entries new to the final lockfile against `origin/integration/asks` were
  checked against registry publish times (full packuments, not the abbreviated form, whose
  `modified` stamp is not a publish time) at 2026-11-08 ~19:10Z: the youngest is
  `watchpack@2.6.4` (2026-11-07T14:53Z, ~28 h), then `hono@4.13.17` (2026-11-07T04:56Z, ~38 h).
  None is under 24 h, and ages only grow before CI runs. That pnpm resolved nothing younger
  matches its 1440-minute default being honoured at resolution as well.
- **Round 1 re-check.** The Rush lockfile after round 1 has 315 entries new against the base, and
  the youngest is still `watchpack@2.6.4`. The root `package-lock.json` was resolved with
  `--before=2026-11-06T00:00:00Z`. Of its 54 changed entries, the youngest is
  `@azure/msal-browser@5.28.0` (2026-11-05T03:34Z). The autoinstaller bumps date from 2026-08-08 to
  2026-09-14. A clean install of the round-1 lockfile is `install-clean-r2.log`: exit 0, no
  rejection.
- **`rush install` from an empty `common/temp`** (`rm -rf common/temp`) accepted the final
  lockfile: exit 0, no `ERR_PNPM`, no rejection (`scratchpad/deps/install-clean-final.log`; an
  earlier clean install before the Heft hold is `install-clean.log`).

## 8. Change files

35 files, `common/changes/@fgv/<pkg>/deps-refresh_2026-11-08-18-00.json`: **22 `patch`** where a
runtime or peer dependency range changed (security fixes named in `ts-extras`,
`ts-http-storage`, `ts-extras-mcp`, `ts-extras-transformers`, `ts-web-extras-transformers`), **13
`none`** where only dev dependencies changed. Private projects (`sudoku-app`, `testbed`,
`ts-res-ui-playground`) take none. `rush change --verify --target-branch origin/integration/asks`
passes.

## 9. Gates

Logs are under `/tmp/claude-0/-home-user/ddedaf44-7531-52e1-a2c4-05cab5230430/scratchpad/deps/`.
Each log was graded with `grep -acE 'not met|Operations failed|error TS|Jest tests? failed|FAILURE|ERR_PNPM'`
(must be 0), `grep -aciE warning` (only the tracked-symlink notice allowed), and the absence of
`SUCCESS WITH WARNINGS`.

**Round 1 (final tree):**

| gate | log | result |
|---|---|---|
| `rush install` from empty `common/temp` | `install-clean-r2.log` | exit 0, 0 rejections |
| `rush rebuild` | `rebuild-r2.log` | 39/39; 0 error patterns; symlink notice only; no SUCCESS WITH WARNINGS |
| `rush lint` | `lint-r2.log` | 34/34; 0; symlink notice only; none |
| `rush test` | `test-r2.log` | 38/38; 0; symlink notice only; none; no flake retries |
| CI autoinstaller checks (bundler, ESM entry, tarball exports) | `ci-checks.log` | 0 failed in each |
| `rush change --verify`, prettier 2.8.8, `verify-capability-docs`, `generate-capability-feed --check` | — | pass (re-run on the final tree) |

**At `72a83930` (before round 1):**

| gate | log | result |
|---|---|---|
| `rush install` from empty `common/temp` | `install-clean-final.log` | exit 0, 0 rejections |
| `rush rebuild` | `rebuild-final.log` | 39/39 SUCCESS; 0 error patterns; 1 warning line (tracked symlink); no SUCCESS WITH WARNINGS |
| `rush lint` | `lint-final.log` | 34/34 SUCCESS; 0; symlink notice only; none |
| `rush test` | `test-2.log` | 38/38 SUCCESS; 0; symlink notice only; none. No flake retries were needed |
| `rush change --verify --target-branch origin/integration/asks` | — | passes (35 change files) |
| prettier 2.8.8 `--check` over every changed file except the lockfile, generated `api.md`, `repo-state.json` and Rush's `common/scripts` | — | passes, except the pre-existing lines in `egress.test.ts` noted in § 6 |
| `verify-capability-docs.mjs` | — | 0 failed |
| `generate-capability-feed.mjs --check` | — | 0 stale |

**Earlier, failed runs, kept for the record:** `rebuild.log`, failed on the Heft family (§ 4c), and
`test.log`, failed on the MCP SDK redirect default (§ 6). Neither failure was a flake. Each appeared
only after a bump and was traced to it.

## 10. Things I was unsure about

- **Holding the Heft family** keeps the toolchain at 2026-09-14 pins, for a reason that is a design
  call (`#private` migration or rule disposition) rather than a bug. Taking it forward is probably
  its own stream.
- **The `sockjs>uuid` override** clears an advisory that is not on sockjs's code path (it calls
  only `v4()`). I took it because a scoped override is cheap and keeps the audit clean, and it goes
  away if `webpack-dev-server` 6 (no sockjs) is ever adopted. It could equally be dropped and
  recorded as not reachable.
- **`re2js` 2.9.1** was held only because its dialect review could not be done here. It is an
  in-major bump the brief would otherwise take.
- **Version cutoff:** I used "at least two days old" rather than the 24 h policy, to leave margin.
  This skipped a few newer patches, for example `hono` 4.13.17 as a declared floor. The lockfile
  still resolved 4.13.17 within `~4.13.16`, because pnpm's own age gate allowed it.
- The `ts-extras-mcp` change edits a security-relevant test and its TSDoc. It is small, but it is
  the one change here that touches what a package says about its behaviour, so it deserves the
  reviewer's eye.
