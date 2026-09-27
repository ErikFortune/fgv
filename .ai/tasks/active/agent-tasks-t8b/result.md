# Result — `agent-tasks-t8b` (PR 2 of slice T8)

**Shipped:** Agent-task capacity is qualified end to end: every §8.6 dimension saturates, refuses growth and still completes, drains, archives and reopens with exact transfers at every crash point; reservations use an update's derived 37,417-byte maximum; and the default profile says what it admits — 536 plain registrations, bound by logical bytes.

_Sections below are filled as each phase lands; review and revert sections come last._

---

## Phase 0 — `storage/repository.ts` refactored before any A3 work

**Before:** 1993 lines, 7 of headroom against the 2000-line `max-lines` cap.
**After:** 1808 lines (192 of headroom); new `storage/committedFiles.ts`, 286 lines (figures as committed, after the pre-commit prettier pass).
`etc/ts-agent-tasks.api.md` byte-identical (`git diff --stat -- libraries/ts-agent-tasks/etc` empty
after `heft build --clean`). Landed as its own commit, green: `heft build --clean` zero warnings,
`eslint src` clean, `heft test --clean` 70 suites / 1,707 passed / 0 failed, 100 % on every metric,
zero `c8 ignore`.

**The seam: the committed-files layer.** `CommittedFiles` owns the one manifest this instance last
wrote or read and its fingerprint, the classified atomic write (`'unchanged'` → safe; anything else
fences and reports indeterminate), the manifest out-of-band check before any manifest rewrite, the
post-write relist, the byte-for-byte re-establishment on replay, the bounded record read, and the
fingerprint-verified record read through the cache and materialization gate. One invariant ties
them: *nothing is read as, or written over, a file this instance did not commit.* Before, that
invariant was nine private methods spread across the class's last 280 lines.

**Why this seam and not the one that fit.** Three candidates were weighed:

| candidate | lines | what it would need from the class | verdict |
|---|---|---|---|
| **committed-files layer** | ~190 | four handles (store, converters, cache, gate) and three callbacks (projections, usable, fence) | **taken** — a layer the class calls *down* into; nothing in it calls back up into repository logic |
| registration protocol (§8.3 pending → record → live) | ~365 | ~20 members: tasks, pending, ledger, manifest, validate/parent/source checks, build record, ledger entry, delivery plan, index apply, delivery commit, every write | declined — the protocol is a real unit, but it is threaded through the class's shared state; cutting there moves the code and leaves the coupling, which is the "seam that fit" failure |
| commit/replace path | ~400 | the same ~20 members plus retention and execution-claim spending | declined for the same reason, and it is the class's core |

The registration and commit paths are the class's *purpose*; the committed-files layer is *what
they stand on*. Extracting what they stand on gives a one-directional dependency, which is what the
repo's other storage collaborators (`RecordStore`, `SourceRecords`, `SubscriptionRecords`) already
look like. The host interface (`ICommittedFilesHost`) is small enough to read at a glance, which is
the practical test of whether a seam was designed.

**What did not move:** health/fencing state (`_usable`, `_fence`) stays in the repository — fencing
is a repository state transition, and the layer reports it through a callback rather than owning it.
The perf harness's reach into `lib/packlets/storage/{layout,internals}` is unaffected.

**Sweep table updated** in `docs/TECH_DEBT.md`'s P1 `max-lines` entry (re-swept 2026-09-26).

---

## M1 — run on this implementation, before the profile change

