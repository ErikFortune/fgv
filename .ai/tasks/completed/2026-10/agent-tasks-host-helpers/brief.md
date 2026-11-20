# Brief: `agent-tasks-host-helpers` — trusted authority, resume, open-or-initialize, broker idle/guard/receipts

Orchestrator-owned; frozen at kickoff. Put questions in `state.md`.

**Origin:** personaility#698 (fgv-ask). The long form is
`.ai/notes/fgv-share/ASK-2026-10-23-agent-tasks-host-helpers.md` on personaility `working`. The sources
it extracts from are under `libraries/personaility/src/packlets/curate/ingestion*.ts` and
`services/personaility-hub/src/hub/ingestionWakeTasks.ts`. Read them only; never modify that repo.

**User decision (2026-10-26).** This stream ships slices B-3, B-7, B-4 and B-5 + F8 to `release`.
- The `WriteGate` (B-6) is a separate stream, in ts-extras `async-control`, after #697.
- The delivery pump (B-1) and deferred obligations (B-2) are a later stream on a separate,
  unpromoted branch.
- Do **not** build B-1, B-2 or B-6 here.

**Base / PR target:** `integration/asks`.

## Scope

New `host` packlet in `libraries/ts-agent-tasks`. It may import `broker`, `storage` and `types`.
`broker` must never import `host`. Broker primitives go in `broker`.

### B-3 `trustedKindAuthority`

```ts
trustedKindAuthority({
  kinds?,
  scopes?,
  scopeMatch?,   // see below
  actions,       // required, explicit; no default of "all"
  epoch
}): ITaskAuthorization
```

- `kinds` match exactly.
- Scope rules:
  - A request that **names** a task needs *some* of that task's scopes in the allowed set.
  - A create or subscribe request needs *every* requested scope inside the allowed set.
- The TSDoc must say it is for **trusted host principals only**, never for model-facing principals.
- The two PersonAIlity copies disagree on scope matching. Record which rule each one used.

### B-7 `resumePendingRegistration(taskId)` (broker)

- The pending inventory entry already stores the canonical creation request
  (`storage/repository.ts` ~1105-1115, `storage/model.ts` ~123-130).
- Rebuild the registration from it and **re-authorize `create` at the moment of the resume**. The
  design forbids storing a permission grant with the intent (`development-design.md` ~731).
- Withdrawing or recycling a pending identity is **out of scope**: that is a design change.

### B-4 `openOrInitializeTaskRepository`

```ts
openOrInitializeTaskRepository({
  root,
  fallback: 'refuse' | 'in-memory',
  …
}) → {
  state: 'ready' | 'recovery-required',
  repository,
  durability,
  placement: 'root' | 'in-memory',
  report
}
```

- Export the mode probe that `RecordStore` uses (`storage/recordStore.ts` ~60-79), and have both
  callers use it. That keeps the definition in one place, including the `atomicReplace` requirement
  the consumer probe misses.
- The emptiness test is fgv's own. A root that holds only atomic-write temporaries counts as empty,
  as `initialize` already treats it (`repository.ts` ~311).
- Fix the `CAPABILITIES.md` ~147 "no files" drift.
- Add an **optional** manifest field recording the mode the repository was initialized in.
  - Opening a durable-initialized root as `session` is refused unless an explicit opt-in is passed.
  - Old manifests without the field still open.
- An in-memory fallback is always labelled in `placement` and `report`.
- Building the broker stays with the host.

### B-5 / F8 / F3 broker primitives

- **`broker.whenIdle(timeoutMs)`**
  - Resolves when the broker's `WriterQueue` is empty and no gated section is active.
  - **Never takes the writer.**
  - Uses an injected `schedule` (same shape as ts-extras `async-control`:
    `(fn, ms) => cancel`, defaulting to `setTimeout`).
  - Returns a classified timeout.
  - It describes a moment, not a hold. Say so.
- **Optional structural `writeGuard?: { guard<T>(w: () => Promise<TaskResult<T>>): Promise<TaskResult<T>> }`
  on `TaskBroker.create`.**
  - Apply it inside `BrokerCore.gated`, around `withWriter`, so every broker write is covered:
    tools, source passes, `cleanup`.
  - Document that a long pause fills the 64-waiter queue, after which callers get `conflict`.
- **`issued()` on the bound delivery.** Lists the subscription's unacknowledged issued receipts, so a
  host can find receipts left behind by a crash.
  - A `releaseStale` that abandons only receipts from a previous open generation is in scope **if** the
    repository exposes an open generation. If it doesn't, record that and leave it.

## Ordering surface — required evidence

agent-tasks is an authorization and ordering boundary (see CODING_STANDARDS § *Authorization boundaries…*).

- In `result.md`, enumerate every check-then-act window you introduce and what re-checks after it. At
  minimum:
  - resume: authorize → commit;
  - open-or-init: probe → open/initialize;
  - whenIdle: observing the queue vs. a newly enqueued write;
  - the guard: around `withWriter`;
  - `issued()` vs. a concurrent acknowledge.
- Add a revert matrix: for each guarantee, the test that goes red when it is reverted, and show it red.

## Acceptance

- [ ] Tests for each slice, using Result matchers. New behaviour is shown red first.
- [ ] Run `runTaskRepositoryConformance` against anything that touches the repository.
- [ ] `CAPABILITIES.md`, README, `api.md` and change files updated. Change files are `minor`; all of this
  is additive on an active surface.
- [ ] Gates:
  - package build, lint and test at 100%;
  - repo-wide `rush rebuild` and `rush test`;
  - `change --verify --target-branch origin/integration/asks`;
  - prettier 2.8;
  - `verify-capability-docs`.
- [ ] Close out per `finalize-task` to `.ai/tasks/completed/2026-10/agent-tasks-host-helpers/`, with a
  ledger entry (`#TBD`) and the feed.

## Mechanics

Work in your own worktree. Push only to `agent-tasks-host-helpers`; open no PR. Commit before the gates.
Run the gates in the foreground with per-worktree log paths. No sub-agents.
