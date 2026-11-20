# Brief: `filetree-prefix-confinement` — configurable prefix confinement for `FsFileTreeAccessors`

The orchestrator owns this brief and froze it at kickoff. Put questions in `state.md`.

**Origin:** the `docs/TECH_DEBT.md` P2 "`FsFileTreeAccessors`' prefix does not confine: absolute paths escape it, and plain writes never check". Found by the `agent-memory-atomic-writes` review (#756). **The user decided the design on 2026-10-27** (below). This stream closes that entry.

**Base / PR target:** `integration/asks`. **Packages:** `@fgv/ts-json-base` (the `file-tree` packlet). It touches consumers only if a test of theirs pins the old doc text.

## Facts (verified on integration/asks)
- `libraries/ts-json-base/src/packlets/file-tree/fsTree.ts`:
  - `resolveAbsolutePath` (~136) prepends `prefix` only when `!path.isAbsolute(paths[0])`.
  - The `prefix` doc (~104) says "prepend to all paths", which is false.
  - The plain mutators `saveFileContents` (~313), `saveFileBytes` (~326), `deleteFile` (~529), `createDirectory` (~548) and `deleteDirectory` check only the mutability filter.
  - The atomic methods confine through `_confineToRoot` (~503), which checks logical and real path and uses `_isWithin` (~60).
- `IFileTreeInitParams` lives in `fileTreeAccessors.ts:92` and is shared by every accessor kind, not only fs.
- `ts-json-base` is an **established** surface. The new option must default to today's behaviour.

## Decided design (user, 2026-10-27)
1. **One policy, applied to every operation (reads and writes):** `absolutePathPolicy: 'unconfined' | 'confined' | 'verified'`.
   - `unconfined` is today's behaviour and the default. An absolute input is used as given.
   - `confined`: if the resolved path is not under the prefix, the prefix is prepended (`/x` becomes `<prefix>/x`), so every operation lands under the prefix. Document the ambiguity: an input already under the prefix is never re-prefixed, so `<prefix>/<prefix>/…` cannot be expressed through an absolute path.
   - `verified`: any operation whose resolved path is not under the prefix fails, with a message naming the path and the prefix. Nothing is touched.
   - The policy also replaces the separate "confine plain mutators" flag (TECH_DEBT option (d)). Do **not** add a second flag.
2. **Judge the resolved path, never the input string.**
   - Normalize first (`path.resolve`, `..` collapsed).
   - "Under" means equal to the prefix or starting with prefix + separator. Use `_isWithin`, which already handles a root prefix.
   - A relative `../../x` that escapes the prefix is caught by `confined` / `verified` the same way. For `confined`, define what it maps to and document it. One option is to refuse, because prepending makes no sense for a relative escape; pick one and justify it in `result.md`.
   - `/prefixx/a` must not count as under `/prefix`.
3. **Real paths, as a separate option:** `realPath?: boolean`.
   - When on, apply the same check to the real path of the containing directory, symlinks included, as `_confineToRoot` already does, to plain reads and writes.
   - It defaults to **on under `verified`** and **off otherwise**. It can be enabled explicitly under `confined`; say what `confined` + `realPath` does to a symlink escape (refuse).
   - Reuse `_confineToRoot`. The atomic methods' behaviour stays the same as today.
4. **No prefix:** creating a tree with `confined`, `verified` or `realPath: true` and no prefix fails. The policy would be meaningless, so it must not be silently ignored. Accessors are created through constructors today; follow the packlet's existing factory or `create` pattern for returning a `Result`, and decide placement in `state.md`.
5. **Where the options live:** they are filesystem-only. Prefer an fs-specific params type (e.g. `IFsFileTreeInitParams extends IFileTreeInitParams`) accepted by `FsFileTreeAccessors` and `FileTree.forFilesystem`, instead of widening the shared `IFileTreeInitParams`, unless the existing factories make that unworkable. Record the decision.
6. **Docs:**
   - Rewrite the `prefix` TSDoc for each policy.
   - Fix the `fileTreeHelpers.ts` wording.
   - Update `libraries/ts-json-base/CAPABILITIES.md` and README.
   - Close the TECH_DEBT entry: remove it, and leave a pointer to this stream in its place.
   - Change file `minor`. It is additive: the default is unchanged.

## Required evidence
This is a confinement boundary. In `result.md`:
- **Escape matrix.** For each policy × `realPath`, list every path class and its result: absolute inside, absolute outside, `..` escape, prefix-lookalike sibling, symlinked directory inside → outside, symlinked file, root prefix `/`, Windows-style separators (where testable). Cover every operation: read, list, stat, save, saveBytes, createDirectory, deleteFile, deleteDirectory, and the atomic methods.
- **Revert matrix,** with every row shown red.

Run real-filesystem tests on temp dirs; follow the existing `fsTree` tests' pattern.

## Acceptance
- [ ] Tests use Result matchers and are written red-first.
- [ ] Package build, lint and test pass at 100% coverage.
- [ ] Repo-wide `rush rebuild` **and** `rush test` pass. This widens and narrows what operations accept.
- [ ] `change --verify --target-branch origin/integration/asks` passes.
- [ ] prettier 2.8 and `verify-capability-docs` pass.
- [ ] Close-out per `finalize-task` to `.ai/tasks/completed/2026-10/filetree-prefix-confinement/`, with a ledger entry (`#TBD`) and the feed.

## Mechanics
Use your own worktree. Push only to `filetree-prefix-confinement`, and open no PR. Commit before gating. Run gates in the foreground, except the repo-wide test, which runs in the background and is waited on. Do not use sub-agents.
