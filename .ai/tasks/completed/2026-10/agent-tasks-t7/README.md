# agent-tasks-t7 — Subscriptions, exact issued receipts and acknowledgement

**Shipped**: 2026-09-26 via [PR #695](https://github.com/ErikFortune/fgv/pull/695) into `integration/agent-tasks-v1` (finalized at the agent-tasks cluster close, 2026-10-01).

## Summary

Slice T7 of `docs/design/agent-tasks/implementation-plan.md`. Before T7 the broker's audience seam
answered "nobody", so no task update was ever owed to anyone. T7 filled it: a host subscribes a
consumer to a task selection with a persisted delivery policy and an optional `current` baseline;
storage computes every accepted update's audience and charges its acknowledgement evidence inside
the accepting commit; a bound delivery prepares a context whose exact receipt manifest is committed
before the context is returned; and acknowledgement adds exactly the update ids an unexpired issued
receipt named — never a revision watermark — through a checkpoint store that is read back and fenced
rather than believed.

## Files changed

All code is in `@fgv/ts-agent-tasks` (74 files under `libraries/ts-agent-tasks`).

- `types/delivery.ts` — `ITaskDeliveryPolicy`, `ITaskSubscriptionSpecification`,
  `ITaskConsumerRecord`, `IIssuedTaskReceipt`, the synchronous `ITaskCheckpointStore` port, and the
  broker delivery surface; converters in `converters/deliveryConverters.ts`
  (`TaskConverters.delivery`).
- `storage/` — new `checkpoints.ts` (default `FileTreeCheckpointStore`), `consumerRecords.ts`,
  `deliveryBook.ts`, `subscriptions.ts`, `sourceRecords.ts`; `openRepository.ts` reads and joins
  every consumer record at open; `repository.ts`, `commitRules.ts`, `claims.ts`, `ledger.ts`.
- `broker/delivery.ts` (new) and `broker/taskBroker.ts` — `TaskBroker.subscribe`,
  `TaskBroker.bindDelivery`, `ITaskDeliveryDefaults`.
- Docs: `libraries/ts-agent-tasks/CAPABILITIES.md` (delivery section), `etc/ts-agent-tasks.api.md`,
  `.ai/instructions/LIBRARY_CAPABILITIES.md`, `docs/TECH_DEBT.md`, the plan's T7 status line and a
  development-design note, and a change file.

## Decisions made during execution

- **Storage owns audience.** An update of category `C` is owed to active subscription `S` iff
  `C ∈ S.policy.categories` and `S`'s selection matches the task's state before **or** after the
  commit, so open-only and filtered subscriptions keep their exit updates. A commit whose audience
  differs from storage's recomputation is `invalid`.
- **Spend, not mint.** Each audience link adds 1 `acknowledgement-ids` and 512 B of
  `logical-bytes`; on protected steps that growth is paid from the task's own claims, so the net
  repository-wide change is zero (`accounting.test.ts`, *"… one charge, not two"*).
- **`ITaskCheckpointStore` is synchronous**, because the whole storage layer is; recorded as a
  deviation from the design sketch.
- **`subscription-activation` replaces T1's unused `subscription-acknowledgement` purpose**; the
  owed reservation is derived rather than stored per link.
- **Potential-audience cap**: at most 32 active subscriptions may match a non-archived task; a 33rd
  is `backpressure` on `audience-links`.
- **Ceiling arithmetic** (result.md § *Reservation arithmetic*): resident ceiling unchanged at 146
  (128 with one in-flight command); `logical-bytes` binds at 448 and `acknowledgement-ids` at 892;
  with `k` `current` subscriptions the worst case is ⌊64 MiB / (448 KiB + 64 KiB·k)⌋ — 128 for
  k = 1, 113 with one in-flight command as well.
- Declined in Copilot round 4: a migration for T6-written stored profiles (package unpublished,
  active-development surface).

## Followups

All four hand-offs went to `docs/TECH_DEBT.md` (*delivery hand-offs T7 left for T8*):

1. Archive `retention-blocked` for every covered task even when fully acknowledged — resolved by
   `agent-tasks-t8`.
2. `maxConsumerRecordBytes / 512 B` (16,384) below `maxAcknowledgementIdsPerSubscription` (50,000)
   — resolved by `agent-tasks-t8b` (consumer record bound and `record-bytes` raised to 32 MiB);
   the TECH_DEBT entry listed item (2) as open until the cluster close struck it through (2026-10-01).
3. Closure / disposition / `coalesceProgress` — resolved by `agent-tasks-t8`.
4. Baseline payloads holding resident bytes until acknowledged — resolved by `agent-tasks-t8`.

## Lessons codified during the run

- **Quote a suite and a total, not a bare ratio.** The neutered-checkpoint-store figure was first
  reported as "22 of 28"; an orchestrator re-run on the final source gave **26 of 33** tests in
  `delivery/checkpoints.test.ts`. result.md records the correction, and the T8 and T8b briefs carry
  it as a named trap.
- Two revert rows (M8, M22) turned nothing red on the first run and were strengthened until they did
  — the family's standing "re-run before you claim it" rule paying off again.
- Every real Copilot finding (rounds 1–4) was an ordering or custody defect behind a check that was
  already present, matching the authorization-boundary guidance in `CODING_STANDARDS.md`.
- A lint warning introduced by the commit hook's prettier pass after local lint turned the round-1
  head red; lint now runs on the committed tree before pushing.

## References

- `brief.md`, `state.md`, `result.md` (this directory)
- [PR #695](https://github.com/ErikFortune/fgv/pull/695)
- Siblings: `agent-tasks-t5`, `agent-tasks-t6` (predecessors), `agent-tasks-t8`, `agent-tasks-t8b`
  (successors)
