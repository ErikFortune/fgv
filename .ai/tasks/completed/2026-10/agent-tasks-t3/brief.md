# Stream brief — `agent-tasks-t3`

**Status: 🟢 ready.** Drafted 2026-09-22, slice **T3** of `docs/design/agent-tasks/implementation-plan.md`.

## Mission

Land **T3** — FileTree records, durable commit and reopen. Injected-root session and durable
factories, a private single-writer coordinator, strict JSON storage records, a flat repository
inventory, ordered record registration, **one-task atomic replacement of state + owed updates +
operation**, inventory-backed missing-record detection, and a diagnostic recovery handle.

**One repository implementation, two adapters** — in-memory and Node. Not two implementations.

This is the slice the reference consumer is actually waiting on: T3's durable path is what
`@fgv/ts-agent-tasks` exists to provide, and it is the first slice where getting it wrong loses
data rather than returning a bad value.

## Branch and PR posture

| | |
|---|---|
| Integration branch | `integration/agent-tasks-v1` (T1 `1337c27c`, T2 `0249e85d`) |
| T3 | `claude/agent-tasks-t3` → PRs into the integration branch |
| Squash to `release` | orchestrator's, **not** the implementing agent's |

`rush change --verify --target-branch origin/integration/agent-tasks-v1`.
CI runs on PRs into `integration/**`. If a PR shows no checks, stop and say so.

**T1+T2+T3 is the intended first squash to `release`.** T1+T2 was considered and deliberately not
promoted: it gives a consumer only a renderer for task data they already hold, which is not what
the driving consumer is waiting for. T3 is what makes the promotion worth a consumer's attention.

## Durability is bounded, and the bound is not negotiable

F2 shipped the `FileTree` atomic-write capability with a **Linux-only** qualification, decided per
root by positive filesystem identification — `ext2/ext3/ext4` and `tmpfs` qualify; **everything
else, including `overlayfs`, is refused rather than written weakly**. Decision **A1** caps the
claim at `'process-crash'`: no OS-crash, no power-loss, and neither is derivable from process-kill
evidence.

T3 inherits all of that and **may not widen it**. Concretely:

- **No durable success may precede the FileTree atomic boundary.** That is the acceptance
  criterion, and it is the one whose violation is invisible in a passing test suite.
- A root that does not qualify must **fail construction of a durable repository**, not silently
  degrade to a session one. Session mode stays explicit.
- `IAtomicWriteFailure.visibility` means **what a subsequent reader can see at the destination
  path**. `'unchanged'` is claimed only on positive evidence; `'unknown'` obliges the caller to
  read the record back rather than assume nothing happened. Do not re-interpret these.
- **A container's writable layer is `overlayfs` and will be refused.** A durable root belongs on a
  named volume or a Linux bind mount. This is a documentation obligation as much as a code one —
  a host that assumes otherwise learns at run time.

Read `.ai/tasks/completed/2026-09/filetree-atomic-write/result.md` before designing the commit
path. It carries the fault matrix, the crash-boundary evidence, and what each guarantee rests on.

## You hold licence to revise T1's vocabulary — and you are the last cheap moment

T1 shipped **15 closed sets, 101 members, roughly half *choice*-unexercised**. T2 exercised the
rendering slice. **T3 is the first slice to touch the storage, operation and recovery members** —
`TaskFailureCode`'s storage and cursor codes, the recovery unions, the A3 claim purposes.

Nothing has reached `release`, and `ts-agent-tasks` is on the active-development list with
breaking changes landing freely. So if a member is wrong, misnamed, or missing for what durable
storage actually needs, **change it**, update T1's declared-vs-exercised table, and record the
reasoning in `result.md`.

**This is the last slice where that is cheap.** T3 writes this vocabulary into records on disk. A
revision after T3 is a storage-format change with a migration, not a diff.

## Package surface

- `libraries/ts-agent-tasks/src/packlets/storage/` — **new**, this slice's home
- `libraries/ts-agent-tasks/src/packlets/types/` — revisions permitted, per above
- `libraries/ts-agent-tasks/src/packlets/converters/` — additions for storage records
- root exports, `CAPABILITIES.md`, `README.md`, API report, change file

## Out-of-scope

- **The broker** (T5), **indexes / paging / due discovery** (T4), **subscriptions and exact
  acknowledgement** (T7), **retention and backpressure** (T8), **cascade stop** (T9). T3 is
  storage and recovery, nothing above it.
- **Source execution.** "Open never starts source execution" is an acceptance criterion. Register
  an unavailable external source as an **unresolved reference with no invented lifecycle**.
- Any **business-layer filesystem bypass.** Everything goes through `FileTree`. If you find
  yourself importing `node:fs`, you have left the slice — that is what F1/F2 exist to prevent.
