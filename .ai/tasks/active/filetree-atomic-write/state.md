# State — `filetree-atomic-write`

**F1 ✅ merged to `integration/filetree-atomic-write` via #681. F2 🟢 ready — the stream stays
active; artifacts migrate to `.ai/tasks/completed/` when F2 closes the stream, not at F1.**

**Landing shape: F1 and F2 squash to `release` as one commit.** Both versions PR into
`integration/filetree-atomic-write`; that branch squashes to `release` when F2 lands. F1 does not
reach `release` on its own, so nothing here is published or promoted until the pair is complete.

The reason is F1's evidence gap, not its correctness. F1 declares a failure vocabulary it barely
exercises — **1 of 6 `stage` values, 1 of 3 `visibility` values, 1 of 4 `AtomicWriteGuarantee`
values, 2 of 3 `code` values**. Eleven of sixteen declared union members across the four unions have
no implementation behind them; they are predictions about a Node protocol that does not exist yet.

Review sharpened this rather than settling it. Before `c95b3791` the ancestor-collision path
produced `io` / `replace` / `unknown`, three otherwise-unused members. That classification was wrong
— the destination was never written, and `visibility` is scoped to the destination path — and
correcting it left the wider vocabulary with **no exercised witness at all**. The orchestrator's own
layer-1 review had endorsed the wrong classification; CodeRabbit caught it.

**Consequence for F2: the vocabulary is a proposal, not an inheritance.** Where the real
temp/flush/rename/directory-flush protocol disagrees with the predicted `stage` / `visibility` /
`AtomicWriteGuarantee` / `code` members, change them. Nothing has been published, and F1 has not
reached `release`, so a revision costs a diff rather than a migration on a stability-obligated
surface. Do not contort an implementation to fit a name that was guessed.

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

**`code-reviewer` pass — findings resolved:**
- **P2 (fixed):** `writeFileAtomically`'s destination-collides-with-existing-directory failure
  was misclassified as `{code:'io', stage:'replace', visibility:'unknown'}` when nothing had
  actually mutated — it's a pre-mutation destination-validity check. Added an explicit
  destination-type pre-check ahead of `saveFileContents` and now reports
  `{code:'not-writable', stage:'validate', visibility:'unchanged'}`, matching the shape used for
  the guarantee-mismatch case a few lines above. Test updated to pin the corrected detail and to
  assert the destination directory is untouched afterward. Added a second test for the one
  remaining `saveFileContents` failure mode (an ancestor path segment already exists as a file),
  which is genuinely ambiguous (can create intermediate directories before failing) and correctly
  keeps the `io`/`replace`/`unknown` classification.
- **P2 (fixed):** `{@link MutableInMemoryFile.setContents}` was an unresolvable cross-reference —
  `MutableInMemoryFile` is an internal, non-exported class, so API Extractor baked a real
  `ae-unresolved-link` warning (not the accepted "not supported yet by the resolver" kind) into
  the checked-in `api.md`. Replaced with a plain code span. Confirmed by diffing `api.md`
  before/after: the warning line is gone, nothing else changed.
- **P3 (fixed, cheap):** success receipt now echoes `options.guarantee` instead of hardcoding
  `'session'` (correct today only incidentally); accessor-level `getAtomicWriteCapabilities` doc
  now documents the "path names a file, not a directory" failure case alongside "doesn't exist";
  `IAtomicFileTreeDirectoryItem.getAtomicWriteCapabilities`'s "Never `Failure`" doc softened to
  describe what today's implementations actually guarantee rather than an absolute promise the
  accessor-level contract doesn't make; added a one-line comment noting the intentional
  duplicate `fileIsMutable` check; added per-value documentation to `IAtomicWriteFailure.stage`
  (six values, F1 only ever produces two, the rest are named as reserved for a Node/F2
  implementation).
- **P3 (dispositioned, not fixed):** the reviewer noted `writeChildAtomically`'s new
  name-validation (reject empty/`/`-containing names) isn't mirrored on the older sibling
  methods `createChildFile`/`createChildFileBytes`, which today silently `joinPaths` a
  slash-containing name. Correct observation, but backfilling stricter validation onto two
  established, pre-existing methods is a behavior change outside this stream's scope (not
  requested, not related to atomic writes) — left as a follow-up rather than folded in here per
  "don't refactor surrounding code during a focused change."
- Re-ran `rushx build` (zero warnings, api.md diff shows only the one line removed), `rushx lint`
  (clean), `rushx test` (1007 passed — 985 pre-existing + 22 in the new file after the fix-round
  addition, 100% coverage, no `c8 ignore` directives) after applying the fixes.

**Repo-wide rebuild — resolved:** the first two `rush rebuild` attempts (default parallelism)
both failed identically at `@fgv/ts-json-base`'s `api-extractor` step with
`Internal Error: The referenced path was not found: .../lib/packlets/file-tree/fileTreeAccessors.d.ts`.
A standalone `rush rebuild --to @fgv/ts-json-base` (clean) succeeded immediately both times,
and a full `rush rebuild --parallelism 1` then succeeded on **all 36 operations** with zero
failures — confirming this was a pre-existing build-cache race under concurrent Heft
`--clean`/API-Extractor steps in this environment, not a defect introduced by this change. All
six accessor classes named in the brief's blast-radius table, across all three packages
(`ts-json-base`, `ts-web-extras`, `ts-extras`), and every downstream consumer, still typecheck
unchanged.

