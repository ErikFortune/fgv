# State — `agent-tasks-t8b`

**Purpose of this file.** If the session crosses a context boundary, `brief.md` plus this file must
be enough to resume cold. Keep it current as you go — it is not a write-once document.

---

## Status

**In progress.** Phase 0 (`60db3e8d`), M1 (`48b5c7ad`) and the profile change (`c0b515b0`) are
pushed. Next: the A3 saturation journeys (deliverable 1), then docs, reviews, PR.

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

- **Phase 0** — `CommittedFiles` extracted (`storage/committedFiles.ts`); `repository.ts` 1993 → 1808.
  API report byte-identical; 70 suites / 1,707 green. Seam rationale in `result.md` § *Phase 0*.
- **M1** — the T4 harness failed at its seed step: since #698 archive must write a tombstone with no
  updates, and the harness archived with `updates: current.updates`. One-line seed correction outside
  the frozen manifest (no prediction/threshold touched), disclosed in the file and `result.md`. Run on
  `60db3e8d` (pre-profile): all four cohorts pass, raw output `m1-run-60db3e8d.json`.
- **Profile** — reproduced the brief's resident table exactly. **Finding:** with (d) + 384 MiB the
  plain-registration ceiling is **536**, bound by `logical-bytes` (512 MiB; ~976 KiB closeout each);
  `audience-links`/`acknowledgement-ids` (200,000; 224 each) would bind at 892. Asked the user
  2026-09-26: options were add three raises (logical 1.5 GiB, links/ids 300,000) or implement the six
  and document 536. **Answer: six only, document 536.** Documented at the profile site.
- **Change 4 mechanism** — `recordLimitFor` caps every record at `min(limits['record-bytes'], own
  bound)`, and `record-bytes` was 8 MiB, so `maxConsumerRecordBytes` 32 MiB alone was inert. Raised
  `record-bytes` to 32 MiB as the mechanism of change 4 (task/inventory/source keep 8/8/1 MiB).
  Disclose in the PR; the orchestrator may treat it as a seventh change.
- **(d) scope** — applied to closeout, first resolution and settlement (the three bundles reserving an
  update payload). The `current`-baseline charge is actual bytes, so it needs no change. The
  source-replay consistency check (`declared ≤ n × maxUpdateBytes`) is left as is: it reserves the
  declared bytes, not the unit, so it over-reserves nothing; tightening it would narrow what it accepts.
- **Stored claims** — `checkTaskClaims` requires each claim ≤ its bundle; claims minted before (d)
  exceed the new bundles and fail open. Package unpublished; disclosed as BREAKING, no migration (the
  same posture PR 1 took).

## Open questions for the orchestrator

_(anything you cannot resolve from the brief, the plan or the code — raise it here and surface it)_

Both of the ones PR 1 raised are now **answered** — see *The profile decision* above. Nothing is
currently held for the design authority.

If something new needs deciding, the two things worth knowing about how this stream's decisions get
made: numeric choices come back as "best guess, documented, room to tune" rather than as open
questions, and a lowering of any stored limit is treated as effectively irreversible, so proposals
that need one should say so prominently.
