# publish-hygiene-5-1-0 — result

Release prep for 5.1.0, from a consumer's validation of `5.1.0-63` from the registry. Five items,
plus the `@fgv/ks` scope addition. Gate results are at the end.

## 1. Documented subpaths that do not resolve

Every `@fgv/<pkg>/<subpath>` in a package `README.md` / `CAPABILITIES.md` and in
`.ai/instructions/LIBRARY_CAPABILITIES.md` was checked against that package's `exports`. No new
subpath exports were added; each broken reference was rewritten to the form that resolves, checked
against the package's `src/index.ts`.

| package doc | was | now |
|---|---|---|
| `ts-extras/CAPABILITIES.md` (14) | `@fgv/ts-extras/crypto-utils` | the `CryptoUtils` namespace of `@fgv/ts-extras` |
| `ts-extras/CAPABILITIES.md` (10) | `@fgv/ts-extras/ai-assist` | `AiAssist.…` from `@fgv/ts-extras` |
| `ts-extras/CAPABILITIES.md` (1) | `RangeOf<T>` from `@fgv/ts-extras/experimental` | `Experimental.RangeOf<T>` from `@fgv/ts-extras` |
| `ts-utils/CAPABILITIES.md` | `/base` (6), `/conversion`, `/validation`, `/collections` (2) | `@fgv/ts-utils` (all are root exports) |
| `ts-utils/CAPABILITIES.md` | `ts-utils/hash`, `ts-extras/hash`, `ts-web-extras/crypto-utils` | `Hash.Crc32Normalizer` (`@fgv/ts-utils`), `Hash.Md5Normalizer` (`@fgv/ts-extras`, or its `/hash` subpath). `Md5Normalizer` is not in `ts-web-extras` at all. |
| `ts-json-base/CAPABILITIES.md` | `/file-tree` (3), `/json-file`, `/converters`; `ts-extras/zip-file-tree`, `ts-web-extras/file-tree` | `FileTree` namespace, `JsonFile.JsonFsHelper`, `Converters` from `@fgv/ts-json-base`; `ZipFileTree` from `@fgv/ts-extras`; `@fgv/ts-web-extras` root |
| `ts-json/CAPABILITIES.md` | `/converters`, `/editor`, `/diff` | `JsonConverter`, `JsonEditor`, `Diff.detailedDiff` / `Diff.threeWayDiff` from `@fgv/ts-json` |
| `ts-json/README.md:391` (runnable sample) | `import * as JsonConverters from '@fgv/ts-json/converters'` | `import { Converters as JsonConverters } from '@fgv/ts-json'` (`JsonConverters.json` is the same object) |
| `ts-agent-memory-sqlite-vec/README.md:198` | `@fgv/ts-extras/ai-assist` | `AiAssist.callProviderEmbedding` from `@fgv/ts-extras` |
| `ts-extras-ollama/README.md` (2), `CAPABILITIES.md` (2) | `@fgv/ts-extras/ai-assist` | `AiAssist` from/in `@fgv/ts-extras` |
| `ts-extras-transformers/CAPABILITIES.md` (2) | `@fgv/ts-extras/ai-assist` | `AiAssist` / `@fgv/ts-extras` |
| `.ai/instructions/LIBRARY_CAPABILITIES.md:117` | "affecting `@fgv/ts-extras/ai-assist`" | "affecting ts-extras `AiAssist`" |
| `ts-extras/src/packlets/ai-assist/README.md` (source-only, not shipped) | link text "`@fgv/ts-extras/ai-assist` entry" | "`ts-extras` `AiAssist` entry" |

Sweep after the edits (`grep -noE "[\`'\"(*](@fgv/)?ts-[a-z0-9-]+/[a-z]…"` over the 54 package
README/CAPABILITIES files plus the router): the only remaining subpath references are
`@fgv/ts-extras/safer-fetch` (6), `@fgv/ts-extras/crypto` (1), `@fgv/ts-extras/hash` (1),
`@fgv/ts-app-shell/theme.css` (2) and `@fgv/ts-app-shell/tailwind-preset` (1) — all real exports
(`allowAnyAddress` and the other names imported from `safer-fetch` are exported by both its node and
browser entry points). Historical `.ai/tasks/completed/**/README.md` records name packlets, not
imports, and were left alone, as were the generated `docs/` trees.

