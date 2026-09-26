# Result — `agent-tasks-t7`

**Shipped:** Subscriptions and exact acknowledgement — a host subscribes a consumer to a task selection with a persisted delivery policy and an optional current-state baseline; every accepted update's audience is computed and verified by storage and its acknowledgement evidence is spent from the claims that already reserved it; a bound delivery prepares a context whose exact receipt manifest is committed before the context is returned, and acknowledges only the exact update ids an unexpired issued receipt named — never a revision watermark — through a checkpoint store that is read back and fenced rather than believed.

**T7 does not close the stream.** Artifacts stay in `.ai/tasks/active/agent-tasks-t7/`; this family
finalizes at cluster close. Written 2026-09-25.

---

## What shipped

- **Types** (`types/delivery.ts`): `ITaskDeliveryPolicy` (`durability`, `history`, `categories`;
  `attention`, `lifecycle`, `result` are mandatory), `ITaskSubscriptionSpecification`,
  `ITaskSubscription`, `ITaskConsumerRecord` (the persisted subscription: registration, selection,
  start, policy, baseline, the exact sorted `acknowledged` id set, and the issued manifests keyed by
  delivery id), `IIssuedTaskReceipt`, the synchronous `ITaskCheckpointStore` port, and the broker
  surface `ISubscribeRequest`, `IBoundTaskDeliveryParams`, `IBoundTaskDelivery`,
  `ITaskDeliveryPage`, `IPreparedTaskContext`, `IAcknowledgementResult`. Converters in
  `TaskConverters.delivery`.
