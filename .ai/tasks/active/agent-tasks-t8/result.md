# Result — `agent-tasks-t8` (PR 1 of the proposed split: the retention mechanism)

**Shipped:** Retention — an owed task update now leaves its record only when every audience member's durable checkpoint holds its exact id as acknowledged or disposed, so archive works under subscriptions and writes a payload-free tombstone; hosts can dispose obligations, close subscriptions, abandon commands whose outcome is unknown and prune discharged payloads, each authorized and recorded, and every incomplete operation is reportable.

**T8 does not close the stream.** Artifacts stay in `.ai/tasks/active/agent-tasks-t8/`; this family
finalizes at cluster close. Written 2026-09-26. The A3 saturation-journey matrix, the profile
decision and the M1 cohort run are proposed as a second PR (see *Scope of this PR*).

---

## Scope of this PR

The brief asked me to raise a split if the mechanism was clearly separable from the saturation matrix
and profile qualification. It is, and it is raised (`state.md` § *Split proposal*):

- **This PR:** disposition, closure, coalescing, pins, tombstone archive with pruning, the retention
  rule in storage, command abandonment, the source-replay registration gap, the outstanding-work
  report, crash cases, the host runbook, and both review gates.
- **Proposed PR 2:** the full A3 journey for every § 8.6 dimension with exact used/reserved transfers
  at every crash point, lifetime acknowledgement exhaustion across closed subscriptions, the profile
  decision (arithmetic below), and the M1 cohorts on the final source. **Not delivered here; not
  claimed.** The profile arithmetic is delivered because it needs no code and informs the decision.

## What unblocks `archive`

T7 left every task a matching subscription covers permanently `retention-blocked`, because nothing
pruned a stored audience. Now:

- **The retention rule lives in storage** (`storage/retention.ts` `checkRetention`, run on every
  commit): an update with an audience may be dropped only when each audience member's consumer record
  — read through the checkpoint store and fingerprint-verified against what was committed, **never the
  resident index** — holds its id in `acknowledged` or `disposed`; or when it is a routine update
  superseded in the same commit by a `coalesced`-marked newer update, for active subscriptions that
  opted into `coalesceProgress`, with no unexpired unacknowledged receipt naming it.
- **Archive** is one atomic replacement to a tombstone with `updates: []`; storage refuses it while
  any update with an audience would remain, or any baseline for the task is still owed (a command
  unsettled or awaiting its feed was already refused by the purpose rules).
- **Found on the base:** `checkUpdates` let *any* `maintenance` commit drop an owed required update,
  freeing its capacity, with no evidence at all. No production path did it, but it was the "drop it
  and free the slot" implementation waiting to be called. It is gone.

### T7's (and T3's) tests that pinned the replaced behaviour — decided per test

| test | decision | why |
|---|---|---|
| `delivery/retention.test.ts` "no subscription … archives" | **survives** | an update owed to no one is never retained |
| `delivery/retention.test.ts` "… retention-blocked — even once fully acknowledged" | **inverted** | now: refused while owed, admitted once every id is in the history; tombstone has no payloads, slot released |
| `delivery/retention.test.ts` "non-matching subscription does not block" | **survives** | |
| `storage/subscriptions.test.ts` "an owed update a later commit drops is released …" | **replaced** | a routine update no longer leaves undelivered except by marked coalescing for opted-in subscriptions, never over a pin; two tests pin the new rule |
| `storage/subscriptions.test.ts` "a drop releases its owed link inside admission …" | **changed** | the same admission property, now through a coalescing subscription |
| `storage/commit.test.ts` "a required one is pruned only by maintenance" | **changed** | any commit may drop an update owed to no one; an owed one is governed by the retention rule |
| `storage/query.test.ts` + conformance check "owed updates … survive archive" | **changed** | owed updates survive terminal and *hold* archive (`retention-blocked`) |
| `delivery/accounting.test.ts` "acknowledged baseline … record bytes stay" | **changed** | a discharged baseline payload leaves the record in the acknowledging write; its id stays |
| `broker/sourceReconcile.test.ts` "two spellings of one reference" | **fixture changed** | it used a reference no task held, which a replay feed may no longer pass |