**Harness diagnosis first.** The frozen T4 harness did not run: its seed step archived a task with
`updates: current.updates`, and since T8 PR 1 (#698) storage refuses an archive that keeps any update
(`an archived tombstone carries no updates`). Nothing had run M1 since T4. The correction is one line
in the seed path's `commit()` — archive with `updates: []`, which is what the real path does for
updates owed to no one — with a comment at the site. **The frozen manifest, every prediction and
every threshold are untouched**, and the manifest's `amendments` list is not edited: this record is
where the correction is disclosed (commit `48b5c7ad`).

**Run.** `node perf/residentMemory.js --reps 5 --out …` on `60db3e8d` (phase 0 landed; profile
unchanged) — five fresh children per arm, Node v22.22.2, V8 12.4.254.21, linux x64,
`FsFileTreeAccessors` durable open, seeded in a separate process. 3 min 59 s. Raw per-run data:
`m1-run-60db3e8d.json` beside this file. Medians, post-GC `heapUsed`:

| cohort | prediction (frozen 2026-09-23) | measured | verdict |
|---|---|---|---|
| **fixture** (residency check) | a 16 MiB random-hex corpus allocates ≥ 80% of its payload and releases 80–120% of that | built **16.07 MiB** of 16 MiB; released **99.8%** (identical in all five) | **pass** — the fixture is resident, so what follows means something |
| **archived** 0 / 1,000 / 10,000 | counts linear; minimal increment ≤ 25% of the full-summary control's, and ≥ 1 MiB | minimal 1.25 / 2.80 / 15.46 MiB; control 1.37 / 11.73 / 103.76 MiB; 1k→10k increments **12.66 vs 92.02 MiB, ratio 0.138**; projections 10,100, children 10,000, sources 10,000 | **pass** |
| **terminal** 100 / 500 / 900 | growth ≥ 50% of added presentation; archive releases ≥ 50% of it; identities kept | open 2.09 / 5.35 / 8.42 MiB; **grew 6.33 MiB for 4.58 MiB** of presentation; archiving 900 **released 5.25 MiB of 5.15 MiB**; identities kept | **pass** |
| **peak** 1,200 × 60 KB cold | cold-open and rebuild peak above settled ≤ 25% of cold bytes + 16 MiB; buffering control exceeds it | cold 68.66 MiB → bound **33.17 MiB**; open peak **16.39 MiB** (16.38–16.41), rebuild **17.88 MiB**; buffering control **77.16 MiB** (75.19–77.65) | **pass** |

**What M1 does and does not say about the profile.** It confirms the *structure* the profile rests on:
archived tasks cost a small, linear resident slope; terminal presentation is resident until archive
and released by it; cold history does not inflate open or rebuild peaks. It **neither confirms nor
refutes 384 MiB**: no frozen cohort holds owed payload anywhere near that budget (the terminal cohort
peaks at ~5 MiB), and the manifest predates the profile change, so no cohort was designed to. One
figure does bear on it: the terminal cohort retained **about 1.4 heap bytes per encoded presentation
byte** (6.33 / 4.58). Owed payloads are held resident by the index, so a repository filled to the
`resident-payload-bytes` ceiling would plausibly need on the order of 1.4 × 384 MiB of heap for
payloads alone. That is recorded in the profile's remarks as unmeasured, not as a limit. **It does not
bear on (d)**, which is a reservation — logical capacity, not memory.

No cohort missed, so there is nothing to report as a miss. The plan's production-profile cohort
("absolute steady-state and peak memory for the production profile's limiting fixtures") is not in
the frozen harness and was not added (harness authorship is out of scope); it is the trigger on the
new P3 entry in `docs/TECH_DEBT.md`.

---

## Profile — the six changes, as implemented

**The brief's table reproduces exactly.** Unit 37,417 B (computed by `maximumUpdateBytes` and matched
by encoding the widest update the converters accept, grown to a maximum envelope — within the 10 bytes
of fields that cannot coexist). Resident ceilings: 256 / 224 / 199 at 64 MiB; 512 / 448 / 398 at
128; 1,024 / 896 / 797 at 256; 1,281 / 1,120 / 996 at 320; **1,537 / 1,345 / 1,195 at 384**. Today's
figures 146 / 128 / 113.

