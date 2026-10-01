# agent-tasks-t6 — source adapters, commands and reconciliation

**Shipped**: 2026-09-25 via [PR #693](https://github.com/ErikFortune/fgv/pull/693) into `integration/agent-tasks-v1` (finalized at the agent-tasks cluster close, 2026-10-01).

## Summary

Slice T6 of the agent-tasks plan made work run by an external executor trackable without the
broker ever owning its truth. `ITaskSource` and the typed `ExternalTaskSource` helper feed
observations, which are ordered by the source's own revision comparator. Reconciliation is paged,
and its checkpoint cursor commits only after every projection in the page has committed. Recovery
handles every recovery outcome.

External commands:

- reserve their settlement before dispatch
- record *accepted* apart from *applied*
- send only from the caller that wrote the `possibly-sent` marker
- are held rather than resent when the outcome is uncertain and the command is non-idempotent

The deterministic `SimulatedExecutor` really applies commands: making its `_apply` a no-op turns 18
tests red. The slice closed both carried questions:

- **Source-history spelling:** § 8.6's `'observed-state' | 'source-replay'` is confirmed.
- **Executor-payload dereference:** T6 was built against the "no" decision and found it sound.

## Files changed

All in `libraries/ts-agent-tasks` (`@fgv/ts-agent-tasks`):

- **Types:** `types/sourceAdapter.ts` (new); `source.ts`, `storage.ts`, `registry.ts`,
  `commands.ts` and `broker.ts` (extended).
- **Converters:** `converters/sourceConverters.ts` (new); `storageConverters.ts`,
  `capacityConverters.ts`, `kindRegistry.ts` and `primitives.ts` (extended).
- **Implementations:** `implementations/externalSource.ts` (new).
- **Broker:** `broker/externalCommands.ts`, `observations.ts` and `reconciliation.ts` (new).
  `taskBroker.ts`, `commands.ts`, `creation.ts` and `core.ts` are extended.
- **Storage:** `storage/executionClaims.ts` (new). `claims.ts`, `commitRules.ts`, `repository.ts`,
  `openRepository.ts`, `model.ts` and `taskIndex.ts` are extended to add the source checkpoint
  record, `unsettledCommands`, the two new claims, and the health-only observation commit.
- **Tests:**
  - `test/helpers/sourceFixtures.ts` (the `SimulatedExecutor`)
  - `broker/source{Capacity,Commands,Edges,Observation,Reconcile,Recovery}.test.ts`
  - `storage/sourceRecords.test.ts`
  - `implementations/externalSource.test.ts`
- **Package docs and release files:** `CAPABILITIES.md`, `etc/ts-agent-tasks.api.md` and the
  change file.
- **Repo docs:**
  - `docs/design/agent-tasks/development-design.md` (§ 5 spelling)
  - `docs/design/agent-tasks/multi-agent-chat-adoption.md` (stray spelling)
  - `docs/design/agent-tasks/implementation-plan.md` (dereference decision record, T6 status)
  - `docs/TECH_DEBT.md` (capacity arithmetic, T6 hand-offs)

## Decisions made during execution

- **Spelling.** § 8.6 is right because it names the *guarantee* rather than the mechanism. The
  stale spelling was in `development-design.md` § 5, not "§ 5 of the plan" as the brief said.
  It was corrected there.
- **Dereference.** Nothing the broker commits ever needed the executor payload. A 200 KiB
  payload that was reconciled, reassigned and recovered appears in no `task-*.json`,
  `source-*.json` or manifest. An adapter that copies retained text into `details` is refused as a
  contract violation. The recommendation is to keep the decision.
- **Twelve ordering windows (W1–W12),** each named with its re-check. They cover:
  - authorization → marker (re-checks the epoch and the subject)
  - marker → send (only the marker's writer sends)
  - send → persist (merged onto the latest record)
  - pump → resend (fenced)
  - read → observation commit (comparator against the committed revision)
  - `applied` + projection (atomic)
  - hints → feed (deferred to a feed pass)
  - page → cursor
  - record → manifest
  - reservation → dispatch (minted in the intent commit)
  - envelope → commit
  - open → sources (no calls)
- **Vocabulary:**
  - `RecoveryResult.unrecoverable` is revised to carry the source's projection. It is not persisted.
  - `IStoredCommandOperation.awaiting?` is an additive persisted field.
  - `capabilities()` is omitted; T9 owns it.
  - `key-expired` is its own result state.
  - `coverage` is required on every page.
  - The `unsettledCommands` index is rebuilt by open and `rebuildIndexes()`.
- **A3 arithmetic.** The registration baseline is unchanged at 448 KiB, giving a ceiling of 146.
  `accepted-operation-settlement` adds 64 KiB per in-flight command (512 KiB, ceiling 128, at one
  per task). `admitted-source-replay` reserves exactly the declared finite envelope and releases it
  at terminal. A reserved terminal observation commits while ordinary sampling is capacity-blocked.
- **The six-round Copilot loop** (rounds 1–5 substantive, round 6 hygiene only) fixed real
  ordering, ownership and validation defects. Among them:
  - a history guarantee that trusted the attached source
  - foreign bindings applied from a page
  - a cursor advancing past a contract violation
  - feed order reset per page
  - archive allowed while a command awaited a feed revision
  - replay `applied` answers confirmed by revision order alone, which led to the projection digest
    on `awaiting`

## Followups

All four hand-offs in result.md § *Hand-offs* were routed in this PR to `docs/TECH_DEBT.md`, under
"source hand-offs T6 left for T7/T8/T9". That entry now marks each one resolved:

| owner | hand-off | resolved by |
|---|---|---|
| T8 | held commands never settle on their own | `abandonCommand` (held, never-sent or feed-awaiting commands); per `docs/TECH_DEBT.md`, a `possibly-sent` command the pump holds still settles only through a later `lookupCommand` |
| T8 | `source-replay` tasks registered after the feed passed | an `unregistered-binding` stop that leaves the cursor unmoved |
| T7 | audience charges | spent from T6's claims |
| T9 | `capabilities()` and the source-side stop | added |

The T4 hand-off of a "per-source enumeration of reconciliation work" is not addressed by name in
result.md; the cluster close (2026-10-01) routed it to `docs/TECH_DEBT.md` (P3, *deferrals the agent-tasks slices recorded only in their own `result.md`*).

## Lessons codified during the run

No rule was added to `.ai/instructions/` in this PR. T6 applied T5's newly codified
authorization-boundary guidance. Two observations from result.md:

- **A post-layer-1 self-audit of the windows table found W4.** Layer 1 had passed with no P1; W4
  (the unfenced resend) was a real defect.
- **The long, substantive loop was expected and is not evidence that layer 1 was skipped.** Rounds
  1–5 each found real defects, which is the profile that guidance predicts for an ordering surface.

## References

- Brief: `brief.md`
- Live state: `state.md`
- Exit artifact: `result.md`
- PR: [#693](https://github.com/ErikFortune/fgv/pull/693)