## The disposition model

An obligation ends in exactly two ways: the consumer **acknowledges** its exact id (T7), or a host
**disposes** of it with a recorded reason. Nothing else ends one — not expiry, revocation, capacity or
cleanup. Both land in the exact history (`acknowledged` / `disposed`, disjoint), which is retained for
the record's life and consumes the evidence slot the obligation already reserved.

**Who may authorize it:** `TaskBroker.dispose` / `closeSubscription` / `abandonCommand` are trusted
*host* operations (on `TaskBroker`, not on a bound writer or view, so not reachable from a model tool
built over a binding) that **also** require the binding's policy to allow `dispose-obligation` — on
every task a disposal names, on the subscription's scopes for a closure, on the task for an
abandonment. The subscription's selection must lie within the binding's selectors.

**The test a "drop it and free the slot" implementation fails:**

- `storage/pruning.test.ts` *"a maintenance commit cannot drop a required update its audience is
  still owed"* — **red on the base** (the drop succeeded and freed capacity); asserts refusal *and*
  that the owed list, every capacity total and the record revision are unchanged.
- `storage/pruning.test.ts` *"an acknowledged update is not prunable when its evidence is missing from
  the checkpoint store"* — **red on the base**; the index says satisfied, the store lost the record:
  the prune must fence, not proceed.
- `delivery/disposition.test.ts` *"without dispose-obligation authority, nothing is disposed and
  nothing is released"* — owed list, `acknowledgement-ids`, the record's `disposed` and the archive
  refusal all unchanged.
- `broker/sourceCommands.test.ts` *"ends tracking without claiming an outcome …"* — the receipt is
  `{ state: 'abandoned', from: 'possibly-sent' }`, never `applied`/`rejected`, and nothing is resent.

**Closure:** `retain` keeps what is owed owed and drainable (a closed subscription's `prepare` presents
only owed updates); `dispose` abandons unacknowledged receipts and disposes everything owed. Closure
releases the future-update reservation and — once nothing is owed and no receipt is open — the
64 KiB preparation claim. Identity slot and history are lifetime charges; the id is never reused.

**Held commands:** `abandonCommand` settles an unsettled (`not-sent`/`possibly-sent`) or
feed-awaiting command as `abandoned`, naming what was known; storage admits `abandoned` only from
those states and changing nothing else about the command; the settlement claim is consumed once.

**Source-replay registered after the feed passed — enforced, not detected.** A `source-replay` pass
stops with the cursor unmoved at a revision for a binding no task holds (`'unregistered-binding'`);
registering the binding lets the next pass apply it. Design § 8.6 already forbids advancing a replay
cursor over an uncommitted required event, and a gap report after the fact would describe a loss
rather than prevent it. The cost: a source that emits for bindings the host never registers stalls
its own feed, visibly — which is the correct failure for a source that promised replay.

## Check-then-act windows and their re-checks

