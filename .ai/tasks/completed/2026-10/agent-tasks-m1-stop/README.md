# agent-tasks-m1-stop — M1's stop-state and production-profile cohorts

**Shipped**: 2026-10-01 via [PR #708](https://github.com/ErikFortune/fgv/pull/708) into `integration/agent-tasks-v1` (finalized at the agent-tasks cluster close, 2026-10-01).

## Summary

This is a measurement stream, and it changed no `src/` code. It ran M1's last two cohorts against
frozen predictions:

- **The stop-state cohort:** what a persisted cascade stop costs, and what limits one.
- **The production-profile cohort:** the default profile seeded until something refused, across
  the plan's limiting fixtures.

**Six of eighteen predictions missed.** Each was diagnosed, harness first, and none was
re-thresholded.

Under the default profile, `logical-bytes` refuses first in every mix that keeps tasks live (result.md's
claim). The refusing ordinals are the 533rd (plain), 530th (owed), 520th (fanout), 364th (unresolved)
and 443rd live (inventory). For plain, owed, fanout and unresolved, 523.7–535.1 MB of the logical
budget is reserved and 0.8–12.9 MB written at refusal; for the inventory it is 442.6 MB reserved and
93.7 MB written. `retained-tasks` binds first only under archive churn.
`acknowledgement-ids` binds first only once history accumulates.

A stop's breadth is capped at 1,000 targets by `defaultMaxStopTargets`, which is not a capacity
dimension. The root's 8 MiB task record bounds how often the root can be stopped.

The stream recommends keeping the default profile and qualifying hosts by a provisioning budget. The
1,000-task question was surfaced, not decided.

## Files changed

- `@fgv/ts-agent-tasks` `perf/` only:
  - `stopCohort.js`, `profileCohort.js` and `m1Support.js` (new).
  - `residentMemory.js`: new `MANIFEST.predictions.stop` / `.productionProfile`, amendments, and
    dispatch for `--cohorts fixture,stop,productionProfile`.
- No `src/` change. The API report is unchanged, and the change file is `type: none`.
- `docs/TECH_DEBT.md` (see Followups), the plan's M1 line and the ledger.

## Decisions made during execution

- **The brief's `record-bytes` premise was refuted from source before predicting.**
  - One stop is at most 1,000 × 2,986 B, which is under 3 MiB.
  - The root is an 8 MiB task record.
  - A target's evidence holds ids of at most 128 characters, not a 4 KiB identity.
  - As a result, the brief's 10,000-target arm became 10 roots × 1,000.
- **Stop repetition, not breadth, is what the root record bounds:**
  - 24 cycles admitted at 1,000 targets, with the 25th refused on `record-bytes`.
  - 11 cycles at 128-character ids.
  - 61 cycles at 200 targets under the default profile, where the 62nd is refused on `operations`.
- **Each miss is a finding, never a revised threshold.** Six predictions missed:
  - `stop.diskPerTarget` at 1×100, from fixed per-root cost.
  - `stop.latch` released-over-none, which is the stop-book residue.
  - `stop.peak`: release peaks at 18.3–19.8 MiB from nursery churn.
  - `profile.owed`: receipt preparation peaks at 25.4 MiB.
  - `profile.consumer`: a rewrite at the 50,000-id cap peaks at 92.4 MiB.
  - `profile.evidence`: 58 commands per task, and an open peak of 140.0 MiB.
- **Controls show the harness can fail.** These are the stop retain control, and the frozen
  full-summary control (83.4 MiB of 74.0 MiB) and buffering control (105.9 MiB against 40.2 MiB)
  on the inventory.
- **Recommendation:**
  - Provision ~140 MiB for ordinary live-task work, or ~300 MiB if records approach 8 MiB or
    consumers approach the 50,000-id cap, plus the host's own workloads.
  - Provision at least 512 MiB of disk, plus scratch for one replacement of the largest record.
  - `capacityProfile.ts` is untouched.
- **No revert-matrix rows.** The stream measures and adds no protection to revert.

## Followups

All of these were routed to `docs/TECH_DEBT.md` in #708, except the last:

- **P3 updated:** "the default's 1,000 is unreachable". result.md leaves this open for the
  orchestrator and the user. *The current `docs/TECH_DEBT.md` entry records it as "Decided
  2026-10-01 (user): keep the default profile as shipped. Closed."* That text landed with P1's
  #709, not this stream's PR. As merged in #708, the plan's M1 outcome paragraph said "the profile
  decision stays open there".
- **T9 hand-off (3) resolved:** the stop-state cohort has run.
- **New P2s:**
  - the receipt preparation working set;
  - the consumer-record rewrite transient, whose maximal-evidence case is extrapolated and not
    measured;
  - open/rebuild working space near the 8 MiB task-record ceiling.
- **New P3s:**
  - the stop book's ~1 KB per target residue, with no compaction of repeated stops;
  - stop pump cost grows with the number of latched tasks.
- **Not built:** the plan table's history-growth and cache-saturation cohorts. These are recorded
  in the plan's M1 heading ("remain unbuilt") and in result.md. They have **no `docs/TECH_DEBT.md`
  or `docs/FUTURE.md` entry**.

## Lessons codified during the run

None were written into `.ai/instructions/`. Recorded in the artifacts:

- **The after-close residual was a harness artifact, not a library leak.** An async frame that
  holds an open result (`openMeasure`) inflates the residual: owed fell from 13.17 MiB to 1.18 MiB
  once the open moved into an inner frame. The fix landed in `4e34f21f`.
- **Seed-once arms need a per-child copy.** A measured action in one child mutated the directory
  its sibling children shared. This was layer-1 P1-1.
- **Watch the pattern passed to `pkill -f`.** It also matches the shell that invoked it (`state.md`).

## References

- Brief: `brief.md`
- Live state: `state.md`
- Exit artifact: `result.md`
- Raw data:
  - `m1-stop-run-acc4a974.json`: the first stop run.
  - `m1-stop-run-merged-fc381e98.json`: the 128-character-id arms re-run and merged.
  - `m1-profile-run-acc4a974.json`: the production-profile run.
  - `m1-verify-merged-cf112be3.json`: the re-check after I2 was merged in.
- PR: [#708](https://github.com/ErikFortune/fgv/pull/708)
- Related streams: `agent-tasks-t8b`, `agent-tasks-t4`, `agent-tasks-t9`, `agent-tasks-i2`
