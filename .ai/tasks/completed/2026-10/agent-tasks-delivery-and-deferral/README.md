# agent-tasks-delivery-and-deferral — the host's delivery and deferral loops

**Shipped**: 2026-10-26 into `integration/agent-tasks-host` via #TBD. Not promoted to `release` with
the asks batch, per the user's decision of 2026-10-26: the shape may still need revision.
Package: `@fgv/ts-agent-tasks` (`host` packlet; `broker`, `converters`, `types` for `queryDue`).
Origin: personaility#698 (fgv-ask), slices B-1 and B-2. Change file typed `minor`
(`BREAKING (implementers only):` — `IBoundTaskView` widened).

## Summary

The two loops PersonAIlity's hub runs over the task catalog, generalised into the library as
host-driven bounded calls — no timers, no resident loop:

- **`TaskDeliveryPump`** drains one subscription a revision at a time: `next` prepares one owed task
  revision, rendered **owed-only** so a task owed nothing can never block another; the host
  acknowledges it after its own work commits (or abandons, or disposes of it with a reason). It never
  acknowledges on its own, is at-least-once, and decides from its own record of what it handed out.
  Older revisions are disposed of after a **terminal** discharge only.
- **`DeferredObligations`** keeps a durable retry obligation for a busy recipient as a waiting tracked
  task with `notBefore`, keyed by `(changeRef, role)` → a deterministic id. `defer` is create-then-wait
  and finishes after a crash either way it can be interrupted. `due` reads the due index. `retry`
  advises the next step from a configurable schedule and the task's operation budget.
- **`IBoundTaskView.queryDue`**: the bound `query` contract over the due index, so the due pass is
  both authorized and indexed. **`IBoundTaskDelivery.prepare(budget, { currentState: 'owed-only' })`**:
  render only what is owed.
- **`ITaskHostWriteGuard`**: an optional gate around each helper call, composed with — not instead of
  — the broker's `writeGuard`.

## What a reader should know

- **Exactly-once is not the pump's property.** At-least-once plus a host whose work is findable by
  `(taskId, revision)`.
- **Release crash-left receipts at start-up** (`issued()` then `abandon`). Otherwise each blocks
  `dispose`, the superseded disposal, the task's archive and pruning of what it names — and expiry
  alone does not end that.
- **Review round 1** found the pump could stick for good behind a task owed nothing; fixed by the
  owed-only prepare mode. See `result.md` § *Review round 1*.
- **Do not give one pausing gate to both layers** — the helper guard and the broker's `writeGuard`.
- **`merged` has one residual window**: a concurrent writer settling the survivor between its re-read
  and the cancel. The host's pass should be the only writer of its obligations.
- **Repo-wide `rush test` was run in parts** (a ten-minute tool limit); all 39 operations covered.

## Artifacts

- `brief.md` — the frozen contract
- `result.md` — placement and API decisions, per-helper surface, the check-then-act table, the
  22-row revert matrix (each row red), the ask's contract tests mapped to tests, deviations, gates
- `state.md` — interpretations and open questions
- `meta.yaml` — the index record