## 2. `exports` condition order and `./` prefixes

`types` now comes first in every condition object that has one, and every target has a leading
`./`. Targets are unchanged. 22 manifests changed (more than the consumer's 15, which counted
packages whose types were last; every one that was not first is now first):
`ts-extras`, `ts-web-extras`, `ts-json`, `ts-json-base`, `ts-res`, `ts-res-ui-components`,
`ts-http-storage`, `ts-app-shell`, `ts-agent-memory`, `ts-agent-memory-sqlite-vec`,
`ts-agent-tasks`, `ts-prompt-assist`, `ts-extras-argon2`, `ts-extras-re2`,
`ts-web-extras-argon2`, `ts-extras-webauthn`, `ts-web-extras-webauthn`,
`ts-extras-transformers`, `ts-web-extras-transformers`, `ts-extras-mcp`, `ts-extras-ollama`,
`ts-extras-system-one`. `ts-utils`, `ts-utils-jest`, `ts-random` and `ts-bcp47` already had
`types` first. `ts-extras`'s subpaths (`/crypto`, `/crypto/keystore`, `/safer-fetch`, `/hash`)
have no `types` condition, and none was added (targets unchanged, per the brief); TypeScript finds
the sibling `.d.ts`.

### Resolution proof

Packed every package (`pnpm pack`, the same binary and flow as the publish workflow), installed
`ts-utils`, `ts-json-base`, `ts-json`, `ts-extras`, `ts-web-extras`, `ts-app-shell` (and later
`ks`) from the tarballs into a scratch consumer with TypeScript 5.9.3, and compiled a consumer
importing `succeed`/`Converters` (ts-utils), `AiAssist`/`CryptoUtils`/`Experimental`
(ts-extras root), `KeyStore`/`HpkeProvider` (`@fgv/ts-extras/crypto`), `JsonEditor`/`Converters`/
`Diff` (ts-json), `FileTree`/`JsonFile` (ts-json-base), `CryptoUtils` (ts-web-extras) and `TabBar`
(ts-app-shell), with `skipLibCheck: false`.

```
npx tsc -p tsconfig.bundler.json   # module esnext, moduleResolution bundler  -> exit 0
npx tsc -p tsconfig.node16.json    # module node16, moduleResolution node16   -> exit 0
npx tsc -p tsconfig.<mode>.json --traceResolution | grep "successfully resolved"
  @fgv/ts-utils          -> @fgv/ts-utils/dist/ts-utils.d.ts
  @fgv/ts-extras         -> @fgv/ts-extras/dist/ts-extras.d.ts
  @fgv/ts-extras/crypto  -> @fgv/ts-extras/lib/packlets/crypto-utils/index.d.ts          (node16)
                            @fgv/ts-extras/lib/packlets/crypto-utils/index.browser.d.ts  (bundler)
  @fgv/ts-json           -> @fgv/ts-json/dist/ts-json.d.ts
  @fgv/ts-json-base      -> @fgv/ts-json-base/dist/ts-json-base.d.ts
  @fgv/ts-web-extras     -> @fgv/ts-web-extras/dist/ts-web-extras.d.ts
  @fgv/ts-app-shell      -> @fgv/ts-app-shell/lib/index.d.ts   (its declared types target)
```

Every package resolves to its declared `types` target and the consumer compiles in both modes. No
package broke on the rollup, so nothing was left in its old order.

