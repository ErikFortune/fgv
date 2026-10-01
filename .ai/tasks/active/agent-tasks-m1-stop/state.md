# State — `agent-tasks-m1-stop`

**Status:** predictions frozen (`f09c24a2`, before any cohort code); harness written (`a5254d15`);
layer-1 review applied (`acc4a974`, one P1 + nine P2, recorded as a manifest amendment, no
prediction changed). **Recorded run in progress**: `--cohorts fixture,stop` first, then
`--cohorts fixture,productionProfile`; raw JSON goes beside this file as `m1-*-run-<rev>.json`.

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

## Shakeouts (one repetition each, before any recorded run — disclosed, not evidence)

Inside frozen ranges: breadth refusal at 1,001 (`invalid`, no dimension); repetition 1,000 targets
refused cycle 25 on `record-bytes` (~154 KB/cycle); default 200 targets refused cycle 62 on
`operations`; evidence 613 B per record at maximal identity; plain 533rd, owed 530th, fanout 520th,
unresolved 364th, inventory 443rd live — all `logical-bytes`; churn item 10,000 on `retained-tasks`;
history round 8 on `acknowledgement-ids` with 200 closed subscriptions; whole-repo stop 325;
unresolved-children stop 251.

Outside frozen ranges (the recorded run decides; no threshold moves): owed receipt prepare+ack peak
25.5 MiB above settled (≤ 16 MiB frozen); 1,000-target release 19.1 MiB (≤ 16), old-space only
1.7 MiB — nursery churn; evidence 58 commands per task (50–56 frozen); evidence open peak 140 MiB
above settled (sharp bound 48 MiB; loose bound ~146 MiB holds).

Harness lessons: `pkill -f <pattern>` also matches the invoking shell — do not use it with a pattern
that appears in the same command line.

## Resume instructions

`brief.md` plus this file. Predictions are frozen: any change after a recorded run goes in
`MANIFEST.amendments` with date, reason and what did not change.
