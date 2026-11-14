# docs-regen-5-1-0 — result

**Shipped:** the committed generated API docs are regenerated for 5.1.0 — six of the twelve
`build-docs` packages changed, and the root `docs/api` was reproduced with the repo's own typedoc
0.28.20 and now covers all 26 packages under `libraries/`.

## 1. Per-package docs (`rush build-docs`)

Run after `rush install` and a full `rush rebuild` (clean: 0 errors, only the standing
"1 Git-tracked symlink" notice). `rush build-docs` generated every project but **exited 1**:
`SUCCESS WITH WARNINGS: 4 operations` (12 distinct TSDoc warnings in `ts-utils`, `ts-json-base`,
`ts-extras`, `ts-web-extras`; the command sets `allowWarningsInSuccessfulBuild: false`). The output
was complete and is committed; the warnings are a follow-up below, not fixed here (no source
changes in scope).

Tracked files under each package's `docs/`, before → after (A/M/D without rename detection):

| package | before | after | added | modified | deleted |
|---|---:|---:|---:|---:|---:|
| `ts-bcp47` | 1607 | 1607 | 0 | 0 | 0 |
| `ts-extras` | 2094 | 2940 | 932 | 255 | 86 |
| `ts-http-storage` | 66 | 72 | 6 | 7 | 0 |
| `ts-json-base` | 542 | 866 | 324 | 55 | 0 |
| `ts-json` | 266 | 266 | 0 | 0 | 0 |
| `ts-random` | 229 | 239 | 10 | 3 | 0 |
| `ts-res-ui-components` | 1066 | 1066 | 0 | 0 | 0 |
| `ts-res` | 3911 | 3911 | 0 | 0 | 0 |
| `ts-utils-jest` | 42 | 42 | 0 | 0 | 0 |
| `ts-utils` | 1635 | 1709 | 151 | 24 | 77 |
| `ts-web-extras` | 255 | 280 | 25 | 7 | 0 |
| `tools/ts-res-cli` | 0 | 0 | 0 | 0 | 0 (`build-docs` is an `echo`) |

Commit `b728049a6`.

## 2. Root `docs/api`

**Provenance.** `docs/api` and the root `typedoc.json` were both *added* by #652 (`0765a2068`,
2026-08-21), and #652's message does not mention them; the only later touch is the sudoku removal
(`5a27cbf12`). No script, CI job or doc produces it. That snapshot held 12 packages while
`libraries/` then had 25 entries.

**Reproduced** from the repo root with the workspace-installed typedoc — no new dependency or script:

```bash
libraries/ts-extras/node_modules/.bin/typedoc --options ./typedoc.json
```

(`typedoc@0.28.20`, `typedoc-plugin-markdown@4.14.1` via the rig's `typedoc.base.json`; any
project with both in its `node_modules` works.) Result: **0 errors, 208 warnings** (unresolved
`{@link}` targets, mostly overload-selector and cross-package links). Two runs (a scratch output dir,
then `docs/api` in place) were byte-identical.

Files under `docs/api`: **2978 → 4758** (1784 added, 1049 modified, 4 deleted). Per package
(before → after): new — `ts-agent-memory` 205, `ts-agent-memory-sqlite-vec` 10, `ts-agent-tasks`
456, `ts-extras-argon2` 134, `ts-extras-mcp` 43, `ts-extras-ollama` 22, `ts-extras-re2` 5,
`ts-extras-system-one` 45, `ts-extras-transformers` 15, `ts-extras-webauthn` 16, `ts-prompt-assist`
151, `ts-web-extras-argon2` 134, `ts-web-extras-transformers` 15, `ts-web-extras-webauthn` 9;
existing — `ts-app-shell` 162→170, `ts-bcp47` 227→227, `ts-extras` 161→471, `ts-http-storage`
26→30, `ts-json` 66→66, `ts-json-base` 114→225, `ts-random` 43→45, `ts-res` 585→601,
`ts-res-ui-components` 185→185, `ts-utils` 271→325, `ts-utils-jest` 6→6, `ts-web-extras` 58→69;
top level (`README.md`, `_media/`) 1074→1078.

Pages of packages whose source did not change still differ: the current markdown plugin emits
`property-`-prefixed anchor ids and slightly different modifier columns (e.g. `protected readonly`).
That is the pinned tool's output, not drift. The 4 deletions are pages for symbols no longer
exported (`ts-app-shell` `IMessageAction`, `ts-extras` `IKeyDerivationParams`,
`IKeyStoreSecretEntry`, `IKeyStoreSecretEntryJson`).

Commit `10cb6dc00`. No `docs/FUTURE.md` entry was needed (that was the not-reproducible branch).

## 3. Sanity checks

- `grep -rlE "/home/|/tmp/|/root/" docs/api libraries/*/docs tools/*/docs` → no hits.
- `grep -rli sudoku` over the same → no hits.

## 4. Change files

`none`, comment "Regenerated API documentation.", named `docs-regen-5-1-0_2026-11-14-00-00.json`,
for the six packages whose `docs/` changed: `ts-extras`, `ts-http-storage`, `ts-json-base`,
`ts-random`, `ts-utils`, `ts-web-extras`. `docs/api` is not inside a package. `rush change --verify
--target-branch origin/integration/asks` → exit 0. Commit `7fb73e1b7`.

## Gates

`rush install` ✅ · `rush rebuild` ✅ (0 errors; only the symlink notice matches "warning") ·
`rush change --verify --target-branch origin/integration/asks` ✅ · `rush build-docs` ⚠ exit 1 on
TSDoc warnings (output complete). No `test`/`lint` — no source changed.

## Follow-ups

1. **`rush build-docs` is red** on 12 distinct TSDoc warnings (the command disallows warnings):
   unused `@param cb` on `DetailedSuccess.thenOnFailure` / `DetailedFailure.thenOnSuccess`
   (`ts-utils`); unused `@param inner` on `Converters.stringifiedJson` (`ts-json-base`); duplicate
   `@remarks`/`@returns` at `ai-assist/streamingAdapters/common.ts:73` and a block tag in the
   `SaferFetch` comment at `safer-fetch/failureReason.ts:83` (`ts-extras`); six `{@inheritDoc}`
   targets on `FileTree.IBinaryFileTreeAccessors.getFileBytes` / `IAtomicFileTreeAccessors.getAtomicWriteCapabilities`
   that typedoc cannot find (`ts-web-extras`). Small source fixes; out of scope here.
2. **Packages with no `build-docs` script** (not added, per the brief): `ts-agent-memory`,
   `ts-agent-memory-sqlite-vec`, `ts-agent-tasks`, `ts-app-shell`, `ts-extras-argon2`,
   `ts-extras-mcp`, `ts-extras-ollama`, `ts-extras-re2`, `ts-extras-system-one`,
   `ts-extras-transformers`, `ts-extras-webauthn`, `ts-prompt-assist`, `ts-web-extras-argon2`,
   `ts-web-extras-transformers`, `ts-web-extras-webauthn`; under `tools/`: `ks`, `repo-template`,
   `ts-res-browser`, `ts-res-browser-cli`, `ts-res-tutorial`, `ts-res-ui-playground` (private).
   The root `docs/api` is now the only generated reference for the first fifteen.
3. **Root `docs/api` has no script** — reproducing it means knowing the command above. A root
   script (or a `build-docs` step) would make it a maintained artifact rather than a snapshot; 208
   link warnings would surface if it were gated.
4. The rig's `typedoc.base.json` `externalSymbolLinkMappings` still names `@fgv/ts-chocolate` (not
   in this repo) and points every mapping at `tree/main`; harmless, worth a look when (3) is done.
