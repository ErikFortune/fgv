# agent-tasks-t8 — Retention, backpressure and recovery journeys (PR 1 of 2: the retention mechanism)

**Shipped**: 2026-09-26 via [PR #698](https://github.com/ErikFortune/fgv/pull/698) into `integration/agent-tasks-v1` (finalized at the agent-tasks cluster close, 2026-10-01).

> Slice T8 shipped in two PRs. This record covers PR 1 only. The A3 saturation journeys, the M1
> cohort run and the capacity-profile change are `agent-tasks-t8b` ([#699](https://github.com/ErikFortune/fgv/pull/699)),
> and T8's acceptance criteria are met only by the two together.

## Summary

T7 left every task covered by a matching subscription permanently `retention-blocked` at archive,
because nothing pruned a stored audience. T8 PR 1 replaced that with a retention rule in storage: an
owed update leaves its record only when every audience member's durable checkpoint — read through the
checkpoint store and fingerprint-verified, never the resident index — holds its exact id as
acknowledged or disposed. Archive now works under subscriptions and writes a payload-free tombstone.
Hosts can dispose obligations, close subscriptions, abandon commands whose outcome is unknown and
prune discharged payloads, each authorized and recorded, and `ITaskRepository.outstanding()` names
every incomplete operation.

## Files changed

All code is in `@fgv/ts-agent-tasks` (61 files under `libraries/ts-agent-tasks`).

- `storage/retention.ts` (new) — `checkRetention`, run on every commit; `storage/graphRules.ts`
  (new; graph/profile rules moved out of `repository.ts` to stay under the 2,000-line lint cap);
  `commitRules.ts`, `consumerRecords.ts`, `deliveryBook.ts`, `subscriptions.ts`, `taskIndex.ts`,
  `openRepository.ts`, `conformance.ts`.
- `broker/disposition.ts` (new), `broker/retention.ts` (new), `broker/taskBroker.ts` —
  `dispose`, `closeSubscription`, `abandonCommand`, `cleanup`; replay cursor stop in
  `broker/reconciliation.ts`.
- `types/delivery.ts`, `types/commands.ts`, `types/storage.ts`, `types/updates.ts` and their
  converters — consumer `state`/`disposed`, `coalesceProgress`, the `abandoned` receipt state,
  `isRequiredCategory`.
- Docs: the host runbook in `libraries/ts-agent-tasks/CAPABILITIES.md`, `etc/ts-agent-tasks.api.md`,
  `.ai/instructions/LIBRARY_CAPABILITIES.md`, `docs/TECH_DEBT.md`, the plan's T8 line and a
  development-design note, and a change file.

## Decisions made during execution

- **The split.** The brief asked for a split to be raised if the mechanism was separable from the
  saturation matrix and profile qualification. It was raised in `state.md` § *Split proposal* and
  accepted: this PR is the mechanism, runbook and reviews; A3 journeys, profile decision and M1 went
  to `agent-tasks-t8b`.
- **Two ways an obligation ends**: acknowledgement (T7) or a host disposition with a recorded reason.
  `dispose` / `closeSubscription` / `abandonCommand` live on `TaskBroker`, not on a bound writer or
  view, and also require the policy's `dispose-obligation`.
- **Removed a latent "drop it and free the slot" path**: `checkUpdates` let any `maintenance` commit
  drop an owed required update with no evidence. Pinned by `storage/pruning.test.ts` tests that were
  red on the base.
- **Source-replay registration gap: enforced, not detected.** An unregistered binding stops the pass
  with the cursor unmoved, because a gap report would describe a loss rather than prevent it.
- **T7/T3 tests re-decided per test** (result.md § *What unblocks `archive`*): the "blocked even once
  fully acknowledged" test is inverted; others survive or change.
- **Profile arithmetic, no profile change.** (a) "charge actual" is not available for a forward
  reservation; a new finding bounds any update at 37,417 B, so 64 KiB is unreachable. Recommended
  (d) reserve the derived maximum plus (c) advertise a reachable limit; the published profile was
  left unchanged for the design authority (the decision taken in `agent-tasks-t8b` was (d) plus a
  raise, not (c)).
- Declined in Copilot round 1: a migration for T7-written consumer records (package unpublished).

## Followups

- A3 saturation journeys, profile decision, M1 cohorts and T7's subscription-record inconsistency →
  `agent-tasks-t8b` (delivered; the TECH_DEBT "second body of work" entry is retired).
- Stop latch on list completion and relationship operations → T9 (resolved by `agent-tasks-t9`
  per `docs/TECH_DEBT.md`).
- Coalescing still treats an expired unacknowledged manifest as a pin (`state.md` § *Independent …
  antagonist*). The general "pin evidence ignores `expiresAt`" behaviour is now a P3 in
  `docs/TECH_DEBT.md` (added by `agent-tasks-t8b`).
- Layer-1 P3.6 — a shared decoder for `_taskOf`'s hand-decoded update id — was called "a follow-up"
  in `state.md` and is **recorded nowhere durable**.
- **Index repair**, named in the brief's mission, is not addressed by name in result.md or state.md.

## Lessons codified during the run

- Write the falsifier first: two `storage/pruning.test.ts` tests were red on the base before the
  retention rule existed, which is how the unguarded maintenance drop was found.
- An independent persistence/delivery antagonist found one MED (expired receipts still pinned at
  disposal) that layer 1 had not. `agent-tasks-t8b`'s brief carried forward that rounds 2 and 3 of
  this PR's Copilot loop had real findings only in their "previously missed" block.

## References

- `brief.md`, `state.md` (layer-1, antagonist and Copilot round detail), `result.md` (this directory)
- [PR #698](https://github.com/ErikFortune/fgv/pull/698)
- Siblings: `agent-tasks-t8b` (PR 2 of this slice), `agent-tasks-t7`, `agent-tasks-t6`, `agent-tasks-t9`