| | change | where | what it admits |
|---|---|---|---|
| 1 | (d): reserve the derived schema maximum | new public `maximumUpdateBytes(profile)` = min(`maxUpdateBytes`, `maxEnvelopeBytes` + framing); `maximumClosureCharges`, `maximumResolutionCharges`, `maximumSettlementCharges` use it | closeout 7 × 37,417 B = 255.8 KiB resident (was 448 KiB); settlement 37,417 B (was 64 KiB) |
| 2 | `resident-payload-bytes` 64 → 384 MiB | `defaultTaskCapacityLimits` | 1,537 / 1,345 / 1,195 (plain / + command / + command + `current` sub) |
| 3 | `non-archived-tasks` stays 1,000 | unchanged | **not reachable under the defaults** — see the finding below |
| 4 | `maxConsumerRecordBytes` 8 → 32 MiB | `defaultTaskEncodedBounds`, **plus `record-bytes` 8 → 32 MiB** | 50,000 ids × 512 B = 24.41 MiB + the 64 KiB preparation claim; a consumer record's ledger ceiling is now 32 MiB (tested) |
| 5 | `maxAcknowledgementIdsPerSubscription` stays 50,000 | unchanged | now covered by (4) |
| 6 | `maxUpdateBytes` stays 64 KiB | unchanged; 37,417 B documented at its site and on `defaultTaskEncodedBounds` | — |

**(1)'s scope.** Applied to all three bundles that reserve a future update payload — closeout, first
resolution (the brief did not name it; it is the same unit, and leaving it at 64 KiB would keep an
unresolved registration at 704 KiB), and settlement. The `current`-baseline charge is *actual* bytes
already, so it needed no change and its worst case is the derived maximum automatically. Not changed:
the `source-replay` envelope consistency check, which reserves what the host declares rather than the
unit; tightening it would narrow what it accepts — a P4 entry.

**(4)'s mechanism — a disclosure.** `recordLimitFor` bounds every record by
`min(limits['record-bytes'], its own encoded bound)`, and `record-bytes` was 8 MiB, so raising
`maxConsumerRecordBytes` alone would have changed nothing. `record-bytes` is raised to 32 MiB with it.
It is per record, not aggregate, and every other record kind keeps its own bound (task and inventory
8 MiB, source 1 MiB), so it changes no other ceiling. It is a raise, in the decision's direction, but it
is a seventh number, and the orchestrator may want to call it that.

**Stored claims.** `checkTaskClaims` requires each claim to be at most its bundle, so a reserved claim
minted before (1) exceeds the new bundle and fails open (a consumed one whose remainder happens to be
within 37,417 bytes passes — harmless, but the rule depends on the data). The package is unpublished and lives on the
integration branch; no migration, the posture PR 1 took for its format change. Disclosed as BREAKING in
the change file.

### The finding: the decision's premise does not hold, and the design authority chose to document it

Implemented and built, the default profile refuses the **537th plain registration on
`logical-bytes`**, not the 1,001st on `non-archived-tasks` (tested: *the default profile* in
`saturation.test.ts`). The decision's table modelled `resident-payload-bytes` alone. Each registration
also reserves ~976 KiB of `logical-bytes` — the closeout's snapshot (96 KiB), seven updates
(255.8 KiB), two operation-evidence slots (512 KiB) and 224 × 512 B of acknowledgement evidence
(112 KiB) — so 512 MiB fills at 536. `audience-links` and `acknowledgement-ids` (200,000, 224 per
registration) would bind next at 892. With one command in flight each, `logical-bytes` binds near 388.

Raising `logical-bytes` to 1.5 GiB and `audience-links` / `acknowledgement-ids` to 300,000 would make
1,000 true in all three modelled mixes (probe: 1,339 plain registrations, bound by links; the heaviest
mix needs 1,353 MiB of logical bytes and 257,000 links). **Put to the user 2026-09-26 as a question;
the answer was: implement the six changes and document 536.** That is what shipped: the figure is at
the profile site (`defaultTaskCapacityLimits` remarks), in the `CAPABILITIES.md` runbook
(*Sizing the default*), and in a new P3 entry that carries the open question.

