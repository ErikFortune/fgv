# State — `agent-tasks-t8`

**Purpose of this file.** If the session crosses a context boundary, `brief.md` plus this file must
be enough to resume cold. Keep it current as you go — it is not a write-once document.

---

## Status

**In progress (2026-09-26) — mechanism complete; docs/review/coverage next; split proposed.** Required reading done — every file exists and every plan section says
what the brief claims (no missing-input gap). Base builds; `rushx test` green (100 %, ~100 s).
Design below; falsifier tests are written before the disposition path.

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

- [x] **repo-wide `rush rebuild` on `064bdff24`: exit 0, zero warnings, all 31 projects, 4m06s**
      (orchestrator, 2026-09-26). Your base compiles clean.

A repo-wide `rush test` was **not** run on the merge, deliberately. The `release`-up merge is the
union of two independently CI-green trees and its only conflict resolution was in
`docs/TECH_DEBT.md`; nothing in `ts-agent-tasks` consumes `ts-extras`, so the merge introduces no new
call path and widens no accepted set. A rebuild is the right gate for that shape. **This reasoning
does not transfer to your own work** — T8 unblocking `archive` *is* a widened accepted set that moves
no signature, so the repo-wide `test` gate in your acceptance criteria is load-bearing and not
satisfied by this note.

## Design (decided 2026-09-26, against base `064bdff24`)

**Found on the base, and the reason the falsifier matters.** `commitRules.checkUpdates` lets *any*
`maintenance` commit drop a **required** update with no evidence check, and lets any commit drop a
non-required one (T7 leaned on this: "a dropped update releases its owed link"). No production path
does either today (the broker carries every update forward), but it is exactly the "drop it and free
the slot" implementation waiting to be called. T8 replaces the rule:

- an update with an audience may leave a record only when **every** audience member's durable
  consumer record — read through the checkpoint store and fingerprint-verified, never the resident
  index alone — holds its id in `acknowledged` or `disposed`, and no unacknowledged issued manifest
  in any audience record names it (a pin); or
- it is a non-required (`progress`/`observation`) update **superseded** in the same commit by a newer
  update of the same category, every still-owed audience member has `coalesceProgress: true`, and
  none pins it (coalescing).
- Nothing else. A consumer record that cannot be read or verified fences and refuses — never skipped.

**Consumer record.** Gains `state: 'active' | 'closed'` and `disposed: [{updateId, reason}]`
(reason ≤ `maxDispositionReasonBytes`, encoded). `acknowledged ∩ disposed = ∅`; history counts both.
`maxAcknowledgementEvidenceBytes` must now cover one disposition entry (validated). Acknowledged or
disposed **baseline** payloads are dropped from the record in the same write (their id stays).

**Disposition** (obligation ends without acknowledgement): storage `disposeObligations`; broker
`TaskBroker.dispose(binding, request)` — a trusted host operation, policy-checked
`dispose-obligation` per task, epoch- and record-revision-fenced in the committing writer section,
like `acknowledge`. Each id must be owed; a pinned id is refused (`conflict`: abandon or acknowledge
the receipt first). Converts the reservation (owed evidence → history); needs no new capacity.

**Closure**: `TaskBroker.closeSubscription(binding, {subscriptionId, obligations: 'retain'|'dispose',
reason})`. Closed = leaves every audience and potential audience (future-unit reservation released);
`retain` keeps owed obligations owed and drainable through its bound delivery (pending/prepare/ack
still work, prepare presents owed updates only); `dispose` abandons its outstanding manifests and
disposes every owed id in the same write. The record, its identity slot and its history are retained
(no recycling). The preparation claim is released once a closed subscription owes nothing.

**Pruning**: storage `pruneTask(taskId)` (maintenance commit dropping every discharged, unpinned
update); broker `TaskBroker.cleanup({limit})` pump over an index-maintained prunable set (candidate
list only — storage re-verifies). **Archive** = one atomic replacement to a tombstone with
`updates: []`; storage refuses an archive while any update is undischarged/pinned, any command is
unsettled or awaiting, or any subscription is still owed a baseline for the task.

