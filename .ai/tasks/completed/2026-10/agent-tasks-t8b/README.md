# agent-tasks-t8b — Capacity qualification: A3 saturation journeys, M1 and the default profile (T8 PR 2 of 2)

**Shipped**: 2026-09-27 via [PR #699](https://github.com/ErikFortune/fgv/pull/699) into `integration/agent-tasks-v1` (finalized at the agent-tasks cluster close, 2026-10-01).

> PR 2 of slice T8. PR 1, the retention mechanism, is `agent-tasks-t8`
> ([#698](https://github.com/ErikFortune/fgv/pull/698)); T8's acceptance criteria are met by the two
> together (result.md § *T8's acceptance criteria, item by item*).

## Summary

The capacity work the agent-tasks family had deferred since T4. Every § 8.6 dimension is driven to
saturation, refuses growth, and still completes, drains, archives and reopens with exact used/reserved
transfers at every crash point. Reservations now use an update's derived 37,417-byte maximum instead of
`maxUpdateBytes` (64 KiB), and the default profile documents what it actually admits: **536 plain
registrations, bound by `logical-bytes`** — not the advertised 1,000 `non-archived-tasks`.

## Files changed

All code is in `@fgv/ts-agent-tasks` (18 files under `libraries/ts-agent-tasks`).

- Phase 0: `storage/committedFiles.ts` (new, 286 lines) extracted from `storage/repository.ts`
  (1993 → 1808 lines); `etc/ts-agent-tasks.api.md` unchanged by that commit.
- `types/capacityProfile.ts` — `maximumUpdateBytes(profile)` (new public) and the bundle charges that
  use it; `resident-payload-bytes` 384 MiB; `maxConsumerRecordBytes` and `record-bytes` 32 MiB; every
  changed value documented at its site.
- `storage/ledger.ts` (`reclaimableByCleanup`), `storage/graphRules.ts` (`reservationsHold`, H1),
  `storage/consumerRecords.ts` (`frozenBy`, H2), `types/failure.ts`.
- Tests: `delivery/saturation.test.ts` (53), `delivery/lifetime.test.ts` (13), helper
  `test/helpers/saturationFixtures.ts`.
- `perf/residentMemory.js` (one-line seed correction; manifest untouched), `perf/mutationMatrix.js`.
- Docs: `libraries/ts-agent-tasks/CAPABILITIES.md` (runbook figures re-checked, *Sizing the default*),
  `docs/TECH_DEBT.md` (capacity entry closed; P1 `max-lines` sweep table updated), the plan's T8 line
  to ✅, the `agent-tasks-t8` ledger entry closed out, and a `minor` change file with `BREAKING:`.

## Decisions made during execution

- **Phase 0 seam: the committed-files layer**, chosen over the registration protocol (~365 lines) and
  the commit path (~400) because it is what those paths stand on — a one-directional dependency with a
  small host interface — rather than "the seam that fit".
- **M1 ran before the profile change** (on `60db3e8d`), after a one-line harness seed correction
  (archive with `updates: []`, required since #698); no prediction, threshold or manifest amendment was
  edited. All four cohorts passed. M1 "**neither confirms nor refutes 384 MiB**" and does not bear on
  (d); it observed ~1.4 heap bytes per presentation byte, recorded in the profile remarks as unmeasured.
- **(d) scope**: closeout, first resolution (not named in the brief) and settlement; the `current`
  baseline is charged at actual bytes and needed no change; `source-replay` envelope validation left
  alone (P4).
- **Change 4 needed a seventh number**: `record-bytes` 8 → 32 MiB, because `recordLimitFor` capped the
  consumer record at it.
- **The decision's premise failed**: with (d) and 384 MiB the default refuses the 537th plain
  registration on `logical-bytes`. Put to the user 2026-09-26; the answer was to ship the six changes
  and document 536.
- **Stored claims minted before (d) fail at open**; no migration (unpublished package), disclosed as
  `BREAKING`.
- **`reclaimableByCleanup` is no longer static per dimension** — found by the transient-vs-lifetime
  test at the `acknowledgement-ids` ceiling.
- Antagonist **H1** (`raiseCapacityLimits` may not grow bounds existing reservations were minted
  from) and **H2** (a landed-but-not-live `current` activation now freezes commits it would miss) fixed;
  H2 changed T7 code, not PR 1's mechanism.

## Followups

Routed to `docs/TECH_DEBT.md` in this PR:

- P3 — 1,000 `non-archived-tasks` unreachable under the default `logical-bytes` (later: trigger fired
  by `agent-tasks-m1-stop` and closed 2026-10-01 by the user's decision to keep the profile).
- P3 — at the default 8,000-character context budget an older revision of a maximum-size task is never
  deliverable.
- P3 — an expired orphaned receipt keeps pinning; `outstanding()` calls its task prunable.
- P4 — `source-replay` envelope validation still measures against `maxUpdateBytes`; P4 — baselines not
  checked against `maxUpdateBytes`.
- Stop latch → T9 (`agent-tasks-t9`).
- The **six stale mutation-matrix rows** (M13, M20, M23, M34, M39, M49): result.md lists them under
  "Hand-offs (routed to `docs/TECH_DEBT.md` in this PR)", but #699's TECH_DEBT diff does not add them;
  the entry that records them was added later by `agent-tasks-i1b` (#703).
- T7 hand-off (2) is resolved by change 4, but the TECH_DEBT *delivery hand-offs T7 left for T8* entry
  listed it as open until the cluster close struck it through (2026-10-01).

## Lessons codified during the run

- A measurement harness can stop running without anyone noticing: nothing had run M1 since T4, and
  #698's tombstone rule broke its seed step. Diagnose the harness first; disclose the fix in the record
  rather than the frozen manifest.
- A decision table that models one dimension can be refuted by another: the 384 MiB table modelled
  `resident-payload-bytes` alone, and `logical-bytes` bound first.
- A revert matrix run concurrently with a repo-wide `rush rebuild` reads "did not build" / "0 red" for
  reasons unrelated to the protection; rows 1–17 were re-run on a quiet machine.

## References

- `brief.md` (its decision text is kept, annotated with the 536 finding), `state.md`, `result.md`
- `m1-run-60db3e8d.json` — raw per-run M1 data
- `revert-matrix-f69e1c08.json` — the merged 100-row revert matrix result
- [PR #699](https://github.com/ErikFortune/fgv/pull/699)
- Siblings: `agent-tasks-t8` (PR 1), `agent-tasks-t4` (M1 harness author), `agent-tasks-m1-stop`,
  `agent-tasks-t9`
