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

## The profile decision — taken, so you implement rather than recommend

PR 1 delivered the arithmetic and held the change for the design authority. **The decision came back
on 2026-09-26 and is in `brief.md` § *Deliverable 3*.** Six changes, every one a raise or a code
correction, nothing lowered anywhere:

| | change |
|---|---|
| 1 | (d) as a **code** change: the closeout reserves the derived 37,417 B schema maximum, not `maxUpdateBytes` — applied consistently to the command and baseline charges too |
| 2 | `resident-payload-bytes` 64 MiB → **384 MiB** |
| 3 | `non-archived-tasks` stays **1,000**, now reachable in every modelled mix |
| 4 | `maxConsumerRecordBytes` 8 MiB → **32 MiB** (resolves T7's hand-off 2 upward) |
| 5 | `maxAcknowledgementIdsPerSubscription` stays **50,000**, now covered |
| 6 | `maxUpdateBytes` stays **64 KiB**; the 37,417 B schema maximum is documented beside it |

`(d-double-prime)` — five categories instead of seven — is **not taken**.

**The instruction was: best guess, documented, room to tune.** So the documentation is a deliverable
(brief § *The documentation is a deliverable, not a side effect*), and "room to tune" is why no limit
is lowered: v1 can raise a stored limit and cannot lower one.

**M1 still runs first**, and the plan's ordering is unchanged. If M1 refutes 384 MiB or refutes (d),
that is a finding to report — not a number to quietly adjust, and not a measurement to bend.

## Work log

_(append as you go: what you did, what you learned, what you decided and why)_

## Open questions for the orchestrator

_(anything you cannot resolve from the brief, the plan or the code — raise it here and surface it)_

Both of the ones PR 1 raised are now **answered** — see *The profile decision* above. Nothing is
currently held for the design authority.

If something new needs deciding, the two things worth knowing about how this stream's decisions get
made: numeric choices come back as "best guess, documented, room to tune" rather than as open
questions, and a lowering of any stored limit is treated as effectively irreversible, so proposals
that need one should say so prominently.
