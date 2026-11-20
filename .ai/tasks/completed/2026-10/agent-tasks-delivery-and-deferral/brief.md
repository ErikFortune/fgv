# Brief: `agent-tasks-delivery-and-deferral` — delivery pump (B-1) and deferred-obligation tasks (B-2)

The orchestrator owns this brief, and it is frozen at kickoff. Put questions in `state.md`.

**Origin:** personaility#698, slices B-1 and B-2 (fgv-ask). The long form is `.ai/notes/fgv-share/ASK-2026-10-23-agent-tasks-host-helpers.md` on personaility `working`. Read § "Contracts and tests we would want" for both items.

The sources being generalised live on personaility `origin/working` and are read-only:
- `libraries/personaility/src/packlets/curate/ingestionWakeups.ts:126-379` (B-1);
- `libraries/personaility/src/packlets/curate/ingestionWakeTasks.ts:345-822` (B-2);
- `hub/ingestionWakeTasks.ts:58-71`, for the reasoning behind the capped-retry budget.

**User decision, 2026-10-26:** these two land on a **separate branch**, `integration/agent-tasks-host`. That branch is cut from `integration/asks` after `agent-tasks-host-helpers` (#758) landed. It is **not** promoted to `release` with tonight's batch, because the shape may need revision. The PR target is `integration/agent-tasks-host`.

**Packages:** `@fgv/ts-agent-tasks` only, in a new packlet or the existing `host` packlet. Pick one and justify it in `result.md`.

## Shape (decide the details and record them)

Both helpers are **host-driven, bounded operations: no timers, no resident loop.** Each accepts an optional structural write guard `{ guard<T>(write: () => Promise<Result<T>>): Promise<Result<T>> }` and routes every write through it. Leave the guard optional; the broker's own `writeGuard` already wraps writes, so say how the two compose.

- **B-1 `TaskDeliveryPump`** (over `IBoundTaskDelivery` / `TaskBroker` `prepare` / `acknowledge` / `abandon` / `dispose` / `pending`):
  - `next()` prepares one owed revision, with a budget of 1.
  - A render with no owed update is released, and its superseded revisions are disposed. This is bounded, and it fails loudly when it clears nothing.
  - `acknowledge`, then release the receipt.
  - `abandon`.
  - `dispose(reason)` releases the receipt first.
  - After a **terminal** discharge only, dispose the task's older owed revisions.
  - It never acknowledges on its own. It is at-least-once: a prepared revision that is neither acknowledged nor disposed is presented again.
  - Document that **exactly-once is not this helper's property**. It is at-least-once plus a host opener that finds an already-committed turn by `(taskId, revision)`. Also document what happens to a stale receipt a crash leaves behind: dispose is refused until it expires.
- **B-2 `DeferredObligations`** (over tracked tasks with `notBefore`):
  - Each task is keyed by `(changeRef, role)`, which maps to a deterministic tracked-task id. Two roles never share a task.
  - `defer` creates the task, then waits on it with `notBefore`. It is idempotent if the process crashes between the two steps. The resumable creation in #758 should make this straightforward; use it.
  - Operations: `stateOf`, `wait` / `succeed` / `cancel`, and `merged(into)`, which cancels and references the surviving task.
  - `abandonPending(before)` touches only tasks left `pending` before the cutoff.
  - `due(now)` uses the indexed `queryDue` and never scans.
  - Also `waiting()` and `archiveSettled()`.
  - The operation budget per task is respected.
  - Generalise the ids, namespaces, codes, backoff, day bound and recipient roles into options. None of PersonAIlity's names belong in the library.

**Authorization:** both helpers go through a bound view or broker that the caller supplies. They never bypass authorization. Where a trusted principal is needed, document `trustedKindAuthority` (#758) as the way to get one.

## Required evidence

This is an ordering and authorization surface; see CODING_STANDARDS § authorization boundaries. `result.md` must cover:
- every check-then-act window: prepare vs. a new revision arriving, acknowledge vs. dispose, terminal-discharge disposal vs. a concurrent revision, and defer's create vs. wait across a crash;
- a revert matrix with every row shown red;
- the PersonAIlity contract tests listed in the ask, each mapped to a test.

## Acceptance

- [ ] Tests use Result matchers and are red first. Any crash simulation goes through the repository's existing fault seams.
- [ ] Gates pass:
  - package build, lint and test at 100% coverage;
  - repo-wide `rush rebuild` and `rush test`, graded by exit code and grep;
  - `change --verify --target-branch origin/integration/agent-tasks-host`;
  - prettier 2.8;
  - `verify-capability-docs`.
- [ ] `CAPABILITIES.md` updated, plus an index shortcut. Change file `minor`.
- [ ] Close-out per `finalize-task` to `.ai/tasks/completed/2026-10/agent-tasks-delivery-and-deferral/`, with a ledger entry (`#TBD`) and the regenerated feed.

## Mechanics

Use your own worktree. Push only to `agent-tasks-delivery-and-deferral`, and open no PR. Commit before gating. Run gates in the foreground, with log paths specific to your worktree. Do not use sub-agents.
