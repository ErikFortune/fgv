# State — `agent-tasks-t9`

**Purpose of this file.** If the session crosses a context boundary, `brief.md` plus this file must
be enough to resume cold. Keep it current as you go.

---

## Status

**Reviews done, coverage closed; revert matrix running; PR next.** (2026-09-27.) Head `c5e4ceb7`:
85 suites, **1,968 passed / 0 failed**, 100 % on every metric, zero `c8 ignore`, lint clean,
`fixlint` no-op. Layer 1 and the semantic antagonist both ran on `e55f0d5e`; the antagonist's seven
findings (H1, M1–M4, L1, L2) are fixed in `c5e4ceb7`, each with a regression. `result.md` drafted.
Next: revert matrix on the final source (`perf/mutationMatrix.js`, T9 rows T9-1…T9-32 added) →
repo-wide rebuild/test + verify scripts → PR into `integration/agent-tasks-v1` → plan status line
and ledger entry as shipped → Copilot loop.

## Branch

- `claude/agent-tasks-t9`, cut from `integration/agent-tasks-v1` at `ea6b6f38b` — the `release`-up
  merge following T8's close, so the base carries #700 as well as T8.
- PR targets `integration/agent-tasks-v1`, **not `release`**.
- Artifacts stay in `.ai/tasks/active/agent-tasks-t9/`. This family finalizes at **cluster close**;
  do not run `/finalize-task`.

## What is on this base

| slice | landed | PR |
|---|---|---|
| T1 package, values, converters, registry | ✅ | #684 |
| T2 pure context, snapshot-only use | ✅ | #685 |
| T3 FileTree records, durable commit, reopen | ✅ | #686 |
| T4 indexed selection, paging, due/owed discovery | ✅ | #687 |
| T5 bound authority, tracked hierarchy, reassignment | ✅ | #691 |
| T6 source adapters, commands, reconciliation | ✅ | #693 |
| T7 subscriptions, exact receipts, acknowledgement | ✅ | #695 |
| T8 PR 1 retention, disposition, closure, pruning | ✅ | #698 |
| T8 PR 2 A3 journeys, M1, the capacity profile | ✅ | #699 |

Plus, from `release`: the `hasOwnProperty` null-prototype fix and `no-prototype-builtins` (#700).

**T8 is closed, so the capacity model is settled.** The default profile now admits **536 plain
registrations, bound by `logical-bytes`** — not the 1,000 `non-archived-tasks` it advertises.
That figure is pinned by a test and documented at the profile site; your saturation work inherits it.

## Verification standing at branch time

Orchestrator re-ran on T8 PR 2's final source, independently of its claims:

- `rushx test` → 72 suites, **1,791 passed, 0 failed**, 100 % on every metric, zero `c8 ignore`,
  zero warnings.
- Phase 0's figures exact: `storage/repository.ts` 1993 → **1808** at the extraction commit, with
  `etc/ts-agent-tasks.api.md` byte-identical across it. The only api.md delta across the whole PR is
  the new `maximumUpdateBytes` export.
- The 536 figure is pinned by an executable test that registers until refusal and asserts the
  refusal is on `logical-bytes`.

## A correction worth carrying, because it was the orchestrator's

The capacity table in T8b's brief said 384 MiB made 1,000 reachable "in every mix we model." It did
not: the table modelled `resident-payload-bytes` alone, and once that was raised six-fold,
`logical-bytes` became the binding dimension at 537. The information was in T7's own `result.md`
and was not carried through.

T8b caught it only because the brief told it to reproduce the arithmetic rather than trust it. **The
same instruction is in your brief, and it applies to every number there.**

## Work log

### 2026-09-27 — required reading done; no gap found

Brief, design § 10 (and §§ 4–8 where § 10 leans on them), plan § T9 / A2 row / gate row 9,
`docs/TECH_DEBT.md` T5 (4) and T6 (4) hand-offs, T5/T6/T8/T8b `result.md`. Every file exists and
each plan section says what the brief claims. Numbers reproduced from source rather than trusted:
the default profile constants in `types/capacityProfile.ts` match the 536 / `logical-bytes` claim's
inputs (976 KiB closeout per registration against 512 MiB); the executable pin is T8b's test.

### Design decisions (the working model — see result.md for the final record)

**Where the intent lives.** `IResolvedTaskCommitRecord.stops?: ReadonlyArray<IStopIntent>` on the
root's own record (design § 8.3 has `stop?: IStopIntent`; an array because § 10 says overlapping
intents are represented independently — at most one *latching* intent per mode per root). Released
and settled intents stay in the array as evidence. The intent is **not** envelope state: a stop
changes no semantic revision, and public lifecycle keeps describing the root's own execution
(§ 10 step 3: "No status field falsely represents tree-wide completion").

**Latching states.** `pending | blocked | satisfied` latch; `released | settled` do not.

