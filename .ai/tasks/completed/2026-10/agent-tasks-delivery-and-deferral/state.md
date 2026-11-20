# State: `agent-tasks-delivery-and-deferral`

Worker-owned working surface. The brief is frozen; questions and interpretations live here.

Base: `origin/agent-tasks-delivery-and-deferral` @ `3d873bcc0` (brief commit over
`integration/agent-tasks-host` @ `03f91abec`, which is #758).

## Interpretations taken (brief was silent or ambiguous)

1. **Placement: the existing `host` packlet.** #758 created it for exactly this audience — host-side
   plumbing over the broker and storage — and a new packlet would have the same boundary and the
   same imports (`broker`, `converters`, `types`). Recorded in `result.md`.
2. **The due pass needs an authorized, indexed read, and none existed.** `queryDue` is on
   `ITaskRepository` only; a bound view had `query` and `inspect`. The brief requires both "never
   bypasses authorization" and "uses the indexed `queryDue`, never scans", so `IBoundTaskView` gains
   `queryDue` — the bound `query` contract over the due index. That widens an interface others
   implement (`BREAKING (implementers only)`); the only implementations in the monorepo are
   `BoundTaskView` and eleven structural test doubles in `src/test/unit/tools/`, all updated.
   `samples/testbed` consumes `IBoundTaskView` and implements none of it.
3. **The guard type.** The brief's shape is over plain `Result`; the broker's `ITaskWriteGuard` is over
   `TaskResult`. A separate structural `ITaskHostWriteGuard` keeps the brief's shape; a gate written
   over plain `Result` satisfies both.
4. **One binding for the pump.** The pump takes the `bindDelivery` binding and binds the delivery
   itself, so its deliveries and its disposals are always under the same principal and policy —
   PersonAIlity passed the delivery and the binding separately, which could diverge.
5. **A committed decision is not a failure.** Once `acknowledge` commits, the release and the
   superseded disposal are follow-ups: their failures go into `issues` and the call succeeds.
   PersonAIlity failed the call, which invites a retry of an acknowledgement whose receipt is gone.
6. **Times are epoch milliseconds in, canonical instants out** — the helper does arithmetic on them
   (backoff, cutoffs); stored and read values stay `Instant`.
7. **No resident retry state.** The schedule is `retry(obligation, now)`, pure advice; a `hold` is
   the host's to keep in memory, as PersonAIlity's hub does (`hub/ingestionWakeTasks.ts:58-71`).
8. **Deterministic operation ids** (`<taskId>.create`, `.r<expectedRevision>`, `.archive`) instead of
   minted ones, so a write whose response was lost replays its stored receipt. This is what makes a
   retry of `cancel` after a failed archive finish rather than conflict.
9. **`merged` re-reads its survivor.** The caller's copy of `into` can be stale; deciding on it could
   cancel an obligation into a survivor already settled.
10. **Sweeps carry on.** `abandonPending` and `archiveSettled` answer `{ done, issues }` rather than
    failing at the first task that moved, because a task that moved is exactly the case the sweep
    must leave alone.

## Checkpoint

- [x] Read brief, ask § Contracts and tests, PersonAIlity B-1/B-2 sources and the hub budget note.
- [x] Read #758 `result.md` (check-then-act table, five review rounds).
- [x] `IBoundTaskView.queryDue` + converter + tests; eleven tool-test doubles updated.
- [x] `TaskDeliveryPump`, `DeferredObligations`, `ITaskHostWriteGuard`; tests; 100% coverage.
- [x] Revert matrix: 22 rows, each red.
- [x] Docs: package `CAPABILITIES.md`, index shortcuts, change file (`minor`).
- [x] Gates (see `result.md`).
- [x] Close-out: migrated, README, meta, ledger, feed.

## Open questions for the orchestrator

- **Repo-wide `rush test` cannot finish in one foreground call here** (the tool's limit is ten
  minutes; the suite is longer). It was run as one interrupted full run plus three `--only` groups
  that together cover all 39 operations, each graded by exit code and grep. Details in `result.md`.
- **Two pumps on one subscription** are safe (every id ends in exactly one history list) but not
  efficient: each prepares the same top revision. A host wants one pump per subscription.