**A correction to the premise, for the record.** The same consumer compiled against the
**before** tarballs resolves to exactly the same files — with TypeScript 5.9.3 (bundler, node16,
and bundler with `customConditions: ["node"]`) and with 5.0.4 and 5.4.5 (node16). The trace shows
why: TypeScript runs a first pass that prefers declaration files and takes the `types` condition
wherever it sits in the object. So the old order did not, in these TypeScript versions, make types
resolve from `lib/*.d.ts`. The reorder is still right — Node documents that `types` must come
first, and order-strict resolvers and linters (`publint`, `arethetypeswrong`) treat a later `types`
as a defect — but it is spec conformance, not a fix for a reproduced mis-resolution. The consumer
may have seen it with other tooling; that was not reproduced here.

Repo gates over the new manifests: `verify-tarball-exports.mjs` — 26 packages, 204 manifest paths,
0 failed; `verify-esm-entrypoints.mjs` — 25 checked, 0 failed; `verify-bundler-resolution.mjs` —
20 checked, 6 declared node-only, 0 failed.

## 3. Shipped files

Every published package now has a `files` allowlist, and the 16 `.npmignore` files it supersedes
were deleted (with `files` set, a root `.npmignore` only confuses the reader about which rule
wins). The allowlist is the package's built output plus `CHANGELOG.json`, `CHANGELOG.md`,
`README.md`, `CAPABILITIES.md`, `LICENSE`, with `!lib/test`, `!dist/test`, `!**/*.test.*`.
Per-package additions, each checked against what the manifest or runtime reads:

- `ts-bcp47`: keeps the four `!lib/data/iana/*` exclusions its `.npmignore` carried (the package
  uses the embedded compressed data).
- `ts-res-ui-components`: `lib` only — its `.npmignore` excluded `dist/`, and nothing in the
  manifest names `dist`.
- `ts-app-shell`: adds `tailwind-preset.cjs` (an `exports` target); `theme.css` is under `lib/`.
- `ts-res-cli`, `ts-res-browser-cli`: `bin` + `lib`.
- `repo-template`: `bin`, `lib`, `templates`, `sync-manifest.json` (read at runtime via
  `__dirname`).
- `ts-res-browser`: its existing list, normalised (`dist`, `lib`), plus the changelogs and `LICENSE`.
- `heft-dual-rig`: `profiles` (the rig) and the metadata files.
- `typedoc-compact-theme`: `lib` and the metadata files.
- The 14 libraries that already had a `files` list, and `ks`, gained `CHANGELOG.md`.

**`lib/` and `dist/` content is byte-for-byte the same file list before and after** in every
package — the only differences are at the top level. That matters for `ts-res`: its old
`.npmignore` had to anchor `/config/` because an unanchored `config/` dropped the config packlet
under pnpm 11; an allowlist cannot have that failure.

**Sources and sourcemaps.** No package shipped `src/` before (all `.npmignore`s excluded it), so
nothing was taken away from consumers who debug through maps. The maps embed `sourcesContent`
(checked in `ts-extras` and `ts-utils`), so they are usable without `src/`. The one package that
did ship `src/` was `typedoc-compact-theme`, which had no allowlist at all.