**Held commands**: `TaskBroker.abandonCommand(binding, {taskId, operationId, reason})` — policy
`dispose-obligation`; settles the command with a new receipt state
`{state: 'abandoned', reason, from: 'not-sent'|'possibly-sent'|'awaiting-feed'}` — never
`applied`/`rejected`; consumes the settlement claim. Storage admits `abandoned` only from those states.

**Source-replay registered after the feed passed** — *enforce, by the cursor*: on a `source-replay`
checkpoint an `unknown-binding` revision stops the pass with the cursor unmoved (design § 8.6: never
advance a replay cursor over an uncommitted required event) and reports it; registering the binding
lets the next pass apply it. `observed-state` keeps moving on.

**Coalescing**: policy gains `coalesceProgress` (default `false`).

## Work log

- 2026-09-26: read everything; design above.
- Falsifiers first (`storage/pruning.test.ts`): on the base, a maintenance commit dropped an owed
  required update and freed its capacity (**red**); a prune after the checkpoint store lost the
  record succeeded (**red**). Both green after the retention rule (commit f4f652a1 on this branch).
- Storage mechanism (f4f652a1), broker surface (2b4b0ec9), source-replay cursor stop + outstanding
  report, real-Node crash cases for dispose/cleanup/archive. Full suite green (1,665 tests) on each.
- Re-decided T7/T3 tests that pinned the replaced behaviour — recorded for `result.md`:
  `delivery/retention.test.ts` (rewritten: 2 survive, the "blocked even once acknowledged" test is
  inverted), `storage/subscriptions.test.ts` (3: drop-releases-link → refused unless coalescing;
  drop-and-add at limit → needs a coalescing subscription), `storage/commit.test.ts` (required
  pruned only by maintenance → any commit may drop an update owed to no one),
  `storage/query.test.ts` + `conformance.ts` check (owed survives archive → owed holds archive),
  `delivery/accounting.test.ts` (acknowledged baseline stays in record → leaves it),
  `broker/sourceReconcile.test.ts` (two-spellings test used an unregistered reference).

## Layer 1 (`code-reviewer`, before coverage closure) — applied

- **P1.1** retention refusals named the subscription in `.message` on every commit path, redacted by
  a regex only in `archive`. Fixed at the source: storage messages name no subscription (baseline
  refusal no longer counts subscribers); the broker wrapper is gone.
- **P1.2** ~40 new `(T8)`/`(T7: …)` tags in comments and test names. Stripped; durable wording kept.
- **P2.3** coalescing marker aggregation: the "one marker per category per commit" invariant holds
  structurally (update identity is task+revision+category); a check for it would be dead code, so it
  is documented at the site instead.
- **P2.4** `abandonCommand` did not retry a benign revision race like its siblings. Aligned: bounded
  retry, then `conflict`/`safe`; tests updated (keeps-moving → refused; moves once → succeeds).
- **P3.5** non-null reads in `cleanup`/`_prune` rest on "no physical deletion" — kept, commented at
  the site; deletion is out of scope under A3. **P3.6** `_taskOf` hand-decodes an update id — kept
  (verified against both encodings); a shared decoder is a follow-up, not a defect.

## Independent persistence/delivery antagonist — applied

- **MED** an expired, never-abandoned manifest still pinned its ids, so `dispose` refused them
  (explicit error, not absence — but contrary to design § 9 "expiry releases receipt pins"). Fixed:
  `ITaskObligationDisposal.at`; an expired manifest pins nothing and is evicted by the disposal's own
  write. Coalescing still treats an expired unacknowledged manifest as a pin (conservative: it keeps
  more, and the host can abandon); noted for `result.md`.
- Checked sound by the pass (recorded in its report): checkpoint-before-prune ordering, corruption
  fences cleanup, `acknowledged ∩ disposed = ∅`, crash cases, archive removes every update with no
  coalescing exception, baseline gate, closed-audience exclusion, retain/dispose closure, close's
  in-writer recapture, abandon consumes the settlement claim once, the replay cursor stop, uniform
  fence-then-commit, `_abandonmentProblem`, `_taskOf` cannot confuse tasks.
