# docs-regen-5-1-0 — result

**Shipped:** the committed generated API docs are regenerated for 5.1.0 — six of the twelve
`build-docs` packages changed, and the root `docs/api` was reproduced with the repo's own typedoc
0.28.20 and now covers all 26 packages under `libraries/`.

## 1. Per-package docs (`rush build-docs`)

Run after `rush install` and a full `rush rebuild` (clean: 0 errors, only the standing
"1 Git-tracked symlink" notice). The first `rush build-docs` run generated every project but **exited 1**:
`SUCCESS WITH WARNINGS: 4 operations` (12 distinct TSDoc warnings in `ts-utils`, `ts-json-base`,
`ts-extras`, `ts-web-extras`; the command sets `allowWarningsInSuccessfulBuild: false`). Those were
then fixed under an approved scope extension (§ 5), after which `rush build-docs` exits 0 with no
warnings. The counts below are from the first run; § 5 lists the few pages the fixes changed.

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
project with both in its `node_modules` works.) Result: **0 errors, 208 warnings** (196 after the § 5 fixes) (unresolved
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

`none` with an **empty comment** (Rush writes no CHANGELOG entry for an empty comment, so the 5.1.0
changelogs carry no docs noise; the orchestrator emptied the original "Regenerated API documentation."
text after merging the curated set), named `docs-regen-5-1-0_2026-11-14-00-00.json`,
for the six packages whose `docs/` changed: `ts-extras`, `ts-http-storage`, `ts-json-base`,
`ts-random`, `ts-utils`, `ts-web-extras`. `docs/api` is not inside a package. `rush change --verify
--target-branch origin/integration/asks` → exit 0. Commit `7fb73e1b7`.

## 5. TSDoc fixes (scope extension, approved by the orchestrator)

Comment-only; no behaviour change. Commit `3dc149a59`, API reports `9cbf84295`, regenerated docs
`abb31ebd1`.

- **`ts-utils`** `result.ts`: the back-compatible overloads `DetailedSuccess.thenOnFailure` and
  `DetailedFailure.thenOnSuccess` name their parameter `__cb`; the docs said `@param cb`. Now
  `@param __cb`.
- **`ts-json-base`** `converters.ts`: the zero-argument `stringifiedJson()` overload documented an
  `inner` parameter it does not have. Its comment now describes the no-inner form.
- **`ts-extras`** `streamingAdapters/common.ts`: `IProviderCompletionStreamParams` had two
  `@remarks` blocks; merged into one (typedoc also reported this site as a duplicate `@returns`,
  which cleared with it). `safer-fetch/failureReason.ts`: the `'redirect-rejected'` union member's
  comment carried a `@remarks` block tag, which typedoc forbids on union members; the paragraph is
  kept as plain text.
- **`ts-web-extras` (six warnings), fixed in `ts-json-base`:** `FileSystemAccessTreeAccessors`,
  `HttpTreeAccessors` and `LocalStorageTreeAccessors` inherit `getFileBytes` and
  `getAtomicWriteCapabilities` from `InMemoryTreeAccessors`, whose comments were
  `{@inheritDoc FileTree.IBinaryFileTreeAccessors.getFileBytes}` /
  `{@inheritDoc FileTree.IAtomicFileTreeAccessors.getAtomicWriteCapabilities}`. **No spelling of
  that reference can resolve in `ts-web-extras`'s own typedoc build:** the target interfaces live
  in another package and are not part of that project, and the generated pages showed the raw
  reference text as the description. API Extractor could not resolve them in `ts-json-base` either
  — `ts-json-base.api.md` carried `ae-unresolved-inheritdoc-reference` and `(undocumented)` on both.
  So the fix writes the interface's text into the two `InMemoryTreeAccessors` comments, as the
  class's other methods already do. The doc is kept, not deleted, and it now renders in all four
  classes. `ts-json-base.api.md` loses both unresolved-inheritdoc warnings and gains one
  `ae-unresolved-link` on `getAtomicWriteCapabilities` (for `{@link FileTree.IAtomicWriteCapabilities}`,
  the same namespace-member link class as its neighbour `fileIsMutable`).
- `etc/ts-extras.api.md` and `etc/ts-json-base.api.md` regenerated (comment text only).
- Doc deltas: per-package `ts-json-base` (2 pages), `ts-web-extras` (3); root `docs/api` 8 pages.
  `ts-utils` and `ts-extras` per-package docs did not change.

Packages touched by the fixes (`ts-utils`, `ts-json-base`, `ts-extras`) already have this stream's
`none` change file; no new one was needed.

## Gates

Final, after § 5, all run in the foreground from the repo root:

- `install` ✅
- `change --verify --target-branch origin/integration/asks` ✅ exit 0
- `rebuild` ✅ exit 0 — fail-grep 0; the only "warning" line is the tracked-symlink notice
  (an intermediate rebuild flagged the API-report updates as warnings; the reports were committed
  and the next rebuild was clean)
- `lint` ✅ exit 0, `SUCCESS: 32 operations`
- `test` ✅ exit 0, `SUCCESS: 35 operations` + 1 no-op — fail-grep 0, symlink notice only, no NUL
  padding in the log
- `build-docs` ✅ exit 0, `SUCCESS: 13 operations`, no warnings

## Follow-ups

1. **Packages with no `build-docs` script** (not added, per the brief): `ts-agent-memory`,
   `ts-agent-memory-sqlite-vec`, `ts-agent-tasks`, `ts-app-shell`, `ts-extras-argon2`,
   `ts-extras-mcp`, `ts-extras-ollama`, `ts-extras-re2`, `ts-extras-system-one`,
   `ts-extras-transformers`, `ts-extras-webauthn`, `ts-prompt-assist`, `ts-web-extras-argon2`,
   `ts-web-extras-transformers`, `ts-web-extras-webauthn`; under `tools/`: `ks`, `repo-template`,
   `ts-res-browser`, `ts-res-browser-cli`, `ts-res-tutorial`, `ts-res-ui-playground` (private).
   The root `docs/api` is now the only generated reference for the first fifteen.
2. **Root `docs/api` has no script** — reproducing it means knowing the command above. A root
   script (or a `build-docs` step) would make it a maintained artifact rather than a snapshot; 196
   link warnings would surface if it were gated.
3. The rig's `typedoc.base.json` `externalSymbolLinkMappings` still names `@fgv/ts-chocolate` (not
   in this repo) and points every mapping at `tree/main`; harmless, worth a look when (3) is done.