| # | window | what re-checks after it |
|---|---|---|
| W1 | dispose: per-task `dispose-obligation` authorization (outside the writer) → commit | in the writer: every authorized task's record revision (`fenceHolds`); moved → re-authorize (3 attempts, then `conflict`/`safe`); the policy epoch after the section's last await; the subscription record's revision read in the writer is the store write's expected revision |
| W2 | dispose: owed / pinned / discharged status of each id | decided by storage from the committed record inside the same synchronous write; an unexpired unacknowledged manifest pins; `at` is read in the writer |
| W3 | close: subscription-level authorization + (dispose) per-owed-task authorization → commit | in the writer: the owed task set is recaptured — a task not authorized sends the round again; fence; epoch; storage disposes exactly what is owed at the write |
| W4 | abandon: task authorization → commit | in the writer: the task's record revision equals the authorized one (else re-authorize, 3 attempts); the command's state re-read; epoch |
| W5 | cleanup: candidate list (index) → prune | each prune runs in its own writer section: record re-read uncached, every audience member's evidence read from the store and verified, and re-verified again by the commit's retention check |
| W6 | evidence read → task write | none needed: storage is synchronous — no await between the evidence read and the atomic write |
| W7 | checkpoint commit → prune | the acknowledgement/disposition is written and read back before any prune can see it; a crash between leaves the payload retained and discharged (crash case) |
| W8 | broker coalescing plan (resident index + pins) → commit | storage re-decides every drop from durable evidence; a plan it cannot prove is refused |
| W9 | archive authorization (T5 flow) → tombstone | storage's retention check in the archiving commit |
| W10 | replay pass: binding lookup → cursor | an unregistered binding stops the pass before the cursor save; a registration in between is applied on the next pass |
| W11 | closure → later commits | both in the single writer: after closure the audience never names the subscription |
| W12 | cleanup report | the before/after revision comparison is inside the same writer section as the prune |

## Recovery cases — every one is preserved state, explicit incomplete operation or explicit error

- Crash before/after/returned around the one rename of **dispose**, **cleanup** (after an
  acknowledgement, before task-update cleanup), and **archive** — real Node `SIGKILL`
  (`delivery/retentionCrash.test.ts`, 10 cases): every obligation is still owed or durably discharged;
  retries converge; ledger totals exact. Acknowledgement and activation crash windows remain T7's.
- A checkpoint lost, stale or unreadable at prune/archive time → fence, `storage-corrupt`.
- An expired, unacknowledged receipt → pins nothing at disposal and is evicted (antagonist finding).
- `ITaskRepository.outstanding()` names every incomplete operation: pending registrations and
  subscriptions, unsettled and feed-awaiting commands, prunable tasks, each subscription's owed/pinned.

## Profile arithmetic — the default profile's 1,000 non-archived tasks

Figures from `defaultTaskCapacityProfile` and a constructed maximal update
(`scratchpad/maxupdate.js`: every id at its bound, 32 audience members, a 32 KiB envelope).

**A new finding:** an update is `{ id, taskId, revision, category, required, snapshot: { envelope },
audience, coalesced? }`, and the envelope is bounded at 32 KiB, so **no update can exceed 37,417 bytes**
(36.54 KiB). `maxUpdateBytes` (64 KiB) is unreachable, and the closeout reserves 7 × 64 KiB for
payloads that can never be larger than 7 × 36.54 KiB.

| candidate | per registration (resident) | ceiling at 64 MiB | + 1 in-flight command | + command + 1 `current` sub | resident for 1,000 |
|---|---|---|---|---|---|
| today: 7 × 64 KiB | 448 KiB | **146** | 128 | 113 | 437.5 MiB |
| (d) reserve the derived schema maximum, 7 × 37,417 B | 255.8 KiB | **256** | 224 | 199 | 249.8 MiB |
| (d′) `maxUpdateBytes` = 40 KiB | 280 KiB | 234 | 204 | 182 | 273.4 MiB |
| (d″) derived maximum × 5 categories a terminal commit can actually produce | 182.7 KiB | 358 | 298 | 256 | 178.4 MiB |
| (b) raise `resident-payload-bytes` | 448 KiB | 1,000 needs **437.5 MiB** (500 MiB with one command each) | | | |
| (c) lower `non-archived-tasks` | — | honest value **146** (or 128) | | | |

**(a) "charge actual" is not available for a forward reservation.** The closeout exists to guarantee
that a terminal step not yet taken can be paid; its size is unknown at admission, so the reservation
must be the most it could need. What *can* be tightened is what "the most" means: the schema maximum
is the envelope bound plus fixed framing, not the independent `maxUpdateBytes` — which is (d). The
TECH_DEBT entry's framing of (a) is optimistic in exactly that way.

**(d″) needs a proof this slice has not done:** that no single commit can produce `assignment` or
`relationship` alongside a terminal transition. It is plausible (those are catalog operations, which
are never terminal), but "at most the seven categories" is a design statement and shrinking it is a
design change.