### Documentation delivered

- `capacityProfile.ts`: every changed value carries what it admits and its unit at its site;
  `maxUpdateBytes` carries the 37,417 B figure; the three profile constants' remarks no longer say
  "proposed … pending measurement" — they say what M1 qualified, what it did not, what binds first, and
  how to tune.
- `CAPABILITIES.md`: the settlement figure (was "64 KiB"), `reclaimableByCleanup`'s meaning, the
  sizing paragraph, `maximumUpdateBytes` and the "do not reserve `maxUpdateBytes`" rule; two drain
  situations that look stuck and are not (an orphaned receipt after a crash; an older revision of a
  maximum-size task at the default budget).
- `docs/TECH_DEBT.md`: the capacity entry **closed** with the decision, the numbers and the arithmetic;
  three smaller entries carry what remains; PR 1's "T8's second body of work" entry retired; the
  broker hand-off entry's "64 KiB settlement" figure corrected.
- **Tuning, stated once:** `raiseCapacityLimits` for an existing repository; an explicit profile at
  `initialize` for a new one; the default for everything else. Raise only — v1 cannot lower a stored
  limit.

---

## A3 — the saturation journeys (deliverable 1)

**Suites:** `src/test/unit/delivery/saturation.test.ts` (53 tests) and
`src/test/unit/delivery/lifetime.test.ts` (13), over `src/test/helpers/saturationFixtures.ts`. Run
either with `npx jest lib/test/unit/delivery/saturation.test.js` after `rushx build`.

**The world.** Every journey starts from one population, built only by steps that grow capacity: a
`watcher` subscription (from now, every category); the **largest tracked task `t`** the field bounds
admit (4,096-character description, completed with a 2,048-character outcome); an external job `j`
with a reconciled source cursor; an **uncertain command** on `j` whose response was lost after the
executor applied it; and a late `current` subscription holding two baselines. Ids are fixed-width, so
two worlds driven through the same steps write records of exactly the same size — which is what lets
a limit measured in one world saturate another exactly.

