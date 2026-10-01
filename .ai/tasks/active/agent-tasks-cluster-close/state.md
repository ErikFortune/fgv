# State — `agent-tasks-cluster-close`

**Status:** brief written, not started.

## Where things stand

| | |
|---|---|
| brief | `.ai/tasks/active/agent-tasks-cluster-close/brief.md` — complete |
| branch | `claude/agent-tasks-cluster-close`, cut off `integration/agent-tasks-v1` at `2a95fbb21` |
| PR | none |
| base | `integration/agent-tasks-v1` — **not `release`** |

## What this is

Cluster close for the agent-tasks family: finalize **eighteen** streams into
`.ai/tasks/completed/2026-10/`, archive their ledger entries to `docs/workstreams/2026-10.md`, and
write the plan's § 8 release evidence. One PR. No source changes, and **no promotion to `release`** —
the orchestrator squashes the integration branch afterwards.

Every implementation slice deferred `/finalize-task` to this point, so it all comes due at once.

## The cluster, as landed on `integration/agent-tasks-v1`

T1–T9 (with T8 in two PRs and T8b), I1a–I1d, tracked-commands, I2, M1's stop/production cohorts, P1.
Head `2a95fbb21`.

## The capability feed — no hard decision here

The brief's first draft claimed one; that was wrong and is corrected. The generator writes **full
per-package history** into each `libraries/<pkg>/CAPABILITIES.md` (so all eighteen land in
`ts-agent-tasks`' own file automatically) and only the ten most recent across all packages into the
router, whose region is bounded at ten **regardless of stream count** — so the 24,000-character budget
is unaffected. The router being agent-tasks-heavy for a while is what a rolling feed does.

What remains is editorial: whether every one of the eighteen earns a feed line in the package file,
when most of T1–T9 read as internal slices of one capability. Normal `/finalize-task` judgement per
stream — but verify the script tolerates a `meta.yaml` with no headline before relying on that, since
all 63 existing streams have one.

## Out of scope — leave alone

`agent-memory-mcp-server`, `library-capabilities-split`, `mistakes-log`, `task-corpus-index`.
Also: do not fold I2's / P1's matrix scripts into `perf/`, and do not drain the routed debt.

## Resume instructions

`brief.md` plus this file is enough to start cold. Nothing is done.