**Where the freeze is enforced: storage, under the writer.** Every broker path funnels into
`writer.commit` / `writer.register`, so the repository refuses (operation-purpose commits only —
a source observation is authoritative and exempt):
- a registration whose parent is latched; a parent change of a latched task or into a latched task;
- a lifecycle move to `running`, or out of the latch's required stopped set, on a latched task;
- a new external command op on a latched task, or a marker-less op squatting on a live attempt id;
- `complete-list` on a latched list (T5 hand-off 4);
- a stop-marked op that is not a live, unlanded attempt of a latching intent (no dispatch after
  release, structurally);
- intent evolution that drops, re-identifies or forges an intent; a new intent whose targets are
  not exactly the authoritative subtree (root first, then breadth-first by id).
The latch book is part of the `TaskIndex`, so open and `rebuildIndexes` rebuild it from records
**before** the repository accepts any write. The broker also pre-checks for clear refusals
(`stop-active` receipts), but storage is the guarantee.

**Stable per-target command ids: minted and persisted, not derived.** § 10 asks for tuple encoding
of `(intent, target, mode, attempt)`; two 128-char ids cannot fit the 128-char operation-id bound.
The property that matters — the same key across restarts — comes from persisting the minted id in
the root intent before any dispatch. The target's stored command carries a `stop` marker
`{ rootId, intentId }` so a landing is recognized only when both the id and the marker match.

**Capacity (A3), derived rather than stored — the same "derived and discardable" rule the ledger
already follows.** Per target, a bundle `B` = one operation + `maxStoredOperationBytes` +
`maximumSettlementCharges` (covers a native pause/cancel commit, and an external intent commit
plus the settlement claim T6 mints for it). For each latching intent's *unlanded* attempt, the
root's ledger entry reserves `B`'s additive dimensions and the target's entry reserves `B`'s
`record-bytes` (that dimension is per record). A landing commit on the target is admitted with
both entries changed in one vector check, so it nets to zero. Root-side headroom — the intent's
maximum encoded growth plus one release operation — is also derived from the root record. The
per-task operation cap holds a slot per unlanded attempt and per latching intent's release.
Subscription delivery units add one per unlanded attempt on a covered task. Nothing here is a new
claim purpose; open recomputes all of it from records.

**Acceptance ≠ completion.** `requestStop` persists the intent with every target `unexamined` and
returns `pending`; it dispatches nothing. `reconcileStop` is the bounded host pump. Satisfaction
needs a pass that visited every target and found each `confirmed`; presentation degrades live when
a confirmed target's current record left the stopped set, and withholds `satisfied` for an intent
relying on external stable-stop evidence until this broker instance has revalidated it.

**Sources.** `ITaskSource.capabilities?` is optional: absent means nothing is stoppable
(`unsupported`). Capabilities name the stop command and its parameters (`pauseCommand` /
`cancelCommand`) instead of § 5's `commands: string[]`, because the kind registry is already the
command authority (T6) and a stop needs parameters, which a name alone cannot supply.

**Lists.** A list has no own work: as a pause target it is confirmed without a command; as a cancel
target it is cancelled.

**Deferred and routed:** explicit abandonment of a blocked cancel (§ 10 step 8 "may record") —
archive of such a root is simply `retention-blocked`.

**Revisions made while testing (each caught by a test):**
- Archived descendants would each have reserved a full attempt bundle they can never use; the book
  now funds only attempts that could still land — not landed, target not archived, target not
  confirmed. A confirmed external target that restarts is re-stopped under a *new* attempt (new
  admission). `StopBook.recount()` after open's first pass, because a root may be indexed before
  its archived targets.
- Superseding a target of a `satisfied` intent must move the intent back to `pending` (the record
  converter refused `satisfied` with an unconfirmed target).
- A terminal external target is confirmed before any source call (a source with no declaration
  must not make a terminal target `unsupported`).
- A conflict-rejected attempt refreshes the task from its source before the new attempt, or the
  new attempt would carry the same stale precondition.
- The resident book keeps a coordination projection of each latching intent (ids, keys, confirmed
  flags, encoded size) — not the full intent with its evidence (design § 7).

**Capacity figures reproduced (not trusted):** attempt bundle 643,625 logical bytes / 627,241
record bytes / 37,417 resident under the default profile; max target encoding 1,834 B, intent
framing 6,538 B. Executable pin: 400 plain registrations admit a stop over at most **211** of them,
refused on `logical-bytes`. Arithmetic estimate (not pinned): a stop over an entire repository of
*n* plain tasks fits for n ≲ 325.

## Open questions for the orchestrator

_(raise here and surface, rather than reconstructing intent and proceeding)_

Two are anticipated:

1. **The M1 stop-state cohort.** The plan schedules it after T9. The harness exists and its
   prediction manifest is frozen. Adding a cohort is a harness change — say so rather than doing it
   quietly, and if you judge it belongs to P1 instead, say that.
2. **Whether the A2 semantics need a design amendment.** A2 is approved and explicit, but it was
   written before T6's sources and T8's capacity model existed. If a stop cannot be expressed within
   it, the plan's own instruction applies: *"amend the design openly rather than weaken guarantees."*