**Saturation, per dimension.** Each of the eleven §8.6 dimensions gets a profile whose limit is exactly
what the population commits in it (`record-bytes`: the largest record's own ceiling). `logical-bytes`
cannot be filled to the byte — registration and activation pass through a widest state (the manifest
still holding the pending entry) — so its limit is the smallest the population is admitted under,
leaving **939 bytes**, less than any growth needs. At each ceiling:

| dimension | limit | available | growth refused (requested) | `reclaimableByCleanup` | after the drain |
|---|---|---|---|---|---|
| retained-tasks | 2 | 0 | new task (1) | false | still refused |
| non-archived-tasks | 2 | 0 | new task (1) | true | admitted |
| subscriptions | 2 | 0 | new subscription (1) | false | still refused |
| sources | 1 | 0 | a second source record (1) | false | still refused |
| updates | 19 | 0 | new task (8) | true | admitted |
| audience-links | 484 | 0 | new task (226) | true | admitted |
| acknowledgement-ids | 484 | 0 | new task (226) | **true** (was false — fixed, below) | admitted |
| operations | 7 | 0 | new task (3) | **true** (was false) | 1 released, still refused |
| record-bytes | 1,253,037 (task record) | 0 | a second command on `j` (365,906) | true | reservation emptied |
| logical-bytes | 2,540,662 | 939 | new task (1,002,804) | true | admitted |
| resident-payload-bytes | 571,747 | 0 | new task (262,446) | true | admitted |

**The journey at every ceiling, with exact transfers.** Under each of the eleven profiles the journey
runs to the end, and **each step's per-dimension transfer equals the same step's transfer in a
repository with room** (compared across worlds with the manifest's own entry excluded, since the
limits are digits in it). The reference transfers, `used / reserved`:

| step | updates | links | ack ids | ops | logical B | resident B | non-arch |
|---|---|---|---|---|---|---|---|
| saturation point | 4 / 15 | 4 / 480 | 0 / 484 | 3 / 4 | 26,726 / 2,512,999 | 10,492 / 561,255 | 2 / 0 |
| complete the largest task | +2 / −2 | +4 / −4 | · | +1 / −1 | +17,969 / −17,969 | +13,473 / −13,473 | · |
| settle the uncertain command | +1 / −1 | +2 / −32 | 0 / −30 | · | +575 / −380,457 | +652 / −37,417 | · |
| job finishes at its source | +2 / −2 | +4 / −4 | · | · | +1,312 / −1,312 | +1,307 / −1,307 | · |
| acknowledge all (watcher) | · | · | +7 / −7 | · | +504 / −4,033 | · | · |
| dispose all (late) | −2 / 0 | −2 / 0 | +7 / −7 | · | −4,875 / −3,584 | −5,249 / 0 | · |
| prune | −7 / 0 | −12 / 0 | · | · | −20,680 / 0 | −20,675 / 0 | · |
| archive t | 0 / −5 | 0 / −220 | 0 / −220 | +1 / −1 | +264 / −979,182 | 0 / −248,446 | −1 / 0 |
| archive j | 0 / −5 | 0 / −220 | 0 / −220 | +1 / −2 | +264 / −995,839 | 0 / −260,612 | −1 / 0 |
| close late (retain) | · | · | · | · | −8 / −65,536 | · | · |
| close watcher (dispose) | · | · | · | · | −8 / −65,087 | · | · |
| **end** | 0 / 0 | 0 / 0 | **14** / 0 | **6** / 0 | 22,043 / 0 | 0 / 0 | 0 / 0 |

Retained 2, subscriptions 2 and sources 1 are unchanged throughout. The whole table was produced by
running the reference world, not typed.

**Each transfer checked against independent evidence** (`saturation.test.ts`, *exact transfers,
checked against the records' own claims*): completing `t` moves no repository-wide total, and its
closeout claim paid exactly the used growth; settling releases exactly the consumed settlement claim's
unspent remainder; acknowledgement moves exactly `n` ids reserved→used and **releases no payload**
(acknowledged-but-unpruned, and that state reopens exactly); disposing `late`'s baselines releases
exactly the resident bytes its own ledger entry held; a prune releases exactly the canonical encoded
bytes, the count and the audience links of the updates it removed (computed by encoding them); each
archive releases the non-archived slot and exactly its consumed closeout claim's remainder, in six
dimensions; closing releases exactly `maxIssuedReceiptBytes` of preparation and keeps identity and
history.

**Every crash point** (`saturation.test.ts`, *every crash point of the journey*, 10 steps, 13 write
boundaries, plus activation): for each step and each `k` below its write count, writes `1..k` land and
write `k+1` fails having changed nothing — the process stops there. Then:

1. **The ledger open rebuilds from disk equals the one the stopped instance held in memory**, every
   dimension, used and reserved. Nothing still owed was released; nothing was charged twice.
2. **A retry converges to exactly the uncrashed result.** The one exception is exact and explained: a
   crash between `prepare` and `acknowledge` leaves an issued receipt no process holds, which pins what
   it names; the test finds it in the subscription's record (unacknowledged `issued`) and abandons it,
   and asserts it appears **only** at those crash points.
3. **Pending subscription activation** (3 writes: pending entry, consumer record, live entry): reopen
   finds nothing, the pending state with its reservations held (resident payload and links equal to the
   activated figure, so nothing else can take the room its baselines need), or — once the consumer
   record is durable — the activated subscription, which open completes. Never a state between.
   Retry reaches the uncrashed figure from each.
4. **Acknowledged-but-unpruned** is a durable state with its own test (above), and reopens exactly.

**Transient vs lifetime, demonstrated** (*transient capacity comes back …*, and the per-dimension
`reclaimableByCleanup` test). After the full journey every transient dimension's `used` is 0 (logical
bytes keep only what lifetime records occupy — tombstones, histories, the cursor, the manifest) and
nothing is reserved; the lifetime record that remains is exactly **2 identities, 2 subscriptions,
1 source, 14 exact acknowledgement/disposition ids and 6 operations of dedup evidence**, none of
which went down at any step. For every dimension, the refusal's `reclaimableByCleanup` is asserted to
equal whether the drain released any of the committed figure; the retained/subscriptions/sources
refusals are asserted still refused after the drain.

**Fix found by that test — `reclaimableByCleanup` was static per dimension.** At the
`acknowledgement-ids` ceiling the refusal said `false`, and after the drain the same growth was
admitted: the committed figure was all closeout *reservation*, which archive releases. The flag now
says whether draining could release any of it: always for a transient dimension; for a lifetime one,
only while some task holds part of it as a reservation (`storage/ledger.ts` `_reclaimable`). A
subscription's reserved evidence for an owed link does not count — it becomes history either way. The
many-closed-subscriptions test pins the other side: with every task archived, the refusal is `false`.

**The rest of A3's list** (`lifetime.test.ts`):

- **Lifetime acknowledgement exhaustion, one subscription** — with a 40-id per-subscription limit, tasks
  are created, completed, acknowledged, pruned and archived until the next is refused on
  `acknowledgement-ids` with nothing owed, nothing pinned and nothing prunable: history alone. The
  history grows strictly at each cycle, survives closure and reopen exactly; closure lets work be
  admitted again (no future obligations) without shrinking it.
- **Across many closed subscriptions** — subscribe, cycle, close, repeatedly under a 560-id repository
  limit: refused after more than ten closed subscriptions, by their histories alone, with
  `reclaimableByCleanup: false`; the used figure is exactly the sum of every closed record's history,
  and reopen reproduces it.
- **An already-admitted required event needs no new unreserved space** — at the
  `acknowledgement-ids` ceiling (a new task refused), the terminal transition, the settled command
  result and the source's terminal observation all commit, and the repository-wide committed figure
  never rises.
- **Repeated command identities** — at the `operations` ceiling, replaying `pause-j` returns its
  receipt with no total moving; a new identity is refused. **Rejected after admission** — the source
  rejects a command it admitted: one more operation of evidence, no settlement left reserved, and the
  same identity replays the rejected receipt at no cost.
- **Pinned receipts** — at the resident ceiling, a receipt issued and never acknowledged keeps its
  updates charged through a prune (`outstanding()` reports it pinned); abandoning it lets the next prune
  release everything.
- **Oversized results** — an applied answer whose details are 71,699 bytes against a 65,536 bound is
  recorded as `indeterminate`, naming the contract break in a bounded diagnostic, never truncated into
  an applied receipt; the command stays unsettled and every reservation stays; a conforming answer then
  settles it.
- **Claimed but never resolved** — a pending registration the process never finished keeps its whole
  reservation through a full drain of everything else, is named by `outstanding()`, and resumes at no
  new charge; an external task never first-observed keeps both its bundles through the drain and cannot
  be archived away.
- **Cleanup cannot invent outcomes, abandon without authority or bypass blockers** — at the resident
  ceiling a cleanup pass leaves an uncertain command uncertain and its task out of archive (after the
  source reports it terminal, too); a disposition or abandonment the policy refuses releases nothing;
  an authorized abandonment is `abandoned`, naming what was known, never a success. **The stop latch is
  T9's**: no stop blocker exists yet to bypass, so the "stop blockers" clause is proven here for the
  blocker that exists (an unsettled command) and carried to T9 for the latch.
- **Reopen at a ceiling** opens ready, refuses the same growth, drains, and then admits it.

**Found while building the journey — routed to `docs/TECH_DEBT.md`:** at the default 8,000-character
context budget an older revision of a maximum-size task can never be delivered beside its current one.
It stays owed (never dropped); a larger budget or a disposition discharges it. Pinned by *delivery at
the default context budget*; the journey drains with a 20,000-character budget.
