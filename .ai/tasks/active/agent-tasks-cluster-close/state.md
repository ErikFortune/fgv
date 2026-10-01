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

## Open decision

**What the capability feed shows.** `generate-capability-feed.mjs` bounds the feed to 10 entries
(`ROUTER_LIMIT`) and `verify-capability-docs` holds `LIBRARY_CAPABILITIES.md` to 24,000 characters
(currently 22,038). Eighteen headlines would make all ten most-recent entries agent-tasks and push
every other package out of the router. Three options are set out in the brief, **none verified against
what the script actually does** — the absent-headline case in particular may be untested, since all 63
existing completed streams have one.

## Out of scope — leave alone

`agent-memory-mcp-server`, `library-capabilities-split`, `mistakes-log`, `task-corpus-index`.
Also: do not fold I2's / P1's matrix scripts into `perf/`, and do not drain the routed debt.

## Resume instructions

`brief.md` plus this file is enough to start cold. Nothing is done.
