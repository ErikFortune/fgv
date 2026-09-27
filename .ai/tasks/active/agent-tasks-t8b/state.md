# State — `agent-tasks-t8b`

**Purpose of this file.** If the session crosses a context boundary, `brief.md` plus this file must
be enough to resume cold. Keep it current as you go — it is not a write-once document.

---

## Status

**Implementation complete; final gates running.** Phase 0 (`60db3e8d`), M1 (`48b5c7ad`), profile
(`c0b515b0`), A3 suites (`c08d5971`), layer-1 P3s (`82f45d21`), antagonist fixes (`f69e1c08`). In
flight: full 100-row revert matrix on `f69e1c08` (on a package copy), repo-wide `rebuild` + `test`.
Then: bundler/tarball verify scripts, plan T8 line → ✅ and ledger, PR into
`integration/agent-tasks-v1`, Copilot loop.

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
| 3 | `non-archived-tasks` stays **1,000** — decided as reachable in every modelled mix; **built, it is not: `logical-bytes` binds at 536** (work log; shipped and documented as such) |
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

## Layer 1 — `code-reviewer`, 2026-09-26, on `c08d5971` (after the A3 suites, before the coverage re-check)

Reran lint and the full suite itself (1,779 green,
100 %), confirmed the phase-0 API report unchanged, re-derived 37,417 independently, diffed every
extracted method against `cae5d7db4` (verbatim moves). **No P1, no P2.** Three P3s, all applied:

| P3 | disposition |
|---|---|
| `maximumUpdateBytes` reads `defaultTaskFieldBounds.maxIdLength` without an adjacent reason | comment added at the line |
| `widestUpdate()` hardcodes 128 | now `defaultTaskFieldBounds.maxIdLength` |
| `reclaimableByCleanup` wording says "true only while … releases"; the proxy can over-promise when a reservation is later spent in full | docstrings (`failure.ts`, `ledger.ts`) now say *could*, and that a fully spent reservation releases nothing |

## Independent persistence/delivery antagonist, 2026-09-26, on `4c5c4af7`

Every finding reproduced by a scratch test it ran (kept outside the tree). Dispositions:

| finding | sev | disposition |
|---|---|---|
| **H1** `raiseCapacityLimits` may raise `encoded`/`perOwner` bounds; stored closeout/resolution/settlement claims keep their old unit, so accepted work can be refused its terminal write (repro: raise `maxEnvelopeBytes` to 60 KiB, then a terminal commit is refused on resident bytes). (d) widened it: before, the unit was `maxUpdateBytes`, which an envelope raise stayed under | HIGH | **fixed** — `graphRules.ts` `reservationsHold`: a raise that grows any bundle charge, the evidence size or the receipt size is refused `unsupported`, naming it; `maxUpdateBytes` and every `limits` value stay raisable. Tests in `lifetime.test.ts`; matrix row T8b-7 |
| **H2** a pending `current` activation whose record landed, then failed cleanly to go live, is completed by retry or open from that landed baseline; commits made in between were in no audience and are never owed (repro: title change and a new task while pending → both absent after reopen) | HIGH | **fixed** — `consumerRecords.ts` `frozenBy` + `repository._plan`: while such a record is landed-but-not-live, commits to tasks its selection covers are refused `conflict` naming the subscription; retry, reopen or rebuild completes it with a still-exact baseline. `from-now` and not-landed registrations freeze nothing. T7 code, not PR 1's mechanism. Tests in `lifetime.test.ts`; matrix row T8b-8 |
| **M** runbook said an orphaned receipt pins "until it expires"; expiry evicts nothing — only a later issue/disposition does, and `cleanup` does neither | MED | **docs fixed** (`CAPABILITIES.md`: abandon it). The behaviour (and `outstanding()` listing a task as prunable that cleanup will not prune) → TECH_DEBT P3 |
| L: 1,537 ignores the creation update's own bytes (true ≈ 1,534); 536 is for minimal tasks | LOW | docs now say "about 1,530" and "at most 536 … of minimal size" |
| L: baselines are never checked against `maxUpdateBytes`, and the profile converter lacks `maxUpdateBytes ≥ derived` | LOW | TECH_DEBT P4 (read, not run) |
| L: `_reclaimable` counts a pending registration's claims and closeout operation slots, which draining turns into history | LOW | already hedged to "could" after layer 1; kept |
| L: "stored claims fail at open" depends on the data (a consumed settlement with remainder ≤ 37,417 passes) | LOW | wording corrected in `result.md` |

Checked sound by it: `maximumUpdateBytes` against the strict converters and resident measurement;
adopted/coalesced updates; every journey write under `when:'after'` with `unknown`/`replaced`
visibility (reopen + retry converge exactly) and the three activation writes — beyond the suite's
`before`/`unchanged` injection.

## Copilot loop on #699

| round | head | main list | previously-missed / summary | disposition |
|---|---|---|---|---|
| 1 | `4b5f54d1` | none | summary: "the saturation fixture has an unresolved moderate issue that can make post-reopen crash tests ineffective" | **real** — `reopenWorld` opened over the raw root and returned a `FaultyRoot` nothing wrote through, so a fault injected after a reopen never fired. Fixed; a test pins it (red before the fix) |
| 2 | `431ded16` | none | **3 previously missed (LOW)**: stale "1,000 reachable" in `brief.md` and `state.md`; stale "profile change not delivered" in the `agent-tasks-t8` ledger entry. Summary also names "the ledger reclaimability issue" with no finding attached | all three fixed (the brief's decision text kept, annotated rather than rewritten). The reclaimability line matches the layer-1 P3 / antagonist LOW already dispositioned: the flag says *could*, documented as not knowing whether a reservation will be spent in full |
| 3 | `9dff705e` | 1 HIGH: `reservationsHold` rejects only bundle *growth*, so a raise could shrink a bundle below claims minted earlier and brick the next open. Summary also: "delivery activation matching also requires correction" (no finding attached) | **does not reproduce** — every bundle charge is monotone non-decreasing in the bounds and `raisedProfile` refuses any lowering, so no raise shrinks a bundle; claims from an earlier build already fail at `open` (the disclosed break), before a raise is reachable. Replied and resolved. `frozenBy` matching re-checked: catalog fields before and after, status-independent — it can over-freeze, never under-freeze |

## Open questions for the orchestrator

_(anything you cannot resolve from the brief, the plan or the code — raise it here and surface it)_

Both of the ones PR 1 raised are now **answered** — see *The profile decision* above. Nothing is
currently held for the design authority.

If something new needs deciding, the two things worth knowing about how this stream's decisions get
made: numeric choices come back as "best guess, documented, room to tune" rather than as open
questions, and a lowering of any stored limit is treated as effectively irreversible, so proposals
that need one should say so prominently.
