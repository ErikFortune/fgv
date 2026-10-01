# State — `agent-tasks-m1-stop`

**Status:** predictions frozen in `MANIFEST` (commit "perf(ts-agent-tasks): freeze M1 stop and
production-profile predictions"), before any cohort code or run. Harness cohorts next.

## Where things stand

| | |
|---|---|
| brief | `.ai/tasks/active/agent-tasks-m1-stop/brief.md` — complete |
| branch | `claude/agent-tasks-m1-stop`, cut off `integration/agent-tasks-v1` at `e662da68c` |
| PR | none |
| base | `integration/agent-tasks-v1` — **not `release`** |

## Brief premises checked against source (before predicting)

The brief asked for its `record-bytes` arithmetic to be reproduced or refuted. Refuted, three ways —
recorded in `MANIFEST.predictions.stop.premise`:

1. **Breadth is capped at 1,000 targets** by `defaultMaxStopTargets` (`types/stop.ts`), refused never
   truncated (`broker/stopRequests.ts`, `converters/stopConverters.ts`). Not a capacity dimension. The
   brief's "10,000 targets under one root" cannot exist; the 10,000-target arm is 10 roots x 1,000.
2. **The root is a task record**, bounded at **8 MiB** (`maxTaskRecordBytes`), not `record-bytes`'
   32 MiB — `recordLimitFor` takes the minimum (T8b result § (4)'s mechanism).
3. **A target carries no source identity.** `IStableStopEvidence` is sourceId + contractVersion +
   epoch + token, each <= 128 characters. The 4 KiB `maxSourceIdentityBytes` binding reference lives
   on the target's own record. Schema-maximum target = 2,986 B (`maximumStopTargetBytes`).

Consequence: one stop cannot reach `record-bytes` (<= 1,000 x 2,986 B < 3 MiB). What the root record
bounds is **repetition** — released/settled intents stay on the root (T9 result § model table).
Under the default profile `logical-bytes` binds breadth first (643,625 B reserved per target; T9:
210 of 400; whole-repo ≈ 325).

These are not a STOP under the missing-input rule: the brief explicitly anticipated its arithmetic
might be wrong and asked for it to be checked; every required-reading file exists and says what the
brief cites it for. Reported to the user in the PR and `result.md`.

## Plan (cohorts as frozen)

- **stop** (fixture profile): shapes 1x100, 1x1000, 10x1000 x states none/accepted/satisfied/released;
  max-id arms; external-evidence arms (none/satisfied x small/max, released-max); settled (cancel +
  archive root); breadth refusal at 1,001; repetition until refused (fixture 36/128-char, default
  200 targets); retain control; release peak/latency.
- **productionProfile** (default profile): empty, plain, churn, owed, fanout, history (+control),
  consumer, evidence (+control), unresolved (+ unresolved-stop search, whole-repo stop search),
  inventory (+ full-summary and buffering controls).

## Resume instructions

`brief.md` plus this file. Predictions are frozen: any change after a recorded run goes in
`MANIFEST.amendments` with date, reason and what did not change.
