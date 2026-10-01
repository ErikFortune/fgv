# State — `agent-tasks-m1-stop`

**Status:** brief written, not started.

## Where things stand

| | |
|---|---|
| brief | `.ai/tasks/active/agent-tasks-m1-stop/brief.md` — complete |
| branch | `claude/agent-tasks-m1-stop`, cut off `integration/agent-tasks-v1` at `e662da68c` |
| PR | none |
| base | `integration/agent-tasks-v1` — **not `release`** |

## Scope

M1's two remaining cohorts, per the plan's own M1 heading (*"the production-profile cohort and the
stop-state cohort (after T9) remain"*):

1. **Stop-state** — what a persisted cascade stop costs, resident and on disk.
2. **Production-profile** — qualify the profile at its *actual* earliest limiting dimension.

A **measurement** stream: it extends `perf/residentMemory.js`, prints machine-dependent numbers, and
is explicitly not a Jest test, not in coverage and not a CI threshold.

## Parallelism

Runs beside **`agent-tasks-i2`**, which owns the new `packlets/prompt/`. This stream owns `perf/`.
Neither touches the other's files. Shared-substrate collisions (plan, ledger, `CAPABILITIES.md`) are
resolved by merging whichever lands first, as `agent-tasks-tracked-commands` did.

Not blocked by, and does not block, I2 or P1.

## Verified inputs (checked, not assumed)

- `perf/residentMemory.js` exists at 792 lines with cohorts `fixture`, `archived`, `terminal`, `peak`,
  a `MANIFEST` frozen before its first run, three recorded `amendments`, `--reps` / `--cohorts` /
  `--out`, a fresh `node --expose-gc` child per arm and random-hex payloads.
- `stops?: ReadonlyArray<IStopIntent>` is persisted **on the root task's commit record**
  (`types/storage.ts:166, 212`).
- `IStopTarget` = `{ taskId, attempt, operationId, state, confirmedRevision?, stableSourceEvidence?,
  violation? }`; `IStableStopEvidence` = `{ sourceId, contractVersion, sourceRevision }`.
- `allCapacityDimensions` has **eleven** members and **none is stop-specific** — no dimension counts
  intents, targets or latches.
- `record-bytes` default is **32 MiB** (`types/capacityProfile.ts:63`).
- T8b's built profile refuses the **537th** registration on `logical-bytes`; `saturation.test.ts` pins
  536 admitted.

## The open question

At what subtree breadth does a cascade stop become limited, and by which dimension? Since the whole
target list lives in the root's record and nothing counts targets, `record-bytes` is the suspect. The
brief carries the orchestrator's rough reckoning — that bare targets leave `record-bytes` far above the
task-count limit, but maximal 4 KiB source identities with `stableSourceEvidence` could bring it
*below* — and labels it explicitly as arithmetic to reproduce or refute, not a result. The
orchestrator's capacity arithmetic was wrong once before (modelled `resident-payload-bytes`, the build
bound on `logical-bytes` at half the asserted figure).

## Resume instructions

`brief.md` plus this file is enough to start cold. Nothing is implemented.
