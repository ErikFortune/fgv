# Stream brief — `filetree-atomic-write`

**Status: F1 ✅ merged (#681, `7ba1b568`). F2 🟢 ready — in progress on
`claude/filetree-atomic-write-f2`.** Drafted 2026-09-21, from the merged agent-tasks design
bundle (`docs/design/agent-tasks/`, landed in #680 as `c27dd647`).

## Branch and PR posture

Both versions land on an **integration branch** and squash to `release` as one stream landing.
F1 does not reach `release` on its own.

| | |
|---|---|
| Integration branch | `integration/filetree-atomic-write` (off `release` at `c27dd647`) |
| F1 | `claude/filetree-atomic-write-f1` → #681, merged as `7ba1b568` |
| F2 | `claude/filetree-atomic-write-f2` (created off `7ba1b568`) → PRs into the integration branch |
| Squash to `release` | opened by the orchestrator once F2 lands — **not** by the implementing agent |

Change-file verification therefore targets the integration branch, not `release`:
`rush change --verify --target-branch origin/integration/filetree-atomic-write`.

CI runs on PRs into `integration/**` as of `e57faef0`; before that commit the trigger list
omitted them and such a PR got no checks at all. If an F2 PR shows no checks, stop and say so.

**Why an integration branch** — F1 is internally coherent but not independently *evidenced*. It
declares a failure vocabulary it barely exercises: 1 of 6 `stage` values, 1 of 3 `visibility`
values, 1 of 4 `AtomicWriteGuarantee` values, 2 of 3 `code` values. The unexercised members are
predictions about a Node protocol that did not exist when they were named. F1's review sharpened
this: the ancestor-collision path had produced the only three otherwise-unused members, that
classification was **wrong**, and correcting it in `c95b3791` left the wider vocabulary with no
witness at all. **F2 may therefore revise F1's unions** rather than inheriting them — nothing is
published until the pair lands, so a revision costs a diff, not a migration on a
stability-obligated surface. See `state.md` for the full handoff.

## Mission

Add an **optional atomic-write capability** to `FileTree` in `@fgv/ts-json-base`, so a consumer
can replace a file's contents such that a reader never observes a torn write, and so a durable
consumer can wait for a declared persistence boundary before acknowledging. Built in two versions — F1 the contracts plus a
session-guarantee in-memory implementation, F2 the Node implementation plus process-crash
qualification — which **ship together as one landing on `release`**. They were originally
scoped as independently shippable; F1's review established that its failure vocabulary has
almost no exercised witness, so the contracts land with the implementation that tests them.
See *Branch and PR posture*.

This stream exists because `@fgv/ts-agent-tasks` needs it, but it is **not** scoped to that
consumer. Any consumer committing JSON records durably wants it — `ts-agent-memory`'s
`FileTreeMemoryStore` is the obvious second.

## Why this is an upstream extension, not a task-library adapter

`FsFileTreeAccessors.saveFileContents` / `saveFileBytes` write through a bare
`fs.writeFileSync` (`fsTree.ts:261,274`) with no temp/flush/replace protocol. A crash mid-write
leaves a truncated file. The task library could hand-roll temp-and-rename over native paths, and
that is exactly the workaround `CODING_STANDARDS.md` § *Extending Core Libraries Over Working
Around Them* names: it would bypass `FileTree`, tie the task package to Node paths, and leave the
next consumer to reimplement it.

So the capability lands on the primitive. Design authority is
[`development-design.md` §8.1–8.2](../../../../docs/design/agent-tasks/development-design.md), and
the slice definitions are
[`implementation-plan.md` F1/F2](../../../../docs/design/agent-tasks/implementation-plan.md).

## Package surface

- `libraries/ts-json-base/src/packlets/file-tree/` — **the only package this stream modifies.**

## Out-of-scope

- `libraries/ts-agent-tasks` — does not exist yet; this stream does not create it.
- Any change to ordinary `saveFileContents` / `saveFileBytes` semantics.
- Any **required** member added to an existing base interface.
- Browser adapters (`ts-web-extras`) and `ts-extras/zip-file-tree` — read and rebuilt for
  compatibility, never edited. If one *must* change, that is a design contradiction: stop and
  amend the design openly rather than widening this stream.

## Reconnaissance already done (verified 2026-09-21 against `c27dd647`)

Facts an implementer would otherwise have to rediscover:

- **Both barrels re-export the whole module.** `index.ts` and `index.browser.ts` each do
  `export * from './fileTreeAccessors'`, so interfaces and guards added there are exported from
  Node *and* browser with no barrel edit. The plan's "additive exports in Node/browser barrels"
  deliverable is free.
- **`fsTree` is already browser-excluded** (`index.browser.ts` omits it deliberately, with a
  comment). F2's Node implementation is therefore Node-only by construction — no bundling risk.
- **The capability-guard precedent to mirror is `isBinaryAccessors`** (`fileTreeAccessors.ts:763`),
  with its item-level delegation through `_hal` in `fileItem.ts:186`. Follow that shape exactly;
  `DirectoryItem` is where the new `writeChildAtomically` delegation belongs, so task code can be
  handed a directory item and never see a native path.
- **Six concrete accessor classes must still typecheck without implementing the new interface** —
  this is the acceptance criterion, and it spans three packages:

  | Package | Class | Implements today |
  |---|---|---|
  | `ts-json-base` | `InMemoryTreeAccessors` | `IMutableFileTreeAccessors`, `IBinaryFileTreeAccessors` |
  | `ts-json-base` | `FsFileTreeAccessors` | `IMutableBinaryFileTreeAccessors` |
  | `ts-web-extras` | `LocalStorageTreeAccessors` | `IPersistentFileTreeAccessors`, `IBinaryFileTreeAccessors` |
  | `ts-web-extras` | `FileSystemAccessTreeAccessors` | same |
  | `ts-web-extras` | `HttpTreeAccessors` | same |
  | `ts-extras` | `ZipFileTreeAccessors` | `IBinaryFileTreeAccessors`, `IStrictTextFileTreeAccessors` (read-only) |

  Plus test doubles in `ts-json-base/src/test/unit/file-tree/fileTreeAccessors.test.ts`.

- **`isPersistentAccessors` is not the durability probe it looks like.** No accessor in
  `ts-json-base` implements `IPersistentFileTreeAccessors`; the three that do are all in
  `ts-web-extras`. `FsFileTreeAccessors` — the most durable backend — **fails** that probe, while
  `localStorage`, which syncs file-by-file with no atomicity, passes it. Do not gate durable
  construction on it. (`fileTreeAccessors.ts:744`; the `c8 ignore` comment there claiming no
  accessor implements the interface is stale — see *Known adjacent defect*.)

## Versions

### F1 — contracts and session implementation ✅ merged (#681, `7ba1b568`)

**Deliverables.** `IAtomicFileTreeAccessors` / `IAtomicFileTreeDirectoryItem`, the
`AtomicWriteGuarantee` vocabulary, classified `IAtomicWriteReceipt` / `IAtomicWriteFailure`
result types, `isAtomicAccessors` / `isAtomicDirectoryItem` guards, `DirectoryItem` delegation,
atomic session replacement in the in-memory accessors, and API/`CAPABILITIES.md` documentation
that separates **method presence**, **writability**, **atomic visibility** and **durability** —
four distinct things this surface has historically conflated.

**Acceptance.** Task-shaped code performs an atomic child write through an injected directory
item with no native path and no accessor internals. A read-only or unsupported tree fails
explicitly rather than silently degrading. In-memory advertises `session` and never
`process-crash`. A stronger requested guarantee fails **before** mutating anything. All six
accessors above still typecheck unchanged.

**Explicitly not claimed by F1:** any durable task repository, and any crash survival whatsoever.

### F2 — Node implementation and process-crash qualification 🟢 ready

Node leaf protocol per design §8.2: exclusive sibling temp, complete write, file flush and close,
same-directory rename as the visibility linearization point, directory flush, then success.
Precise `unchanged` / `replaced` / `unknown` failure classification. Qualified-root inquiry;
reserved-temp cleanup on reopen.

Crash evidence must come from real child-process termination synchronized to protocol boundaries,
not sleeps. **A1 bounds what may be claimed:** process-crash survival on qualified local Linux and
macOS roots only — no OS-crash or power-loss claim may be derived from process-kill evidence.

## Acceptance criteria (both versions)

- [ ] `rushx build` — zero warnings in `ts-json-base` *(a local warning is a CI failure)*
- [ ] `rushx lint` passes; `rushx fixlint` run before the final commit
- [ ] `rushx test` — 100% coverage in `ts-json-base`
- [ ] `code-reviewer` run **before** closing coverage gaps, per `TESTING_GUIDELINES.md`
- [ ] **`node common/scripts/install-run-rush.js rebuild` passes** — mandatory, not optional: this
      widens a shared contract, and the six implementers span three packages. This is the exact
      checkbox the repo added after four consecutive streams broke a downstream implementer.
- [ ] Change file for `@fgv/ts-json-base`; verify with
      `rush change --verify --target-branch origin/integration/filetree-atomic-write`
      *(the integration branch is the PR base — see Branch and PR posture)*
- [ ] API Extractor diff reviewed — `ts-json-base` is an **established, stability-obligated**
      surface per `ACTIVE_DEVELOPMENT.md`, not an active-development one. Additive only.
- [ ] `CAPABILITIES.md` entry ships in the same PR
- [ ] Artifacts migrated to `.ai/tasks/completed/2026-09/filetree-atomic-write/` with a polished
      `README.md`, in the PR, before merge

## Known adjacent defect — ✅ resolved in F1 (`298e56c5`)

**Do not re-open this; it is recorded for provenance.** F1 corrected the justification's scope
to "no accessor *in this package*" and named the three downstream `ts-web-extras` implementers.
The directive was kept to **one line** because `c8 ignore next 6` counts *file* lines — a
four-line comment shifted the window off the return block and dropped the file to 99.91%.

The original finding, as written before F1:

`fileTreeAccessors.ts:749` carries
`/* c8 ignore next 6 - no current accessor implements IPersistentFileTreeAccessors */`.
That justification is **false**: `LocalStorageTreeAccessors`, `FileSystemAccessTreeAccessors` and
`HttpTreeAccessors` all implement it. The directive may still be operationally correct — those
implementers are downstream of `ts-json-base`, so its own suite cannot reach the true branch
without a stub — but the stated reason is wrong repo-wide, and this stream edits that exact file
while adding a sibling capability guard. Either correct the reason to "no accessor *in this
package*" or add a stub-based test and drop the directive.

## Handoff contract

F1 publishes the interfaces, guards and vocabulary that F2 implements and that
`@fgv/ts-agent-tasks` T3 depends on. **T3's durable path is blocked until F2 passes on the
release's claimed platform matrix** — do not mark missing platform evidence as passed
(`implementation-plan.md` F2 review gate).

## Required reading

1. `docs/design/agent-tasks/development-design.md` §8.1–8.2 — fault model, capability shape,
   Node ordering protocol
2. `docs/design/agent-tasks/implementation-plan.md` F1/F2 — deliverables, tests, review gates
3. `libraries/ts-json-base/src/packlets/file-tree/fileTreeAccessors.ts` — the capability-guard
   precedent
4. `.ai/instructions/CODING_STANDARDS.md` § *Pre-PR Validation Checklist* — specifically the
   shared-contract rebuild rule and the change-file gate
