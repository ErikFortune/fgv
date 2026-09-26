# State — `agent-tasks-t8b`

**Purpose of this file.** If the session crosses a context boundary, `brief.md` plus this file must
be enough to resume cold. Keep it current as you go — it is not a write-once document.

---

## Status

**Not started.** Branch created and brief placed by the orchestrator 2026-09-26, immediately after
T8 PR 1 landed. No implementation work has begun.

## Branch

- `claude/agent-tasks-t8b`, cut from `integration/agent-tasks-v1` at `cae5d7db4` — the T8 PR 1
  landing (#698).
- PR targets `integration/agent-tasks-v1`, **not `release`**.
- Artifacts stay in `.ai/tasks/active/agent-tasks-t8b/`. This family finalizes at **cluster close**;
  do not run `/finalize-task`.
- `integration/agent-tasks-v1` is level with `release` as of this branch point — nothing to merge up.

## What is already on this base

| slice | landed | PR |
|---|---|---|
| T1 package, values, converters, registry | ✅ | #684 |
| T2 pure context, snapshot-only use | ✅ | #685 |
| T3 FileTree records, durable commit, reopen | ✅ | #686 |
| T4 indexed selection, paging, due/owed discovery | ✅ | #687 |
| T5 bound authority, tracked hierarchy, reassignment | ✅ | #691 |
| T6 source adapters, commands, reconciliation | ✅ | #693 |
| T7 subscriptions, exact receipts, acknowledgement | ✅ | #695 |
| **T8 PR 1** retention, disposition, closure, pruning | ✅ | **#698** |

## Verification standing at branch time

Orchestrator re-ran on PR 1's final source, independently of its own claims:

- `rushx test` → 70 suites, **1,707 passed, 0 failed**, 100 % statements/branches/functions/lines,
  `grep -c "c8 ignore" src/` → 0, zero warnings. Matches PR 1 exactly.
- Revert row **M1** ("retention rule off") → reddens **exactly the eight suites** PR 1 named
  (`broker/updates`, `delivery/disposition`, `delivery/retention`, `storage/conformance`,
  `storage/disposition`, `storage/pruning`, `storage/query`, `storage/subscriptions`). The
  orchestrator's reconstruction of the neuter gave 15 red against PR 1's 17 — the suite set is
  identical, so this is the same protection; the 2-test gap is the reconstruction, not the claim.
- CI green on `5e0f01e41`, the merged head.

## The one thing held for the design authority

**The capacity-profile change.** PR 1 delivered the arithmetic and a recommendation — (d) reserve
the derived 37,417 B schema maximum, plus (c) advertise the number the profile then serves — and
deliberately left `defaultTaskCapacityProfile` unchanged. That is correct and stays correct here:
**deliver the decision with its evidence and stop.** The orchestrator takes it to the design
authority.

The ordering the plan imposes: **M1 runs before the profile decision, not after it.**

## Work log

_(append as you go: what you did, what you learned, what you decided and why)_

## Open questions for the orchestrator

_(anything you cannot resolve from the brief, the plan or the code — raise it here and surface it)_

Two are known to be coming:

1. **The profile change itself** — see above. Held by design, not by omission.
2. **Candidate (d″)** — reserving five categories rather than seven, which would give a ceiling of
   358. It needs a proof that no single commit can produce `assignment` or `relationship` alongside
   a terminal transition. PR 1 judged it plausible but declined to claim it, because shrinking "at
   most seven categories" is a design statement. If you can prove it from the code, show the proof;
   if it needs a design decision, route it.
