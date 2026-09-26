# State — `agent-tasks-t8`

**Purpose of this file.** If the session crosses a context boundary, `brief.md` plus this file must
be enough to resume cold. Keep it current as you go — it is not a write-once document.

---

## Status

**Not started.** Branch created and brief placed by the orchestrator 2026-09-26; no implementation
work has begun.

## Branch

- `claude/agent-tasks-t8`, cut from `integration/agent-tasks-v1` at `064bdff24` — the
  `release`-up merge immediately following the T7 landing (`76146d4a6`, #695).
- PR targets `integration/agent-tasks-v1`, **not `release`**.
- Artifacts stay in `.ai/tasks/active/agent-tasks-t8/`. This family finalizes at **cluster close**;
  do not run `/finalize-task`.

## What is already on this base

T1–T7 have all landed on the integration branch:

| slice | landed | PR |
|---|---|---|
| T1 package, values, converters, registry | ✅ | #684 |
| T2 pure context, snapshot-only use | ✅ | #685 |
| T3 FileTree records, durable commit, reopen | ✅ | #686 |
| T4 indexed selection, paging, due/owed discovery | ✅ | #687 |
| T5 bound authority, tracked hierarchy, reassignment | ✅ | #691 |
| T6 source adapters, commands, reconciliation | ✅ | #693 |
| T7 subscriptions, exact receipts, acknowledgement | ✅ | #695 |

The `release`-up merge at `064bdff24` also brings, relevant to this slice:

- the **change-file typing rule** in `.ai/instructions/ACTIVE_DEVELOPMENT.md` (#696) — `major` is
  only for breaking code that shipped in a non-alpha release; `ts-agent-tasks` has never shipped at
  all, so **this slice's change file is `minor`**, however breaking it is, with a `BREAKING:` comment
  prefix if it breaks anything
- the **CI-flake inventory** in `docs/TECH_DEBT.md` (#697) — the three known unrelated causes of red
  CI. Read the log, confirm it is one of those three, re-trigger. Do not fix them.

## Verification standing at branch time

Orchestrator re-ran on the T7 final source, independently of T7's own claims:

- `rushx test` in `ts-agent-tasks` → 64 suites, **1,603 passed, 0 failed**, 100%
  statements/branches/functions/lines, `grep -c "c8 ignore" src/` → 0.
- The checkpoint-store test-double falsifier → **26 of the 33** tests in
  `delivery/checkpoints.test.ts` go red when the injected store stops persisting; T7's artifact had
  reported "22 of 28" and was corrected.

A repo-wide `rush rebuild` was started on `064bdff24` after the `release`-up merge. **Check its
outcome before assuming the base is clean** — if it is not recorded below, it was not confirmed.

- [ ] repo-wide `rush rebuild` on `064bdff24`: _result not yet recorded_

## Work log

_(append as you go: what you did, what you learned, what you decided and why)_

## Open questions for the orchestrator

_(anything you cannot resolve from the brief, the plan or the code — raise it here and surface it,
rather than reconstructing intent and proceeding)_

Two are already known to be coming:

1. **The capacity profile.** The brief stakes this out: deliver the arithmetic for every candidate
   resolution with its number and a recommendation, but **do not change the published default
   profile without an orchestrator round-trip** — `defaultTaskCapacityLimits` is `@public`.
2. **A split, if the diff outgrows one reviewable PR.** T7 was 83 files and +12,111/−605 with a
   six-round Copilot loop, and T8's deliverable list is longer. Raising this early is much cheaper
   than at round eight; it is the orchestrator's decision to take, but yours to raise.