**Change file verified:** `rush change --verify --target-branch origin/release` finds and accepts
`common/changes/@fgv/ts-json-base/filetree-atomic-write-f1_2026-09-21-19-57-46.json` (type
`minor`, matching the precedent set by the earlier `filetree-bytes-capability` binary-capability
addition).

**Commits on `claude/filetree-atomic-write-f1`, pushed:**
1. `357446d6` — F1 implementation (contracts, delegation, in-memory session implementation,
   tests, change file, `CAPABILITIES.md` entry).
2. `9d4d675b` — `code-reviewer` fix round (classification fix, doc fixes, two new/updated tests).
3. `6d69b7e9` — regenerated `api.md` (the one line for the now-resolved `@link` warning).

**Not done, and deliberately not started:** opening a PR. The repo's standing instruction is
"do NOT create a pull request unless the user explicitly asks for one," and this session's task
harness instructed commit + push only — no PR request appears anywhere in this conversation.
Everything the brief describes as PR-gated (layer-2 Copilot loop, `/finalize-task` artifact
migration to `.ai/tasks/completed/2026-09/filetree-atomic-write/`, the polished `README.md`) is
therefore also not started, since each depends on a PR existing. The branch is pushed and green
end-to-end; opening the PR is a one-step action once requested.

### Next action

If/when a PR is requested: open it against `release` with a description summarizing the layer-1
`code-reviewer` round above (what was found, what was fixed, what was dispositioned and why),
then drive the layer-2 Copilot loop per the standard review-loop discipline, then run
`/finalize-task` before merge (migrate `.ai/tasks/active/filetree-atomic-write/` to
`.ai/tasks/completed/2026-09/filetree-atomic-write/` with a polished `README.md`, write
`result.md`, update the streams ledger). Until then this state.md is the record of what's done.

## 2026-09-21 — F1 orchestrator verification and PR

Every gate re-run independently rather than accepted from the report above:
`rushx build` exit 0 zero warnings, `rushx lint` exit 0, `rushx test` exit 0 with 100%
statements/branches/functions/lines on all three touched files and zero `c8 ignore`
directives added, `rush change --verify` finds the change file, and the repo-wide
`rush rebuild` passed **exit 0 clean on the first attempt at default parallelism** —
confirming the pre-existing-race diagnosis above rather than taking it on trust.

`api.md` reviewed as additive: the only removed lines are two `implements` clauses
widening on `DirectoryItem` and `InMemoryTreeAccessors`, which is what an additive
optional capability looks like. The 34 added `ae-unresolved-link` warnings are the
endemic `{@link FileTree.X}` namespace pattern — `release` already carries 204 identical
ones in this same file — so they are sibling-consistent, and commit `6d69b7e9` correctly
removed the one genuinely-broken reference (`does not have an export
"MutableInMemoryFile"`) while leaving the house-style ones alone.

One item the brief flagged and F1 left unaddressed is now fixed in `298e56c5`: the
`isPersistentAccessors` `c8 ignore` justification claimed no accessor implements the
interface, which is false repo-wide. Scope corrected to this package, downstream
implementers named. Kept to one line because `c8 ignore next 6` counts file lines — a
four-line version shifted the window off the return block and dropped the file to 99.91%.

### Carried into F2

- The `stage` union documents all six values, but F1 **produces only `'validate'`**. The other
  five are predictions about the Node protocol. F2 fills them in *or changes them* — see the
  landing-shape note at the top of this file. Same for `AtomicWriteGuarantee` (F1 produces
  `'session'` only) and `code` (F1 never produces `'io'`).
- The `visibility: 'unchanged' | 'replaced' | 'unknown'` discipline is the load-bearing
  inheritance, and the rule that settles every case is: **`visibility` describes what a
  subsequent reader can see at the destination path** — not whether the tree changed anywhere.
  F1 produces `'unchanged'` exclusively. Both pre-mutation cases are `'unchanged'` for the same
  reason: a destination collision is caught before any write, and an ancestor-segment conflict
  never reaches the destination either, even though the walk may have created intermediate
  directories on the way — those are *other paths*.

  Note this corrects an earlier claim in this file's own history, which had the ancestor case
  keeping `'unknown'`. That was F1's original classification, it was wrong, and `c95b3791`
  fixed it after CodeRabbit caught it — the orchestrator's layer-1 review had endorsed the
  wrong answer. **F2's post-rename failure path is the first genuine `'replaced'` / `'unknown'`
  case in the stream**, and the first real test of whether this vocabulary is the right one.
- Open follow-up, dispositioned out of F1: `createChildFile` / `createChildFileBytes` do
  not validate child names the way `writeChildAtomically` now does, and silently
  `joinPaths` a slash-containing name. Correct finding, but backfilling stricter
  validation onto two established methods is a behavior change outside this stream.
