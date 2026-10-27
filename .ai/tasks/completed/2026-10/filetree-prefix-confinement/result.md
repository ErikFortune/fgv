# Result: `filetree-prefix-confinement`

**Shipped:** `FsFileTreeAccessors` and `FileTree.forFilesystem` take an `absolutePathPolicy` — `'unconfined'` (the default, unchanged), `'confined'` or `'verified'` — and a `realPath` option, applied to every read, listing, stat and write, so a prefixed filesystem tree can finally be a sandbox; asking for either without a prefix fails creation.

Base `integration/asks`. Package: `@fgv/ts-json-base` (`file-tree` packlet). PR: #TBD.

## The API as shipped

All in `libraries/ts-json-base/src/packlets/file-tree/fsTree.ts`, exported from the `FileTree`
namespace (Node barrel only; the browser barrel already excludes `fsTree`).

| symbol | shape |
|---|---|
| `FsAbsolutePathPolicy` | `'unconfined' \| 'confined' \| 'verified'` |
| `allFsAbsolutePathPolicies` | `ReadonlyArray<FsAbsolutePathPolicy>`, weakest first |
| `IFsFileTreeInitParams<TCT>` | `extends IFileTreeInitParams<TCT>` + `absolutePathPolicy?: FsAbsolutePathPolicy` + `realPath?: boolean` |
| `FsFileTreeAccessors` constructor | now takes `IFsFileTreeInitParams` (a subtype-compatible widening); throws on an invalid combination |
| `FsFileTreeAccessors.create(params?)` | **new** — `Result<FsFileTreeAccessors<TCT>>`; the `Failure` the constructor would throw |
| `FsFileTreeAccessors.absolutePathPolicy` / `.realPath` | **new** readonly properties, the effective values |
| `FileTree.forFilesystem(params)` | params overload now takes `IFsFileTreeInitParams`, goes through `create` |

Defaults: `absolutePathPolicy: 'unconfined'`; `realPath` is `true` under `'verified'`, `false`
otherwise. The shared `IFileTreeInitParams` is unchanged.

**Creation fails** (`create` / `forFilesystem` return a `Failure`; the constructor throws) for:
`'confined'` or `'verified'` with no prefix (`undefined` or `''`) — *"absolutePathPolicy 'verified'
requires a prefix: with no prefix there is nothing to confine to"*; `realPath: true` under
`'unconfined'` — *"realPath requires absolutePathPolicy 'confined' or 'verified', not
'unconfined'"*; an unknown policy string (`Converters.enumeratedValue`).

**Semantics.**

- *Resolved path, not the input string.* `path.resolve` first (`..` collapsed); "under" is
  `_isWithin` — equal to the prefix or prefix + separator, root prefix handled — so `/prefixx/a` is
  not under `/prefix`.
- *`'confined'`* (in `resolveAbsolutePath`): an absolute path outside → `<prefix>/<path>`; a relative
  `..` escape → resolved as though the prefix were `/` (`../x`, `a/../../x` → `<prefix>/x`;
  `../q/x` → `<prefix>/q/x`). A path already under the prefix is never re-prefixed, so the mapping is
  idempotent and `<prefix>/<prefix>/…` is reachable only by the relative form. Chosen over refusal —
  see "Relative escapes under `confined`" below.
- *`'verified'`*: `resolveAbsolutePath` is unchanged; each operation fails with
  `<path>: resolves outside the tree prefix '<prefix>'` and touches nothing.
- *`realPath`*: the real path of the target (following a final link), or of its nearest existing
  ancestor when it does not exist, must lie under the real prefix:
  `<path>: resolves through a symbolic link to '<real>', outside the tree prefix '<realPrefix>'`. A
  dangling link is refused (its target cannot be checked before a write creates it).
  `'confined'` + `realPath` **refuses** a symlink escape (it does not remap it).
- *Operations confined*: `getItem` (stat), `getFileContents`, `getFileBytes` / `getFileTextStrict`,
  `getChildren`, `resolveRealPath`, `fileIsMutable` (detail `'path-excluded'`) and through it
  `saveFileContents`, `saveFileBytes`, `deleteFile`, `deleteDirectory`; and `createDirectory`.