**Recommendation (for the orchestrator; the published profile is unchanged):** adopt (d) — reserve
the derived schema maximum rather than `maxUpdateBytes` (or lower `maxUpdateBytes` to the derived
bound, so the profile says what the schema can do) — **and** (c): advertise the non-archived limit
the profile then actually serves (≈ 200 with ordinary command and subscription use), unless M1 shows
the process can afford (b). 1,000 was never reachable; stating a number that is reachable is worth
more than the round figure. Both belong to PR 2 with the M1 run that must precede any profile change.

**The subscription-record inconsistency (T7 hand-off 2) stands:** `maxConsumerRecordBytes / E` =
8 MiB / 512 B = 16,384 owed-or-future links, below `maxAcknowledgementIdsPerSubscription` (50,000).
Either lower the per-subscription id limit to ~16,000 or raise the consumer record bound to ≥ 25 MiB.
Also PR 2's to decide with the rest of the profile.

## M1

**Not run in this PR** — it qualifies the profile, which is PR 2's. No figure is claimed.

## Review

**Layer 1 (`code-reviewer`, before coverage closure)** — findings and dispositions in `state.md`
§ *Layer 1*: P1 subscriber id in retention refusals (fixed at the source), P1 temporal tags (stripped),
P2 coalescing-marker aggregation (invariant is structural; documented), P2 `abandonCommand` retry
(aligned), two P3s kept with reasons.

**Independent persistence/delivery antagonist** — `state.md` § *Independent … antagonist*: one MED
(expired receipts still pinned at disposal; fixed), and the list of recovery cases it checked sound.

**Copilot** — see the PR.

## Coverage closure

100 % statements/branches/functions/lines, **zero `c8 ignore`**, 1,700 tests in 70 suites (`rushx
test` in `libraries/ts-agent-tasks`). Branches that could not execute were removed, not tested: an
evidence lookup for an audience member no book holds (open refuses such an audience), an
acknowledgement of an id neither acknowledged nor owed (nothing ends an obligation a live manifest
pins), a `required` check in `isSupersedable` (asked only about routine categories), a duplicate
pending-command check in archive (the purpose rules refuse it first), and a `?.` on a closed
audience member of a new update (commits name only active subscriptions). Each site carries the
invariant as a comment.

## Revert checks — on the final source

Each row mutates one protection, rebuilds, runs the full suite (1,700 tests, 70 suites), and restores.
A protection no test notices is a protection nobody has located; every row goes red.

| # | protection reverted | red of 1,700 | suites |
|---|---|---|---|
| M1 | retention rule off (any owed update may leave) | 15 | broker/updates, delivery/disposition, delivery/retention, storage/conformance, storage/disposition, storage/pruning, storage/query, storage/subscriptions |
| M2 | unreadable/missing evidence skipped instead of fencing | 1 | storage/pruning |
| M3 | disposition skips the `dispose-obligation` policy | 8 | broker/sourceCommands, delivery/disposition, delivery/dispositionFaults |
| M4 | disposition ignores unacknowledged receipt pins | 1 | storage/disposition |
| M5 | abandonment admitted from any command state | 3 | storage/abandonment |
| M6 | source replay passes a revision for an unregistered binding | 1 | broker/sourceReconcile |
| M7 | closure keeps the subscription in audiences | 3 | delivery/disposition, storage/disposition |
| M8 | expired receipts still pin at disposal | 1 | storage/disposition |
| M9 | coalescing ignores receipt pins | 1 | storage/subscriptions |
| M10 | archive ignores owed baseline obligations | 1 | storage/disposition |

## Hand-offs (routed to `docs/TECH_DEBT.md`)

1. **PR 2 / T8b** — A3 saturation journeys, the profile decision above, M1 cohorts, the
   subscription-record inconsistency.
2. **T9** — unchanged: stop latch on list completion and relationship operations; `capabilities()`.