- Any **task runner, scheduler or retry policy**.
- `ts-json-base` and every other package, consumed unchanged. An upstream gap is an escalation.
- The deferred **input-request protocol** (gate #6).

## Acceptance (plan § T3)

- **No durable success precedes the new FileTree boundary.**
- Each accepted mutation has **complete current state plus owed-update data plus dedup evidence**.
- **Canonical addresses are task-ID based.**
- **Open never initializes over a missing or corrupt manifest**, and never starts source execution.
- **Pending registration has explicit recovery behaviour.**
- **Unknown data is retained without lossy rewrite.** A record written by a newer schema must
  survive a round trip through this one.

### A3 additions

Persist the profile and claims in their owning records; construct the derived capacity ledger;
**preflight all count and byte dimensions under the writer**; pending registration owns its
reservations until live transfer. Expose trusted capacity status and an explicit finite-limit
increase — **no in-place lowering, no silent reinterpretation on reopen**. Reservations must
survive the same process-crash boundaries as acceptance. **No global quota-file dual write and no
per-mutation inventory rewrite may be introduced silently.**

## Tests (plan § T3 — the list is the specification)

Absent / empty / non-empty root initialization; missing manifest; pending and live creation
permutations; repeated operation identity; full-record replacement failures; corrupted JSON and
UTF-8; filename/ID mismatch; missing named task or consumer; unknown schema, kind or source;
archive tombstones; duplicate in-process root instances.

Separate record-vs-task revisions; stale receipt and pruning maintenance; writer-handle lifetime
and nesting; **callback failure after an earlier committed replacement — with no rollback claim**.
An unavailable external source registered as an unresolved reference, whose first observation
preserves identity and catalog metadata and **atomically establishes state plus obligations**.

Exact-fit and one-over counts and encoded bytes; old defaults versus stored policy; lower or
incompatible configuration; atomic limit-increase failure; valid-at-capacity reopen; **lost-response
registration retries with neither double-charge nor early release**.

**The crash acceptance matrix runs through the real Node FileTree path. No mocked successful store
substitutes for it.** Validate each crash window against design **§8.4**.

## Repo gates

- [ ] `rushx build` — **zero warnings**
- [ ] `rushx lint`; `rushx fixlint` before the final commit
- [ ] `rushx test` — 100% on all four metrics
- [ ] `code-reviewer` **before** closing coverage gaps
- [ ] `node common/scripts/install-run-rush.js rebuild`
- [ ] Change file, verified against the integration branch
- [ ] `CAPABILITIES.md` in the same PR; index row stays one line
- [ ] **Every step `.github/workflows/ci.yml` runs** — T1 lost a round to
      `generate-capability-feed.mjs --check`; its `result.md` has the nine-step list

## Five traps this stream's predecessors paid for

1. **A bounded array whose entries carry an identity needs a uniqueness constraint, not just a
   length cap.** T1 hit this three times in one loop, twice *after* fixing it once. T3 writes
   collections of claims, updates and operations to disk, where a duplicate is a corrupt ledger.
2. **A test comparing a constant to a constant looks like a guard and is not.** T1's round-4 test
   pinned two defaults equal and said nothing about the host-supplied case that actually broke.
3. **A review round that posts zero comments is not evidence of a clean diff** — read the
   summary's "previously missed" block, not the comment count.
4. **Symmetry holes.** T1's best finding was `encode` bypassing a converter `decode` ran. Yours:
   any write path that validates differently from the read path that must survive a crash.
5. **A regression test you have not watched fail is a guess.** F2 neutered fourteen protections one
   at a time; two "passed" because the mutation did not compile — and they were the two *flushes*.
   Apply the same discipline to every crash-window claim.

## Open questions, neither T3's to settle alone

1. **Executor-payload dereference** — may terminal presentation dereference an executor-owned
   payload after the broker update is retained or acknowledged? A §8.3 / **T6** / **T8** decision,
   carried to the design authority unanswered. It did not reach T1 or T2. **Storage is a plausible
   place for it to surface**; if it does, stop and surface it rather than encoding an answer.
2. **Source-history spelling.** §5 says `'latest-snapshot' | 'replayable-updates'`; §1 and §8.6 say
   `'observed-state'` and `'source-replay'`. T1 unified on §8.6. **T6** confirms. Follow T1 and say
   so if you must name it.
3. **`ts-utils` `isKeyOf`** calls `item.hasOwnProperty(key)` rather than
   `Object.prototype.hasOwnProperty.call(...)`, so `strictObject().convert()` **throws** rather
   than failing on a null-prototype object. `JSON.parse` never produces one, so wire data is safe —
   but T3 reads JSON from disk and may want to be sure of that boundary. Escalated by T1, unfixed.
   **Do not fold a `ts-utils` fix into this slice.**

## Exit artifact

T3 does **not** close the stream. Artifacts stay in `.ai/tasks/active/agent-tasks-t3/`. **Do not
run `/finalize-task`.**

`result.md` must carry: what shipped; **which T1 union members T3 exercised and any it revised**;
**the crash-window matrix, and which guarantee each test proves**; what was mutated and what went
red; and what a later slice must decide.

## Required reading, in order

1. `docs/design/agent-tasks/implementation-plan.md` § *T3* — the authority for this slice.
2. `docs/design/agent-tasks/development-design.md` **§8.3 (layout and commit units), §8.4 (crash
   windows), §8.5 (open, corruption and recovery), §8.6 (capacity)** — §8.4 is the one you validate
   each crash window against.
3. `.ai/tasks/completed/2026-09/filetree-atomic-write/result.md` — what the atomic boundary
   actually guarantees, on which filesystems, and on what evidence.
4. `libraries/ts-json-base/CAPABILITIES.md` § the atomic-write capability — `isAtomicAccessors`,
   `writeFileAtomically`, `cleanupAtomicTemporaries`, and the four things it separates.
5. `.ai/tasks/active/agent-tasks-t1/result.md` — the declared-vs-exercised table.
6. `libraries/ts-agent-tasks/` as it stands — T1's vocabulary and T2's context packlet.
7. `.ai/instructions/CODING_STANDARDS.md` § *Pre-PR Validation Checklist*.

## Missing-input rule

If any required-reading file does not exist, or any statement here does not match the tree, **STOP
and surface the gap.** Do not reconstruct missing context by inference.