- **Storage** owns subscriptions. A consumer record `consumer-<id>.json` is named in the manifest's
  `consumers` inventory and persisted through an injected `ITaskCheckpointStore` (default
  `FileTreeCheckpointStore` in the repository's own root). Writer operations `registerSubscription`,
  `readSubscription`, `issueReceipt`, `acknowledgeReceipt`, `abandonReceipt`; reads
  `subscription(id)` and `audience(before, after, category)`.
- **Audience** is storage's, not the caller's. An update of category `C` at a commit `(before,
  after)` is owed to active subscription `S` iff `C ∈ S.policy.categories` and `S`'s selection
  matches `before` **or** `after` — so open-only, status- and parent-filtered subscriptions keep
  their exit updates. Every new update's audience is recomputed inside the commit and a mismatch is
  `invalid`. The internal `createTaskBroker(params, resolver)` seam and `noAudience` are gone; the
  broker plans with `repository.audience`.
- **Broker**: `TaskBroker.subscribe(binding, request)` (host operation, bounded baseline capture),
  `TaskBroker.bindDelivery(params)` → `pending` / `prepare` / `acknowledge` / `abandon`;
  `ITaskDeliveryDefaults` on `TaskBroker.create({ delivery })` (receipt lifetime, baseline bound,
  default policy fields — used only at subscription creation, never re-read).
- **Open** reads every consumer record through the store, verifies its claims and byte ceiling,
  joins exact history against retained audiences (a link already acknowledged is satisfied by id),
  rebuilds the delivery book and its ledger entries, and completes an interrupted activation whose
  record landed.

## The exact-ID design (and why it is not a watermark)

A consumer record holds **the exact set of update ids it has acknowledged**, sorted, and nothing
resembling "acknowledged through revision N". The only way the set grows is
`acknowledgeReceipt(deliveryId)` against an issued manifest: storage adds exactly the manifest's ids
that are still owed and marks the manifest acknowledged. `TaskIndex` tracks satisfied links by
exact id while the payload is retained, and a later commit of the same task cannot un-satisfy one.

The falsifier (`receipts.test.ts`, *"a receipt that omits revision-3 attention and includes
revision-4 progress does not clear revision 3"*): a revision-3 attention change whose 3,000-character
description is cleared at revision 4 by a progress update; a 1,500-character budget makes the
renderer include revision 4 and omit revision 3; acknowledging that receipt clears revision 4's id
and leaves revision 3 owed. A watermark implementation turns it red (checked; see revert matrix).

## How the T6 claims were spent, not minted

A commit's growth now includes the acknowledgement evidence of every audience link it adds:
`acknowledgement-ids` +1 and `logical-bytes` +E per link (`E = maxAcknowledgementEvidenceBytes`,
512). The existing spend order — settlement → replay → resolution/closeout — takes that growth out
of the task's own claims, and the consumer's **derived** owed reservation grows by exactly the same
amount. Net repository-wide change for a protected step: **zero**. The closeout, settlement and
resolution bundles' `logical-bytes` now include `links × E` so they can pay it.

Pinned by the charge, not the behaviour — `accounting.test.ts`:

- *"a terminal transition owed to a subscription moves its evidence out of the closeout: one charge,
  not two"*: every repository-wide dimension is unchanged across the terminal step; the closeout's
  `acknowledgement-ids` drops by exactly 2 (to `7 × 32 − 2`); the consumer's reservation rises by 2.
  Minting would leave every functional test green and count the evidence twice; removing the
  evidence growth turns this test red.
- *"a settling external command spends T6's settlement claim for its links"* (residual `32 − links`)
  and *"a source-replay feed revision spends T6's replay envelope for its links"*.
- *"at exact acknowledgement-id saturation, the terminal transition is still accepted"*.
- *"ordinary work owed to a subscription is admitted as new growth — it has no claim to spend"*.

## Ordering guarantees — each window and its re-check

| # | window | what re-checks after it |
|---|---|---|
| W1 | subscribe: baseline capture + per-task authorization (outside the writer) → activation | inside the writer: policy epoch unchanged, and the selection re-queried with its matched `(taskId, revision)` set identical to the capture; otherwise recapture (3 attempts, then `conflict`/`safe`). A terminal transition or a new task in the gap lands in the baseline (tests) |
| W2 | subscribe authority (`allows subscribe`) → activation | covered by W1's epoch fence |
| W3 | activation protocol: pending entry → consumer record → live entry | the pending entry holds the `subscription-activation` claim before the record is written; open completes a pending entry whose record landed and matches, keeps the reservation for one whose record did not; a retry resumes with the same claim id or adopts the landed record; a different landed record is `conflict`. Real-Node `SIGKILL` at every rename boundary (`delivery/crash.test.ts`) |
| W4 | accepted update → its evidence reservation | none needed: storage computes the audience and charges the evidence inside the same atomic commit that accepts the update; an audience that differs is refused |
| W5 | activation ↔ a concurrent commit | both in the single writer: a commit before activation is in the baseline (W1), after it owes the subscription |
| W6 | prepare: capture owed + current tasks, authorize, project, render (outside the writer) → issue | inside the writer: epoch, the consumer's record revision (an acknowledgement or issue by anyone moves it, so every owed id the render included is still owed), and **the task revision of every current task the capture disclosed** (added after layer 1); otherwise re-render, 3 attempts then `conflict`/`safe`. Storage independently refuses a manifest naming an id the subscription is neither owed nor has acknowledged (`invalid-receipt`, safe to retry) |
| W7 | issue → host processing → acknowledge | the manifest is committed before the context is returned; any issuance failure returns nothing acknowledgeable; acknowledgement happens only when the host presents the receipt after its own processing boundary. Abort = never presented = nothing acknowledged |
| W8 | acknowledge: canonical manifest match → per-entry authorization (outside the writer) → commit | a second gated section re-matches the manifest (abandoned/expired since), rechecks the epoch, and **re-reads every authorized task's record revision** (added after layer 1; a moved task re-runs the whole round, 3 attempts, then `conflict`/`safe`) before storage acknowledges with the consumer's expected record revision; **the expiry instant is read inside that section** (Copilot round 3), so a receipt that expired during authorization is refused |
| W9 | storage ack/issue/abandon: read consumer record → write | the read is fingerprint-verified against committed state; the write carries the expected record revision; the write is read back and a store that reports a write it does not hold fences the repository (`storage-corrupt`); `unknown` visibility fences and answers `reconcile-first` |
| W10 | abandon | in-writer read then abandon with the expected record revision |
| W11 | open → consumer state | open reads each named record through the store, refuses a stray, missing, foreign or over-ceiling record, joins exact history into satisfied links, and uses the **persisted** policy — changed host defaults do not reach an existing subscription |
| W12 | `pending()` | read-only; each owed payload is its frozen revision, authorized against its own snapshot and projected; a hidden one is counted as `withheld` and stays owed |
| W13 | bind → delivery | consumer identity is checked at bind; a subscription's owner cannot change (only T8 closure removes one) |

## Reservation arithmetic (A3) and the new ceiling

Implemented, not merely tight. Per update, per subscription and per activation:

- **Per accepted update link**: 1 `acknowledgement-ids` + E (512 B) `logical-bytes`, spent from the
  task's claim on protected steps, admitted as growth otherwise; held by the consumer as its owed
  reservation until the exact id lands in history, where it stays for the subscription's lifetime.
- **Per task, closeout**: the bundle already reserved `7 × 32 = 224` links; it now also reserves
  `224 × 512 B = 112 KiB` of `logical-bytes`, so a registration's logical closeout is **1,168 KiB**
  → ⌊512 MiB / 1,168 KiB⌋ = **448** tasks on `logical-bytes`; `acknowledgement-ids` 224 per task →
  ⌊200,000 / 224⌋ = **892**.
- **Per subscription**: one `receipt-preparation` claim of `max(0, 64 KiB − Σ outstanding manifest
  bytes)` record and logical bytes (the reusable cleanup preparation: the first manifest converts
  it, eviction restores it, neither grows `used + reserved`), plus on its own record
  `(owed + units × |categories|) × E` record bytes, where `units` counts future updates of every
  task it can cover (2 unresolved / 1 open / 0 terminal, + unsettled commands + remaining replay
  updates). Per-owner: `history + owed + units × |categories| ≤ maxAcknowledgementIdsPerSubscription`.
- **Activation**: a `subscription-activation` claim on the pending inventory entry covering the first
  record's full footprint (+256 B slack), consumed when the entry goes live.
- **Potential audience cap**: at most `maxAudiencePerUpdate` (32) active subscriptions may
  catalog-match a non-archived task — exactly what every claim already reserved per update. A 33rd
  is `backpressure` on `audience-links` at activation, registration or move.

**Resident payload is unchanged by the evidence: 448 KiB per registration → ceiling 146; 128 with one
in-flight command per task.** `logical-bytes` (448) and `acknowledgement-ids` (892) bind later.
**New:** a `current` subscription's baseline holds one payload per covered task (≤ 64 KiB) of
`resident-payload-bytes` until acknowledged. With `k` current subscriptions covering every task the
worst case is ⌊64 MiB / (448 KiB + 64 KiB·k)⌋ — **128** for k = 1, **113** for k = 1 plus one
in-flight command. The declared 1,000 is further out of reach; that strengthens T8's case.

**Profile inconsistency found (routed to T8):** a subscription's record reserves E record bytes per
owed or future link, so `maxConsumerRecordBytes` (8 MiB) admits at most ⌊8 MiB / 512 B⌋ = 16,384 of
them (less the 64 KiB preparation and any baseline), while `maxAcknowledgementIdsPerSubscription`
advertises 50,000. The per-subscription id limit is unreachable as reserved obligations; the
record-byte ceiling binds first.

## What filling the audience seam did to `retention-blocked` (evidence for T8)

`archive` still refuses a terminal task while any retained update names an audience. Before T7 no
update ever had one. Now, with one matching subscription, **every** task it covers is
retention-blocked at archive, and it **stays blocked after every id is acknowledged**, because T7
never prunes a stored audience (`retention.test.ts`, *"a matching subscription makes every terminal
task retention-blocked — even once fully acknowledged"*). A non-matching subscription blocks nothing.
In short: with any subscription whose selection covers a task, archive of that task is impossible
until T8's acknowledgement/disposition pruning exists. Also observed: "archive and close do not
reduce a subscription's lifetime charge" can only be shown on tasks owed nothing, since no task a
subscription was owed can be archived in T7.

## Acceptance evidence

| acceptance | evidence |
|---|---|
| audience seam filled; evidence reserved before acceptance | W4; `accounting.test.ts` spend tests; storage refuses a caller-chosen audience (`subscriptions.test.ts`, `edges.test.ts`) |
| spend, not mint — one ledger entry, not two | *"… one charge, not two"* (above) |
| exact-ID falsifier | `receipts.test.ts` falsifier + *"an old receipt cannot consume an obligation committed after it was issued"* |
| adversarial receipts | fabricated id, modified task/revision/update list, shortened, enlarged, duplicates, foreign subscription, foreign store, snapshot-only, malformed, replay before ack / after ack / after expiry, abandoned — one `invalid-receipt` answer, and the record unchanged |
| fail-closed custom stores | `checkpoints.test.ts`: throwing, stale, foreign, garbage, fail-unchanged, fail-unknown, not-a-result, and a store that **stops persisting** — no acknowledgeable context, no reported acknowledgement |
| neutered double goes red | making `InMemoryCheckpointStore.write` store nothing turns **22 of 28** checkpoint tests red (final source) |
| host processing precedes checkpoint commit | *"prepare writes a manifest and acknowledges nothing; the renderer writes nothing"*; abort / abstention tests |
| no subscribe/mutate gap | W1 tests: terminal transition and task creation in the gap, bounded recapture, epoch move |
| B's baseline independent of A's acks | `subscribe.test.ts` |
| pending uses stored audiences; exit updates kept | open-only, status- and parent-filtered tests |
| persisted policy authoritative across reopen | *"reopening under changed host defaults …"* |
| replay-incompatible selection/admission refused | three `source-replay` tests |
| reassignment + two consumers + reopen | *"checkpoints stay independent across a reassignment and a reopen"* |
| A3: activation crash with pending claims | `subscriptions.test.ts` (FaultyRoot) and `crash.test.ts` (real Node) |
| A3: conversion after ack-before-cleanup crash | *"after an acknowledgement and a restart before any cleanup, the join counts it once"*; real-Node ack crash tests |
| A3: duplicate receipts no second slot | `accounting.test.ts`, `receipts.test.ts` |
| A3: lifetime history independent of open/archived | *"grows with acknowledgements, independently …, and survives reopen"* |
| A3: expired manifests evicted separately from history | *"the first manifest converts the reservation; eviction and abandonment restore it; history stays"* |
| A3: prepare/ack drain at saturation | *"with every additive dimension exactly full, new work is refused and delivery still drains"* |

**Revert check — run on the final source.** 22 protections reverted one at a time; every one turns
its tests red (failing tests in parentheses):

| # | protection reverted | red |
|---|---|---|
| M1 | acknowledgement evidence not added to commit growth (mint instead of spend) | 5 |
| M2 | acknowledgement by per-task watermark instead of exact ids | 1 (the falsifier) |
| M3 | no exact-ID join at open | 2 |
| M4 | no read-back after a checkpoint write | 5 |
| M5 | caller-chosen audience accepted | 3 |
| M6 | potential-audience cap off | 1 |
| M7 | source-replay compatibility off | 2 |
| M8 | subscribe: no epoch recheck in the activating writer | 1 |
| M9 | subscribe: no re-query of the captured selection | 3 |
| M10 | prepare: no consumer record-revision recheck | 1 |
| M11 | prepare: no task-revision fence (W6) | 2 |
| M12 | acknowledge: no record-revision fence (W8) | 3 |
| M13 | acknowledge: no canonical receipt match | 3 |
| M14 | acknowledge: no per-entry authorization | 3 |
| M15 | acknowledge: no epoch recheck in the committing section | 1 |
| M16 | storage: an expired manifest acknowledged | 3 |
| M17 | storage: issue without the owed-or-acknowledged check | 4 |
| M18 | storage: acknowledging an id no longer owed | 1 |
| M19 | a session store accepted under a process-crash repository | 1 |
| M20 | per-subscription history limit off | 2 |
| M21 | test double: the checkpoint store stops persisting | 22 |
| M22 | a dropped update releases no owed link at admission | 1 |

M8 and M22 turned nothing red on the first run: the epoch test only asserted success, and no test
exercised a drop at the admission limit. Both tests were strengthened (the new epoch now hides the
task; a drop-and-add at exactly the per-subscription limit) and re-run red.

## Deviations from the design sketch

- `ITaskCheckpointStore` is **synchronous**: the whole storage layer (open's scan, the commit path)
  is synchronous; an async store would make open async for no consumer need.
- The policy field is `categories` (strictly ascending, mandatory three included). `coalesceProgress`,
  `disposed` and `closed` are not implemented — they belong to T8's disposition and closure.
- T1's unused `subscription-acknowledgement` claim purpose is replaced by `subscription-activation`:
  a per-link stored claim would be committed in one record and consumed in another; the derived
  owed reservation has no such window.
- The consumer record carries a `registration` field (operation id, principal key) for replay.
- A registration that adopts a record left by a crash verifies its audience as a **subset** of the
  current one (the record was accepted under the audience of its time).

## T1 vocabulary: revisions and decisions

- **Revised:** capacity purpose `subscription-acknowledgement` → `subscription-activation
  {subscriptionId}`; `maxUpdateIdSuffixLength` 19 → 25 (baseline ids `<task>:<rev>:initial`);
  new encoded bound `maxAcknowledgementEvidenceBytes` (512, validated ≥ id length + suffix + 3).
- **Additive persisted fields:** manifest `consumers` inventory entries (pending / live); repository
  report `completedSubscriptions`, `pendingSubscriptions`.
- **Removed:** the unused `ITaskRecordHeader`.
- **Exercised for the first time:** `UpdateCategory` as a subscription filter; `invalid-receipt`.

## Review

*(Layer 1 below; the Copilot loop after it, round by round.)*

**Layer 1 (`code-reviewer`, before coverage closure).** No P1. Two P2, both fixed:
1. `acknowledge` re-checked the epoch in its committing section but not per-task authorization — a
   task reassigned (without an epoch move) between the authorization loop and the commit could be
   acknowledged on a stale decision. Fixed: the committing section re-reads every authorized task's
   record revision; a moved task re-runs the round (W8). `windows.test.ts` — removing the fence turns
   3 tests red.
2. `prepare` disclosed current-task summaries authorized at capture without a commit-time fence.
   Fixed: task-revision fence in the issuing section (W6). Removing it turns 2 tests red.
P3: four dead members removed (`selectionOf`, `DeliveryBook.fitsHistory`, `TaskIndex.owedLinksOf`,
`CapacityLedger.remove`). Confirmed correct by the reviewer: exact-ID path, fail-closed store handling,
adversarial coverage, no double counting in the delivery book.

**Copilot round 1** — three findings, all real, all fixed (each revert-checked red on the fixed source):

| # | finding | fix | revert |
|---|---|---|---|
| R1.1 | the default `FileTreeCheckpointStore.write` ignored `expectedRecordRevision`, so an out-of-band record could be overwritten before the read-back, which would then match | compare-and-write: the current record's revision is read first; a mismatch, an unreadable record or one with no revision is `unchanged` and nothing is written | M23 (1) |
| R1.2 | adopting a landed first record checked only revision, identity and the activation claim id — a same-identity record with a forged **baseline** would be activated | the pending inventory entry now carries `recordFingerprint`, the canonical fingerprint of the exact first record it committed to write; a landed record is adopted (on resume, and completed at open) only when it matches. A resume whose record never landed re-pends under its own new first record before writing it | M24 (3) |
| R1.3 | `CheckpointPort.readValue` captured only the call to `store.read` and chained on its raw answer, so a non-Result answer threw outside the capture | the answer is interpreted inside the capture; a value JSON cannot express is a failed read, not "no record" | M25 (3), M26 (1) |

R1.2 replaces the identity and activation-claim comparisons (the fingerprint covers them) and adds a
persisted field to the pending inventory entry — additive on an unreleased surface.

**Copilot round 2** — two findings, both real, both fixed and revert-checked:

| # | finding | fix | revert |
|---|---|---|---|
| R2.1 | the compare-and-write checked only the current record's revision — another subscription's valid record at the same revision would have been overwritten, and the read-back would then match | the current record's `id` must be this subscription's too; otherwise `unchanged`, nothing written | M27 (1) |
| R2.2 | an acknowledged baseline payload was still charged as `resident-payload-bytes`, though the index had released it — acknowledged baselines could exhaust the resident budget | the subscription's resident charge counts only unacknowledged baseline payloads; the payload stays in the record (record and logical bytes) as exact history. This is what the arithmetic above already stated | M28 (1) |

Also in this round: a `no-useless-concat` lint warning that the commit hook's prettier created after
the local lint ran (CI red on the round-1 head). Lint now runs on the committed tree before pushing.

**Copilot round 3** — three findings; two real and fixed, one already enforced:

| # | finding | disposition | revert |
|---|---|---|---|
| R3.1 | `subscribe` sent the selection's scopes to the policy without confining them to the binding's selectors — a binding over `alpha` could subscribe over `beta`, reserving and retaining updates it can never see | fixed: a selection scope outside the binding is `invalid` before the policy is asked, as `changeScopes` already does | M29 (1) |
| R3.2 | the acknowledgement's instant was read before the per-task authorization loop, so a receipt that expired during it was judged by the earlier time | fixed: the clock is read inside the committing section, immediately before storage acknowledges (a new window row, W8) | M30 (1; manual: the clock read moved back before authorization) |
| R3.3 | open bounds an audience's length but does not check its members are live subscriptions | already enforced: open blocks (`integrity`) on any stored audience naming a subscription the inventory does not hold live (`openRepository.ts`, test *"a stored update naming a subscription that is not live blocks open"*). Recomputing the audience a past commit *should* have had is not possible at open — it depended on the subscriptions active at that commit and on its `before` state — and is enforced at commit time instead | — |

## Coverage closure

Closed after layer 1, to 100 % statements/branches/functions/lines with **zero `c8 ignore`**. Branches
that cannot execute were removed rather than tested: `subscribe` no longer re-converts a policy
assembled from already-converted fields (broker delivery defaults are now converted whole, by the new
`TaskConverters.delivery.policyOverrides`, at `TaskBroker.create`); `prepare` no longer treats an
`invalid-receipt` from issue as a re-render signal (the unchanged consumer revision already proves
every included id is still owed); a bound delivery's subscription, a fenced task's record and an
active subscription's units are asserted present rather than defaulted; `_replace` requires the
manifests it recomputes from. Two branches a coverage pass judged dead were reachable and are tested:
storage permits any commit to drop a **non-required** update, which releases its owed link without an
acknowledgement and makes a receipt that named it `invalid-receipt`.

## Gates

`rushx build` (zero warnings), `rushx lint`, `rushx fixlint` (no changes), `rushx test` — **1,587
tests, 100 % statements/branches/functions/lines, zero `c8 ignore`**. `rush change --verify
--target-branch origin/integration/agent-tasks-v1`; repo-wide `rush rebuild` and `rush test` (both
exit 0); `verify-capability-docs`, `generate-capability-feed --check`, `verify-esm-entrypoints`,
`verify-bundler-resolution`, `verify-tarball-exports` — all pass on the final source. PR:
[#695](https://github.com/ErikFortune/fgv/pull/695).

## Hand-offs (routed to `docs/TECH_DEBT.md`)

1. **T8** — `archive` is `retention-blocked` for every task a subscription covers, even fully
   acknowledged; T8's pruning against exact history and disposition evidence is what unblocks it.
2. **T8** — `maxConsumerRecordBytes / E` (16,384) is below `maxAcknowledgementIdsPerSubscription`
   (50,000); qualify one against the other.
3. **T8** — subscription closure/disposition (`closed`, `disposed`, `coalesceProgress`) and the
   capacity each releases; T7 subscriptions are only ever active.
4. **T8** — baseline payloads hold resident bytes until acknowledged; the capacity entry now states
   the per-subscription term.