- Lint on the full build also found `repository.ts` over the 2,000-line limit: retention logic moved
  to `storage/retention.ts`, graph/profile rules to `storage/graphRules.ts`.

## Split proposal (raised 2026-09-26, orchestrator's decision)

Mechanism is complete at +4,145/−189 over 50 files, before docs, coverage closure and review
rounds. The remaining deliverables — the full A3 saturation-journey matrix for every § 8.6
dimension with exact used/reserved transfers across crash points, the profile arithmetic and
decision, and the M1 cohort run — are a second, separable body of work that depends on the
mechanism but on nothing in it being reshaped. **Proposed:** PR 1 = mechanism + host runbook +
its reviews (this branch); PR 2 = A3 journeys + profile qualification + M1, off `integration`
after PR 1 lands. I am continuing PR 1's docs/review/coverage work, which is needed either way.

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
   → **Raised** — see *Split proposal* above.

## Copilot round 1 (#698) — applied except one

- **Coalescing trusted the writer's `required` flag** (three threads: converter, retention rule,
  `supersedable`). A lifecycle update carrying `required: false` and a `coalesced` marker passed the
  converter, and the retention rule and `supersedable` then treated it as routine. Fixed at every
  site: the converter refuses a marker on any required *category*; `checkRetention` and
  `isSupersedable` decide from `isRequiredCategory(category)`, never the flag. `isRequiredCategory`
  moved to `types/updates.ts` beside `allUpdateCategories` so the converters can use it (still
  exported from the package barrel; no consumer outside the package). Not taken: refusing every
  update whose flag disagrees with its category. The renderer's public input contract accepts such
  updates (its tests rely on required routine updates and routine lifecycle ones), and once no drop
  decision reads the flag, the downgrade no longer loses anything.
- **A disposal with nothing new to dispose did not evict an expired manifest**, so that manifest
  kept its preparation claim. Fixed: the no-op path writes the filtered `issued` when expiry removed
  anything. Closure takes no clock; expired manifests there are evicted by the next issuance or
  disposal, as before.
- **Declined — a migration for T7-written consumer records.** `ts-agent-tasks` has never been
  published and is on the active-development list with "breaking changes land freely with no shim"
  (`.ai/instructions/ACTIVE_DEVELOPMENT.md`). T6 and T7 both changed stored record shapes under
  `formatVersion: 1` on this integration branch for the same reason. The change file carries
  `BREAKING:`.
- Revert checks: each fix's new test goes red with the fix reverted (converter 1/16, pruning 1/4,
  disposition 1/28). Suite 1,702 tests in 70 suites, 100 % on every metric, zero `c8 ignore`; `rushx
  build`/`lint` zero warnings.

## Copilot round 2 (#698) — applied

CI green on `1103ea93`; round 1's five threads recorded as resolved. One posted "previously missed"
finding and two summary-only ones (not posted as threads), all verified and applied:

- **Closing with `dispose` when nothing is owed kept open receipts.** Reachable with overlapping
  receipts: the newer one acknowledged discharges the id the older one names, so nothing is owed and
  the no-op path left the older manifest holding its preparation claim. Now `dispose` always drops
  unacknowledged manifests; the no-op applies only when that changes nothing.
- **Context normalization ignored `coalesced`** when merging copies of one update id, so two copies
  claiming different gaps collapsed silently. The marker is now part of the consistency key; copies
  that disagree are a conflict.
- **An archive could keep an update owed to no one**, so the tombstone was not payload-free. Storage
  now refuses an archiving commit that keeps any update (`invalid`). The test fixtures and the
  shipped conformance helper (`_commitChange`) had archived while keeping such updates; they now drop
  them. `runTaskRepositoryConformance` has no consumer outside the package.
- Revert checks: each new test goes red with its fix reverted (disposition 1/30, renderer 1/71,
  disposition 1/30). Suite 1,705 tests in 70 suites, 100 % every metric, zero `c8 ignore`; `rushx
  build`/`lint` zero warnings.