What left the tarballs: `perf/*.js` (ts-extras — live-provider probes), `scripts/*.js` (ts-bcp47 —
the IANA data maintenance scripts, used only by the repo's own `update-iana-data` npm script),
`test/data/*.json` (ts-utils-jest, ts-res-cli), `eslint.config.js` (15 packages),
`.rush/temp/**` and `rush-logs/*.log` (heft-dual-rig, typedoc-compact-theme), and `src/` +
`tsconfig.json` (typedoc-compact-theme). What arrived: `CHANGELOG.md` where one exists in the tree,
and `CHANGELOG.json` for `ts-res-browser`.

### File counts (`pnpm pack` + `tar -tzf`, before → after)

| package | before | after |
|---|---|---|
| `@fgv/heft-dual-rig` | 16 | 9 |
| `@fgv/ks` | 36 | 36 |
| `@fgv/repo-template` | 60 | 59 |
| `@fgv/ts-agent-memory` | 378 | 378 |
| `@fgv/ts-agent-memory-sqlite-vec` | 54 | 54 |
| `@fgv/ts-agent-tasks` | 798 | 798 |
| `@fgv/ts-app-shell` | 374 | 373 |
| `@fgv/ts-bcp47` | 597 | 594 |
| `@fgv/ts-extras` | 671 | 668 |
| `@fgv/ts-extras-argon2` | 23 | 23 |
| `@fgv/ts-extras-mcp` | 85 | 85 |
| `@fgv/ts-extras-ollama` | 13 | 13 |
| `@fgv/ts-extras-re2` | 31 | 31 |
| `@fgv/ts-extras-system-one` | 55 | 55 |
| `@fgv/ts-extras-transformers` | 13 | 13 |
| `@fgv/ts-extras-webauthn` | 12 | 12 |
| `@fgv/ts-http-storage` | 38 | 37 |
| `@fgv/ts-json` | 152 | 152 |
| `@fgv/ts-json-base` | 290 | 290 |
| `@fgv/ts-prompt-assist` | 324 | 324 |
| `@fgv/ts-random` | 100 | 99 |
| `@fgv/ts-res` | 885 | 884 |
| `@fgv/ts-res-browser` | 8 | 10 |
| `@fgv/ts-res-browser-cli` | 26 | 26 |
| `@fgv/ts-res-cli` | 28 | 26 |
| `@fgv/ts-res-ui-components` | 359 | 359 |
| `@fgv/ts-utils` | 434 | 434 |
| `@fgv/ts-utils-jest` | 219 | 218 |
| `@fgv/ts-web-extras` | 122 | 122 |
| `@fgv/ts-web-extras-argon2` | 23 | 23 |
| `@fgv/ts-web-extras-transformers` | 13 | 13 |
| `@fgv/ts-web-extras-webauthn` | 12 | 12 |
| `@fgv/typedoc-compact-theme` | 14 | 5 |

Counts are from the working tree, where many newer packages have no `CHANGELOG.md` yet (the
publish workflow writes it). See item 4 for the proof that it ships.

## 4. `CHANGELOG.md` in every tarball

Cause: every `.npmignore` carried `*.md` with `!README.md` / `!CAPABILITIES.md` / `!LICENSE.md`
re-includes and no `!CHANGELOG.md` (only `ts-res`'s had one), and the existing `files` lists named
`CHANGELOG.json` but not `CHANGELOG.md`. Both are fixed by item 3.

Proof: a placeholder `CHANGELOG.md` and `CHANGELOG.json` were written into every published package
directory that lacked one (34 files, the state the publish workflow's `rush version` step creates),
every package was packed, and every tarball was checked for both. **33 of 33 contain both.** The
placeholders were then deleted (`git status` clean of untracked files).

## 5. `@fgv/ts-utils` hard-dependency vs peer — tech debt only

Out of scope by decision. Added a P2 entry to `docs/TECH_DEBT.md`. The survey found more
hard-depending packages than the brief listed: besides `ts-agent-memory`, `ts-agent-tasks`,
`ts-prompt-assist`, `ts-random`, `ts-res`, `ts-app-shell`, also `ts-res-ui-components`,
`ts-http-storage` and the tools `ks`, `ts-res-cli`, `ts-res-browser-cli`, `ts-res-browser`. The
entry lists all of them.

## 6. `@fgv/ks` publishes with 5.1.0 (scope addition)

- `rush.json`: `@fgv/ks` now `"shouldPublish": true, "versionPolicyName": "base-utils"`, matching
  `prerelease`. `tools/ks/package.json` stays at `5.1.0`.
- No `exports` map, so nothing to reorder. Its `files` list gained `CHANGELOG.md`; the
  `!lib/test` / `!**/*.test.*` exclusions are kept. Tarball: 36 files — `bin/ks.js`, `lib/**`,
  `README.md`, `LICENSE`, `package.json` (plus the changelogs once written).
- Installed from the tarball into the scratch consumer: `node node_modules/@fgv/ks/bin/ks.js --help`
  prints the command list (exit 0); `npx ks --version` prints `5.1.0`.
- Dependencies: `@fgv/ts-utils-jest` is already a **devDependency**, so nothing moved.
- Change file: one `minor`, "First stable release of the `ks` command-line tool for creating,
  managing and exporting `@fgv/ts-extras` keystore files." `common/changes/@fgv/ks/` did not exist
  before; nothing was deleted.
- Release workflow: `publish-release-impl.yml` derives its package list from
  `rush list --json --version` filtered on `versionPolicyName === "base-utils"` in the guard, the
  version step and the tarball check, and compares the tarball count against that list — there is
  no hard-coded count or name list, so `ks` is included with no workflow change. The guard's npm
  check will see `@fgv/ks` versions up to `5.1.0-63` and no `5.1.0`, which is the normal
  not-yet-published case. `verify-tarball-exports.mjs` walks `tools/`, so it covers `ks` too.

## Change files

33 files named `publish-hygiene-5-1-0_2026-11-17-00-00.json`, one per touched package. All are
`none` with an empty comment except:

- `@fgv/ts-extras` — `patch`: documented import paths corrected (`AiAssist`, `CryptoUtils`,
  `Experimental` namespaces, no API change); no longer ships the `perf/` probe scripts.
- `@fgv/ts-json` — `patch`: documented import paths corrected, no API change.
- `@fgv/typedoc-compact-theme` — `patch`: package now contains only the built theme.
- `@fgv/ks` — `minor`: first stable release.

`ts-bcp47` (`scripts/`), `ts-utils-jest` (test data), `heft-dual-rig` (build logs) and the
`eslint.config.js` removals were judged not consumer-noticeable and are `none`.

## Left alone

- `typedoc-compact-theme` and several packages have no `README.md`/`LICENSE` in the tree
  (theme: neither; `ts-extras-argon2`, `ts-web-extras-argon2`, `ts-extras-webauthn`,
  `ts-web-extras-webauthn`: no README; `ts-http-storage`, `ts-random`: no README). Writing them is
  content work outside a packaging stream; the allowlists name them so they ship when they exist.
- `tools/repo-template`'s working-tree version is `5.1.0-6`; the publish workflow's version step
  sets every lockstep project to the policy version, so it is not a packaging defect.
- `ts-res-browser`'s tarball has no `lib/` because its `build` is webpack-only; unchanged.

## Gates

Run from the repo root on the committed tree (`f2e732526`), foreground, one at a time. Logs graded
by grep, not exit code.

| gate | result | `not met\|Operations failed\|error TS\|Jest tests? failed\|ERR_PNPM` | `-i warning` | NUL check |
|---|---|---|---|---|
| `rush change --verify --target-branch origin/integration/asks` | exit 0, 33 change files found | — | — | — |
| `install-run-rush.js install` | exit 0 | 0 | 0 | 1402/1402 |
| `install-run-rush.js rebuild` | `SUCCESS: 36 operations` | 0 | 1 † | 7710/7710 |
| `install-run-rush.js lint` | `SUCCESS: 32 operations` | 0 | 1 † | 7613/7613 |
| `install-run-rush.js test` (full repo) | `SUCCESS: 35 operations` | 0 | 1 † | 7866/7866 |

† The tracked-symlink notice (`Detected 1 Git-tracked symlinks in the repository`), the only warning
line in each log.

Also run: `verify-tarball-exports.mjs` (26 packages, 204 paths, 0 failed),
`verify-esm-entrypoints.mjs` (25 checked, 0 failed), `verify-bundler-resolution.mjs` (20 checked, 0
failed), `verify-capability-docs.mjs` (router 23,838/24,000 chars, 0 failed),
`generate-capability-feed.mjs --check` (0 stale), `prettier@2.8.8 --check` on every changed file
(clean after formatting `meta.yaml`).

Self-review against `CODE_REVIEW_CHECKLIST.md`: no TypeScript changed; the diff is manifests, docs,
change files and the ledger. Every rewritten import was checked against the package's `src/index.ts`,
and the six packages imported by the scratch consumer compile with `skipLibCheck: false`.
