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

### Next action

Await explicit authorization to implement F1, then start with the contracts in
`fileTreeAccessors.ts` mirroring the `isBinaryAccessors` precedent.