- *Atomic methods*: behaviour unchanged. They keep `_confineToRoot` (logical + containing-directory
  real path, always on); under `'confined'` they receive the mapped path like everything else.

### Relative escapes under `confined`

The brief asked for a definition and offered refusal. I resolve the escape against the prefix as
root instead, because `resolveAbsolutePath` is total and is what `DirectoryItem` / `FileItem` store as
`absolutePath`: a refusal at the accessor would be silently bypassed the moment an item built from the
same input handed its stored absolute path back (which `confined` maps beneath the prefix anyway),
giving two answers to one question. One total, idempotent mapping applies identically at item
creation and at use. Nothing outside the prefix is reachable either way, and a caller who wants
escapes to fail uses `'verified'`. Full reasoning in `state.md` D3.

## Escape matrix

Every cell below is **observed** by
`libraries/ts-json-base/src/test/unit/file-tree/fsTreeConfinement.test.ts` on a real temp directory
(fresh fixture per cell) and asserted equal to the decided design, so the table and the suite cannot
drift: the test fails if any cell differs.

- **E** escapes — something outside the prefix changed, or a read/inquiry succeeded against a
  location outside it.
- **R** refused — failed with a confinement message, nothing outside touched.
- **C** contained — succeeded inside the prefix, or failed for an ordinary reason (not found, mapped
  path absent, `ENOTDIR`) with nothing outside touched.

Columns: rd `getFileContents` · rdB `getFileBytes` · rdS `getFileTextStrict` · st `getItem` · ls
`getChildren` · rp `resolveRealPath` · mut `fileIsMutable` · sv `saveFileContents` (overwrite) · svB
`saveFileBytes` (new file) · mk `createDirectory` · rmF `deleteFile` · rmD `deleteDirectory` · aCap
`getAtomicWriteCapabilities` · aWr `writeFileAtomically` · aCl `cleanupAtomicTemporaries`.

Path classes: the "symlinked directory" class addresses targets *beneath* `<prefix>/linkdir →
outside`; the "symlinked entry" class addresses the link itself (`linkfile → outside/out.txt`,
`linkdir`, `linkempty`, and `dangling → outside/new.txt` for the new-file operations).

**unconfined (default)**

