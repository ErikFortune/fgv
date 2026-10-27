# `filetree-prefix-confinement` — configurable prefix confinement for `FsFileTreeAccessors`

**Status:** shipped via #TBD into `integration/asks` (2026-10-27). Origin: the `docs/TECH_DEBT.md`
P2 "`FsFileTreeAccessors`' prefix does not confine", found by the `agent-memory-atomic-writes`
review (#756). Design decided by the user, 2026-10-27.

## What it delivered

- **`absolutePathPolicy`** on a new fs-only `IFsFileTreeInitParams`, applied to every read, listing,
  stat and write:
  - `'unconfined'` — the default, and exactly the old behaviour;
  - `'confined'` — a path outside the prefix is mapped beneath it (`/x` → `<prefix>/x`; a relative
    `..` escape resolves as though the prefix were `/`), so `getDirectory('/')` names the prefix;
  - `'verified'` — an operation outside the prefix fails, naming the path and the prefix.
- **`realPath`** — also refuse a symbolic link (final, intermediate or dangling) whose target lies
  outside the real prefix. On by default under `'verified'`.
- **Creation refuses meaningless options**: either option with no prefix, or `realPath` under
  `'unconfined'`, fails. New `FsFileTreeAccessors.create` returns that as a `Result`;
  `forFilesystem` uses it.
- **Atomic methods keep their own confinement** (`_confineToRoot`), unchanged under the default.
  Under the new policies they receive the mapped path like every other operation, and
  `writeFileAtomically` also passes the now-confined `fileIsMutable`. One internal fix keeps their
  real-path check intact: its lookups no longer go through the newly policy-checked
  `resolveRealPath`.
- **Docs**: `prefix` TSDoc rewritten, `forFilesystem` wording fixed, `CAPABILITIES.md` shortcut,
  README section, TECH_DEBT entry closed.

## Where to look

- `result.md` — the API as shipped, the 5 × 10 × 15 escape matrix (observed by the suite and
  asserted equal to the design), red-first evidence, and the 19-row revert matrix (all red).
- `state.md` — the decisions the brief left open (D1–D7) and their reasoning.
- `brief.md` — the frozen contract.
- Code: `libraries/ts-json-base/src/packlets/file-tree/fsTree.ts`; tests in
  `src/test/unit/file-tree/fsTreeConfinement.test.ts`.

## Left open

- A plain operation checks, then acts on the logical path: a link swapped in between is not seen.
- Windows separators are designed for but untested (Linux only).
- `realPath` cannot see hard links or bind mounts (documented).
- A `..` in a directory item's child name is not refused. Under `'confined'` it is mapped by the
  absolute-path rule and stays inside. Refusing it is a follow-up.
- Review round 1 (no P1) is summarised in `result.md` § "Review round 1".
