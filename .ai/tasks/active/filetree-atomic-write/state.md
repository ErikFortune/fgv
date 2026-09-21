# State — `filetree-atomic-write`

## 2026-09-21 — stream opened, F1 not yet started

Branch `claude/filetree-atomic-write-f1` cut from `release` at `c27dd647` (the merge of #680,
which landed the agent-tasks design bundle this stream implements).

**Done:** ledger entry, brief, reconnaissance against current source.

**Not done:** any implementation. No code written, no tests written, no measurements run.

### Reconnaissance findings that changed the plan's assumptions

- The plan's F1 deliverable *"additive exports in Node/browser barrels"* needs no barrel edit —
  both barrels already `export * from './fileTreeAccessors'`.
- `index.browser.ts` already excludes `fsTree`, so F2 is Node-only by construction.
- The typecheck blast radius is six concrete accessor classes across three packages, enumerated
  in the brief. That is what the repo-wide rebuild checkbox is for.

### Open question carried into F1

`development-design.md` §8.1 proposes `writeFileAtomically(path, contents, options)` on the
accessors **and** `writeChildAtomically(name, contents, options)` on the directory item. The
design says task storage should only ever receive a directory item and never reach into `_hal`.
Worth confirming during F1 whether the accessor-level method needs to be public at all, or
whether the directory-item method plus the capability inquiry is the whole public surface —
a smaller public surface on a stability-obligated package is the safer default, and the accessor
method can always be promoted later. Additive is cheap; removal is a break.

## 2026-09-21 — F1 implemented

**Open question resolved.** Asked the user directly (per the brief's "raise it, don't decide it"
instruction) whether F1 should ship `writeFileAtomically`/`getAtomicWriteCapabilities(directory)`
on the accessors interface publicly, alongside the directory-item-level pair. Recommended
"ship both, publicly" — every other optional capability already in `fileTreeAccessors.ts`
(binary, mutable-binary, strict-text, mutable-binary-directory) ships that exact symmetric
accessor+item pair, both public, so an accessor-only-internal split would be new asymmetry, not
precedent. **User confirmed: ship both.** Implemented as designed in §8.1, no deviation.

**Done:**

- **Phase 1 — contracts** (`fileTreeAccessors.ts`): `AtomicWriteGuarantee`,
  `IAtomicWriteCapabilities`, `IAtomicWriteOptions`, `IAtomicWriteReceipt`, `IAtomicWriteFailure`,
  `IAtomicFileTreeAccessors`, `IAtomicFileTreeDirectoryItem`, `isAtomicAccessors`,
  `isAtomicDirectoryItem`. No barrel edit needed, confirmed by build (both `index.ts` and
  `index.browser.ts` still `export *` cleanly).
- **Phase 2 — `DirectoryItem` delegation** (`directoryItem.ts`): implements
  `IAtomicFileTreeDirectoryItem` unconditionally (mirrors `createChildFileBytes` pattern).
  `getAtomicWriteCapabilities()` succeeds with `{atomicReplace:false, guarantees:[]}` when the
  backing accessors lack the capability (never fails — it's an inquiry). `writeChildAtomically`
  validates the child name is non-empty and separator-free *before* checking accessor support,
  and fails explicitly (code `unsupported`) rather than degrading when the accessors don't
  implement `IAtomicFileTreeAccessors`.
- **Phase 3 — in-memory session implementation** (`in-memory/inMemoryTree.ts`):
  `InMemoryTreeAccessors` implements `IAtomicFileTreeAccessors`. Advertises `guarantees: ['session']`
  only, never `'process-crash'` — an in-memory content replacement is a single synchronous
  assignment (`MutableInMemoryFile.setContents`), so there's no torn-write window, but nothing
  here survives the process exiting. A stronger requested guarantee fails at `stage: 'validate'`
  before any mutation. `getAtomicWriteCapabilities(directory)` fails if the directory doesn't
  exist/isn't a directory (matches `getChildren`'s existing failure shape) rather than reporting
  `atomicReplace: false` for a bad path.
- **Phase 4 — tests**: new `src/test/unit/file-tree/atomicWrite.test.ts`, 21 scenario tests
  (both accessor- and directory-item-level: creation, replacement, stronger-guarantee-fails-before-
  mutating, not-writable, io-classified failure via a name/directory collision, invalid child
  name, unsupported-backing-store explicit failure via `FsFileTreeAccessors`). Full suite:
  1006 passed, **100% coverage on every file touched, no `c8 ignore` directives added** —
  functional scenario tests alone closed the gap, so no coverage-gap-resolution round was needed.
- Gates run so far: `rushx build` (zero warnings after fixing one `@inheritDoc`/`@remarks`
  TSDoc conflict on `writeFileAtomically`'s in-memory doc comment), `rushx lint` (clean),
  `rushx test` (985 pre-existing + 21 new, all green, 100% coverage), API report diff reviewed —
  purely additive except two `implements` clauses widening (`DirectoryItem`,
  `InMemoryTreeAccessors`), which is exactly what an additive optional-capability interface
  looks like in an api.md diff.

**In flight (backgrounded, not yet reported back):**
- `code-reviewer` agent run on the diff (mandated before calling coverage closed — coverage was
  already 100% so this is the "trigger fires the moment you're about to chase coverage" case with
  nothing left to chase, but the review still runs per the rule).
- `node common/scripts/install-run-rush.js rebuild` (repo-wide) — mandatory per the acceptance
  checklist, confirms the six-accessor blast radius (three packages) still typechecks. Not
  expected to find anything since the new interfaces are additive-only and no existing accessor
  class was touched, but this is the checkbox the repo added after four consecutive streams
  broke a downstream implementer without it, so it runs regardless of that expectation.

**Not done yet:** change file, `CAPABILITIES.md` entry, `rush change --verify`, PR description,
`result.md`, artifact migration to `.ai/tasks/completed/2026-09/filetree-atomic-write/` (via
`/finalize-task`), Copilot review loop (opens after first push).

### Next action

Once the code-reviewer and repo-wide rebuild report back: resolve/disposition any findings, add
the ts-json-base change file, add the `CAPABILITIES.md` entry, commit, push, open the PR with the
layer-1 review summary in the description, then run `/finalize-task` before merge.
