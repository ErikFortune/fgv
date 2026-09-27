# State — `agent-tasks-t9`

**Purpose of this file.** If the session crosses a context boundary, `brief.md` plus this file must
be enough to resume cold. Keep it current as you go.

---

## Status

**Not started.** Branch created and brief placed by the orchestrator 2026-09-27, immediately after
T8 closed. No implementation work has begun.

## Branch

- `claude/agent-tasks-t9`, cut from `integration/agent-tasks-v1` at `ea6b6f38b` — the `release`-up
  merge following T8's close, so the base carries #700 as well as T8.
- PR targets `integration/agent-tasks-v1`, **not `release`**.
- Artifacts stay in `.ai/tasks/active/agent-tasks-t9/`. This family finalizes at **cluster close**;
  do not run `/finalize-task`.

## What is on this base

| slice | landed | PR |
|---|---|---|
| T1 package, values, converters, registry | ✅ | #684 |
| T2 pure context, snapshot-only use | ✅ | #685 |
| T3 FileTree records, durable commit, reopen | ✅ | #686 |
| T4 indexed selection, paging, due/owed discovery | ✅ | #687 |
| T5 bound authority, tracked hierarchy, reassignment | ✅ | #691 |
| T6 source adapters, commands, reconciliation | ✅ | #693 |
| T7 subscriptions, exact receipts, acknowledgement | ✅ | #695 |
| T8 PR 1 retention, disposition, closure, pruning | ✅ | #698 |
| T8 PR 2 A3 journeys, M1, the capacity profile | ✅ | #699 |

Plus, from `release`: the `hasOwnProperty` null-prototype fix and `no-prototype-builtins` (#700).

**T8 is closed, so the capacity model is settled.** The default profile now admits **536 plain
registrations, bound by `logical-bytes`** — not the 1,000 `non-archived-tasks` it advertises.
That figure is pinned by a test and documented at the profile site; your saturation work inherits it.

## Verification standing at branch time

Orchestrator re-ran on T8 PR 2's final source, independently of its claims:

- `rushx test` → 72 suites, **1,791 passed, 0 failed**, 100 % on every metric, zero `c8 ignore`,
  zero warnings.
- Phase 0's figures exact: `storage/repository.ts` 1993 → **1808** at the extraction commit, with
  `etc/ts-agent-tasks.api.md` byte-identical across it. The only api.md delta across the whole PR is
  the new `maximumUpdateBytes` export.
- The 536 figure is pinned by an executable test that registers until refusal and asserts the
  refusal is on `logical-bytes`.

## A correction worth carrying, because it was the orchestrator's

The capacity table in T8b's brief said 384 MiB made 1,000 reachable "in every mix we model." It did
not: the table modelled `resident-payload-bytes` alone, and once that was raised six-fold,
`logical-bytes` became the binding dimension at 537. The information was in T7's own `result.md`
and was not carried through.

T8b caught it only because the brief told it to reproduce the arithmetic rather than trust it. **The
same instruction is in your brief, and it applies to every number there.**

## Work log

_(append as you go: what you did, what you learned, what you decided and why)_

## Open questions for the orchestrator

_(raise here and surface, rather than reconstructing intent and proceeding)_

Two are anticipated:

1. **The M1 stop-state cohort.** The plan schedules it after T9. The harness exists and its
   prediction manifest is frozen. Adding a cohort is a harness change — say so rather than doing it
   quietly, and if you judge it belongs to P1 instead, say that.
2. **Whether the A2 semantics need a design amendment.** A2 is approved and explicit, but it was
   written before T6's sources and T8's capacity model existed. If a stop cannot be expressed within
   it, the plan's own instruction applies: *"amend the design openly rather than weaken guarantees."*