| path class | rd | rdB | rdS | st | ls | rp | mut | sv | svB | mk | rmF | rmD | aCap | aWr | aCl |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| absolute inside | C | C | C | C | C | C | C | C | C | C | C | C | C | C | C |
| relative inside | C | C | C | C | C | C | C | C | C | C | C | C | C | C | C |
| absolute outside | E | E | E | E | E | E | E | E | E | E | E | E | R | R | R |
| relative `..` escape | E | E | E | E | E | E | E | E | E | E | E | E | R | R | R |
| absolute `..` escape | E | E | E | E | E | E | E | E | E | E | E | E | R | R | R |
| prefix-lookalike sibling (`<prefix>x`) | E | E | E | E | E | E | E | E | E | E | E | E | R | R | R |
| symlinked directory inside → outside | E | E | E | E | E | E | E | E | E | E | E | E | R | R | R |
| symlinked entry (file / dir / dangling) inside → outside | E | E | E | E | E | E | E | E | E | C | C | C | R | C | R |
| symlink inside → inside | C | C | C | C | C | C | C | C | C | C | C | C | C | C | C |
| Windows-style `..\` separators (POSIX) | C | C | C | C | C | C | C | C | C | C | C | C | C | C | C |

**confined**

| path class | rd | rdB | rdS | st | ls | rp | mut | sv | svB | mk | rmF | rmD | aCap | aWr | aCl |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| absolute inside | C | C | C | C | C | C | C | C | C | C | C | C | C | C | C |
| relative inside | C | C | C | C | C | C | C | C | C | C | C | C | C | C | C |
| absolute outside | C | C | C | C | C | C | C | C | C | C | C | C | C | C | C |
| relative `..` escape | C | C | C | C | C | C | C | C | C | C | C | C | C | C | C |
| absolute `..` escape | C | C | C | C | C | C | C | C | C | C | C | C | C | C | C |
| prefix-lookalike sibling (`<prefix>x`) | C | C | C | C | C | C | C | C | C | C | C | C | C | C | C |
| symlinked directory inside → outside | E | E | E | E | E | E | E | E | E | E | E | E | R | R | R |
| symlinked entry (file / dir / dangling) inside → outside | E | E | E | E | E | E | E | E | E | C | C | C | R | C | R |
| symlink inside → inside | C | C | C | C | C | C | C | C | C | C | C | C | C | C | C |
| Windows-style `..\` separators (POSIX) | C | C | C | C | C | C | C | C | C | C | C | C | C | C | C |

**confined + realPath**

| path class | rd | rdB | rdS | st | ls | rp | mut | sv | svB | mk | rmF | rmD | aCap | aWr | aCl |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| absolute inside | C | C | C | C | C | C | C | C | C | C | C | C | C | C | C |
| relative inside | C | C | C | C | C | C | C | C | C | C | C | C | C | C | C |
| absolute outside | C | C | C | C | C | C | C | C | C | C | C | C | C | C | C |
| relative `..` escape | C | C | C | C | C | C | C | C | C | C | C | C | C | C | C |
| absolute `..` escape | C | C | C | C | C | C | C | C | C | C | C | C | C | C | C |
| prefix-lookalike sibling (`<prefix>x`) | C | C | C | C | C | C | C | C | C | C | C | C | C | C | C |
| symlinked directory inside → outside | R | R | R | R | R | R | R | R | R | R | R | R | R | R | R |
| symlinked entry (file / dir / dangling) inside → outside | R | R | R | R | R | R | R | R | R | R | R | R | R | R | R |
| symlink inside → inside | C | C | C | C | C | C | C | C | C | C | C | C | C | C | C |
| Windows-style `..\` separators (POSIX) | C | C | C | C | C | C | C | C | C | C | C | C | C | C | C |

**verified (realPath on by default)**

| path class | rd | rdB | rdS | st | ls | rp | mut | sv | svB | mk | rmF | rmD | aCap | aWr | aCl |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| absolute inside | C | C | C | C | C | C | C | C | C | C | C | C | C | C | C |
| relative inside | C | C | C | C | C | C | C | C | C | C | C | C | C | C | C |
| absolute outside | R | R | R | R | R | R | R | R | R | R | R | R | R | R | R |
| relative `..` escape | R | R | R | R | R | R | R | R | R | R | R | R | R | R | R |
| absolute `..` escape | R | R | R | R | R | R | R | R | R | R | R | R | R | R | R |
| prefix-lookalike sibling (`<prefix>x`) | R | R | R | R | R | R | R | R | R | R | R | R | R | R | R |
| symlinked directory inside → outside | R | R | R | R | R | R | R | R | R | R | R | R | R | R | R |
| symlinked entry (file / dir / dangling) inside → outside | R | R | R | R | R | R | R | R | R | R | R | R | R | R | R |
| symlink inside → inside | C | C | C | C | C | C | C | C | C | C | C | C | C | C | C |
| Windows-style `..\` separators (POSIX) | C | C | C | C | C | C | C | C | C | C | C | C | C | C | C |

**verified, realPath: false**

| path class | rd | rdB | rdS | st | ls | rp | mut | sv | svB | mk | rmF | rmD | aCap | aWr | aCl |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| absolute inside | C | C | C | C | C | C | C | C | C | C | C | C | C | C | C |
| relative inside | C | C | C | C | C | C | C | C | C | C | C | C | C | C | C |
| absolute outside | R | R | R | R | R | R | R | R | R | R | R | R | R | R | R |
| relative `..` escape | R | R | R | R | R | R | R | R | R | R | R | R | R | R | R |
| absolute `..` escape | R | R | R | R | R | R | R | R | R | R | R | R | R | R | R |
| prefix-lookalike sibling (`<prefix>x`) | R | R | R | R | R | R | R | R | R | R | R | R | R | R | R |
| symlinked directory inside → outside | E | E | E | E | E | E | E | E | E | E | E | E | R | R | R |
| symlinked entry (file / dir / dangling) inside → outside | E | E | E | E | E | E | E | E | E | C | C | C | R | C | R |
| symlink inside → inside | C | C | C | C | C | C | C | C | C | C | C | C | C | C | C |
| Windows-style `..\` separators (POSIX) | C | C | C | C | C | C | C | C | C | C | C | C | C | C | C |

**Reading it.**

- **`unconfined` is today's behaviour, pinned**: every plain operation escapes on every outside
  class; only the atomic methods refuse. These rows passed against the options-only stub, before any
  behaviour existed — evidence the default did not move.
- **`confined` without `realPath` still escapes through symbolic links** (the two link rows), as
  documented: it judges the path string. `confined + realPath` closes that.
- **`verified` with `realPath: false`** refuses every path-string escape and, likewise, still follows
  links out.
- **`unconfined` on the symlinked-entry row**: `deleteFile` removes the link, `deleteDirectory` fails
  `ENOTDIR`, `createDirectory` of an existing link is a no-op, and `writeFileAtomically` replaces the
  link rather than following it — none touches the target. Under `realPath` those are refused too,
  because the check sees the link's target; conservative, and recorded in `state.md` D5.
- **Root prefix `/`**: separate tests — under `'confined'` and `'verified'` every absolute path is
  under `/`, nothing is remapped and nothing refused, and `../..` resolves to `/`.
- **Windows separators**: on POSIX a backslash is a filename character, so `..\outside\out.txt` is one
  oddly-named entry inside the prefix — contained under every policy. On win32 the row's expectation
  switches to the `..`-escape row; **not run** here (Linux only).

Further pinned outside the matrix: `getDirectory('/')` names the prefix under `'confined'`, the
filesystem root under `'unconfined'` (unchanged), and is refused under `'verified'`; a confined
mutable directory item creates beneath the prefix; a missing path beneath an outward link is
refused under `realPath`; a dangling link inside → inside becomes writable once its target exists; a
prefix that is itself a symbolic link works; a prefix that does not exist leaves the operation to
report `ENOENT`.

## Red-first

The suite was written against an options-only stub (types, constructor validation, `create` — no
behaviour): **34 failed, 46 passed of 80**. Every failure was a confined / verified / realPath row or
a resolution/behaviour test; every `unconfined` and inside row passed.

## Revert matrix

Each row reverts one confinement site in `fsTree.ts`, recompiles, and runs `fsTreeConfinement`,
`fsTree`, `fsAtomicWrite` and `fileTreeHelpers` (235 tests). **Every row is red.** Script:
`revert.py` in the session scratchpad; run on the committed tree, which was restored and rebuilt
after.

| row | site reverted | result | tests |
|---|---|---|---|
| R1 | `confined` mapping removed — `resolveAbsolutePath` returns the plain resolved path | RED | 15 failed |
| R2 | `confined` relative escape prepends the resolved path instead of resolving against the prefix as root | RED | 1 failed |
| R3 | `verified` logical check removed from `_resolveConfined` | RED | 6 failed |
| R4 | real-path check never runs (`realPath` ignored) | RED | 9 failed |
| R5 | real-path check treats an unresolvable (dangling) link as inside | RED | 4 failed |
| R6 | real-path check judges only the containing directory, not a final link | RED | 6 failed |
| R7 | `getItem` (stat) bypasses confinement | RED | 13 failed |
| R8 | `getFileContents` (read) bypasses confinement | RED | 15 failed |
| R9 | `getFileBytes` (readBytes, readStrict) bypasses confinement | RED | 12 failed |
| R10 | `getChildren` (list) bypasses confinement | RED | 12 failed |
| R11 | `resolveRealPath` bypasses confinement | RED | 12 failed |
| R12 | `fileIsMutable` (and so save, saveBytes, deleteFile, deleteDirectory) bypasses confinement | RED | 14 failed |
| R13 | `createDirectory` bypasses confinement | RED | 13 failed |
| R14 | atomic `_confineToRoot` uses the policy-checked `resolveRealPath` (a refusal reads as "does not exist") | RED | 4 failed |
| R15 | lookalike prefix accepted — `_isWithin` uses a bare `startsWith` | RED | 6 failed |
| R16 | no-prefix refusal removed — a missing prefix silently becomes the filesystem root | RED | 2 failed |
| R17 | `realPath` under `'unconfined'` accepted | RED | 1 failed |
| R18 | `realPath` defaults off under `'verified'` | RED | 7 failed |
| R19 | unknown policy accepted (no converter) | RED | 1 failed |

R14 is the one that matters most and is not obvious: making `resolveRealPath` policy-checked would,
on its own, have let the atomic write commit through a link out of the tree, because
`_confineToRoot` read a failed real-path lookup as "does not exist". `_confineToRoot` and
`_qualifyDirectory` now use a raw helper.

## Check-then-act

Plain operations check, then act on the logical path — a link created or retargeted between the two
is not seen. This is a documented residual (TSDoc on `_resolveConfined`, `CAPABILITIES.md`), not a
regression: the default never checked at all. The atomic methods commit through the real directory
they checked and keep their guarantee.

## Consumer sweep

`FsFileTreeAccessors` / `forFilesystem` are used in `ts-res`, `ts-extras`, `ts-agent-memory`,
`ts-agent-tasks`, `ts-prompt-assist`, `ts-sudoku-lib`, `tools/ks`, `ts-res-cli`, `ts-res-tutorial`;
none subclasses `FsFileTreeAccessors`, and all use the default, whose behaviour is unchanged. No test
pins the old `prefix` doc text (only the generated, long-stale `libraries/ts-json-base/docs/`).
Repo-wide `rush rebuild` and `rush test` are the gate, below.

## Docs

- TSDoc: `prefix` rewritten for each policy; `resolveAbsolutePath`, the new types, `create`,
  constructor `@throws`; `forFilesystem` wording in `fileTreeHelpers.ts` corrected.
- `libraries/ts-json-base/CAPABILITIES.md`: new decision shortcut; the atomic shortcut's "plain
  mutators do not confine at all" pointer replaced.
- `libraries/ts-json-base/README.md`: new "Filesystem trees and prefix confinement" section.
- `docs/TECH_DEBT.md`: the P2 entry removed, a closed pointer left in its place.
- Change file `common/changes/@fgv/ts-json-base/filetree-prefix-confinement_2026-10-27-12-00.json`,
  `minor`.
- `etc/ts-json-base.api.md` regenerated (additive only).
- `.ai/instructions/LIBRARY_CAPABILITIES.md`: only the generated *Recent additions* feed changed.
  I added no new router shortcut. The router is at 23,676 of 24,000 characters, and the existing
  "Reading files?" → `FileTree` shortcut routes here. The detail lives in the package
  `CAPABILITIES.md` shortcut.
- `docs/FUTURE.md`: nothing deferred needs a home there. The residuals are recorded below and in the
  TSDoc.

## Gates

Run from the repo root on implementation commit `e32e3feef`. Logs are in the worktree's
`.gate-logs/` (not committed). Grading: exit code, then
`grep -acE 'not met|Operations failed|error TS|Jest tests? failed'` must be 0, and
`grep -aiE warning` may show only the tracked-symlink notice.

| gate | exit | bad-pattern count | warnings |
|---|---|---|---|
| `install` (via `RUSH_PNPM_STORE_PATH`, see `state.md`) | 0 | — | — |
| `change --verify --target-branch origin/integration/asks` | 0 | 0 | 0 |
| `rebuild` (39 operations completed) | 0 | 0 | the tracked-symlink notice only |
| `test`, repo-wide (SUCCESS: 38 operations; one defines no work) | 0 | 0 | the tracked-symlink notice only |
| `ts-json-base` `rushx build` | 0 | 0 | 0 |
| `ts-json-base` `rushx lint` | 0 | 0 | 0 |
| `ts-json-base` `rushx test` (100 / 100 / 100 / 100) | 0 | 0 | 0 |
| prettier 2.8.8 `--check` on the changed `.ts`/`.json` (`.md` is prettier-ignored) | 0 | — | — |
| `generate-capability-feed.mjs`, then `--check` | 0 / 0 | — | 0 stale |
| `verify-capability-docs.mjs` | 0 | 0 failed | — |

None of the known-flaky tests failed. `rushx fixlint` ran before the final commit. The test log
was checked for NUL padding (none, so it was not clobbered).

## Left open

- Windows behaviour is designed and documented but unexercised (no win32 runner).
- The plain-operation check-then-act window (above).
- Generated typedoc under `libraries/ts-json-base/docs/` was not regenerated, as for every surface
  since 2026-08.
