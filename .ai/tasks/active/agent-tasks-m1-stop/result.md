# Result — `agent-tasks-m1-stop` (M1: the stop-state and production-profile cohorts)

**Shipped:** M1's last two cohorts ran. The default profile fills `logical-bytes` first in every mix that keeps tasks live — written data is 1–2% of it, reservations the rest. Retained tasks fill first only under archive churn, and acknowledgement ids only once history accumulates. A cascade stop's breadth is capped at 1,000 targets, not by any capacity dimension; the root's 8 MiB record caps how often it can be stopped. Six of eighteen frozen predictions missed, and none of them was re-thresholded.

PR: [#708](https://github.com/ErikFortune/fgv/pull/708) into `integration/agent-tasks-v1`. Written 2026-10-01.

---

## Verdicts, against the predictions frozen before the first run

Predictions: `MANIFEST.predictions.stop` and `MANIFEST.predictions.productionProfile` in
`libraries/ts-agent-tasks/perf/residentMemory.js`, frozen in `f09c24a2` before any cohort code
existed. Every later change is an entry in `MANIFEST.amendments`. None of them moved a prediction,
a threshold or a fixture shape.

| cohort | key | verdict | the measured fact that decides it |
|---|---|---|---|
| stop | breadth | **pass** | 1,001 targets: refused 5/5, `invalid`, *"holds more than 1000 tasks; the stop is refused rather than truncated"*, no capacity dimension, root unwritten. 1,000 targets: accepted |
| stop | diskPerTarget | **miss** | 1×1,000 and 10×1,000 fall inside every range (132.5 / 154.4 / 154.8 B root bytes per target; target side 834 B). **1×100** gives 166.7 and 170.6 B against 145–160 B |
| stop | diskPerTargetMax | **pass** | 128-character ids: 344.0 (satisfied) and 344.8 (released) B per target, 5/5 |
| stop | evidence | **pass** | 110 B per record at minimal identities, 613 B at maximal. Difference of differences: **+0.002 MiB** over 999 targets, so the evidence is not resident |
| stop | latch | **miss** | latching costs 745 / 724 B per target (in range). Released-over-none is **1,158 / 1,111 B** per target against ≤ 600 B |
| stop | settled | **pass** | settled-over-none is 1,148 B per target vs released-over-none 1,158 B (≤ 100 B apart) |
| stop | repetition | **pass** | 1,000 targets, fixture profile: refused at cycle **25** on `record-bytes` with 36-hex keys and at cycle **12** with 128-character ids. 200 targets, default profile: refused at cycle **62** on `operations`. All 5/5 |
| stop | peak | **miss** | the open peak at 10×1,000 satisfied is 2.6 MiB *below* the no-stop tree (in range). A 1,000-target release peaks at **18.3–19.8 MiB** above settled (median 19.4, 55 releases) against ≤ 16 MiB; old-space rises only 1.2–1.7 MiB |
| stop | control | **pass** | retaining every root's intents (3.41 MB encoded) holds 3.59 MiB (105%), and dropping them releases 100.3% of that, 5/5 |
| profile | plain | **pass** | refused at the **533rd** on `logical-bytes`, 5/5 |
| profile | churn | **pass** | refused at item **10,000** on `retained-tasks` (`reclaimableByCleanup: false`). 14.34 MiB above import |
| profile | owed | **miss** | refused at the **530th** on `logical-bytes` (in range). Preparing and acknowledging one receipt peaks **25.4 MiB** above settled against ≤ 16 MiB |
| profile | fanout | **pass** | refused at the **520th**, 32/32 receipts pinned, +1.00 MiB over owed |
| profile | history | **pass** | refused in round **8** on `acknowledgement-ids` with 200 closed subscriptions. +0.80 MiB over the control, bound 3.00 MiB |
| profile | consumer | **miss** | the 50,001st id is refused on the per-subscription cap (in range). One acknowledgement rewrite peaks **92.4 MiB** above settled against ≤ 4 × 3.29 MiB + 16 MiB = 29.1 MiB |
| profile | evidence | **miss** | **58** commands per task against 50–56. Open peak **140.0 MiB** against the sharp bound of 48 MiB *and* the loose bound of 127.9 MiB. Steady state holds (−1.14 MiB vs control). The repository is refused on `logical-bytes` |
| profile | unresolved | **pass** | refused at the **364th** on `logical-bytes`. A stop over 251 unresolved children is admitted and 252 refused. A whole-repository stop is admitted at **325** tasks; all of these are `logical-bytes` |
| profile | inventory | **pass** | refused at the **443rd** live task on `logical-bytes`, with 9,443 retained, 16.79 MiB above import. The full-summary control retains 83.4 MiB of 74.0 MiB. The buffering control's peak, 105.9 MiB, exceeds the 40.2 MiB bound |

Each miss is diagnosed in § *Misses*. The harness was diagnosed first in every case.

---

## The brief's premise, checked against source before anything was predicted

The brief asked for its `record-bytes` arithmetic to be reproduced or refuted. **Refuted**,
structurally, three ways (`MANIFEST.predictions.stop.premise`):

1. **Breadth is capped at 1,000 targets** by `defaultMaxStopTargets` (`types/stop.ts:345`). A larger
   tree is refused, never truncated (`broker/stopRequests.ts`, `converters/stopConverters.ts`). The
   cap is not a capacity dimension. A 10,000-target stop under one root cannot exist, so the
   10,000-target arm is 10 roots of 1,000.
2. **A root is a task record, bounded at 8 MiB** (`maxTaskRecordBytes`). `record-bytes`' 32 MiB
   matters only to consumer records, because `recordLimitFor` takes the minimum.
3. **A target carries no source identity.** Its evidence is source id, contract version, epoch and
   token, each at most 128 characters. The 4 KiB binding reference stays on the target's own
   record. Measured: the max-identity arm uses exactly 4,096-byte bindings, and the root still
   carries 613 B of evidence per target.

So one stop's targets are at most 1,000 × 2,986 B (schema maximum), under 3 MiB, and
**`record-bytes` cannot bound a single stop's breadth.** What the root record does bound is
**repetition**, because released and settled intents stay on the root as evidence. Under the
default profile it is `logical-bytes`, not any record bound, that limits breadth first.

---

## Method, environment and tolerances

| | |
|---|---|
| revision | `acc4a974` for every arm except the five 128-character-id arms, which ran on `fc381e98` (§ *Amendments*) |
| runtime | Node v22.22.0, V8 12.4.254.21-node.33, Linux 6.18.44 x64, 4 vCPU Xeon @ 2.80 GHz, 15 GiB |
| adapter | `FsFileTreeAccessors` under `/tmp` (ext2/3/4 magic, a qualified root). Durable `process-crash` open in the measuring child; seeded in a separate child |
| profile | stop: the fixture profile (64 GiB logical, 11,000 non-archived; everything else default). Production: `defaultTaskCapacityProfile`, unmodified |
| ids | task ids 32 random hex; host-minted ids 36 random hex; 128 for both in max-id arms. All payloads are independent random hex |
| sample | post-GC `heapUsed` after four forced `gc()` passes, outside any measured phase. Peaks are `heapUsed` sampled at every file-item call, plus JSON parse/stringify of ≥ 64 KiB in m1 children. Old-space and large-object space are recorded beside it. Every peak is a **sampled high-water**, not an allocator maximum. Process `maxRSS` covers the child's lifetime |
| repetitions | five fresh children per arm. history, consumer, evidence and evidence-control are seeded once and measured in five children, each on its own copy of the seeded tree |
| tolerances | stop: 0.25 MiB noise on resident differences. Production: 2 MiB. Observed spread across five children is ≤ 0.06 MiB for every post-GC figure |
| concurrency | the stop and production runs ran **concurrently** (two harness processes on 4 vCPU). Heap and RSS are per process. **Latencies are descriptive and were measured under that contention** |
| controls | stop: a retain control (intents held from disk) and two report-only controls (a stop-free paused tree; a satisfied cancel). Production: the history and evidence controls, plus the frozen full-summary and buffering controls on the inventory |

**Fixture validity.**
- The `fixture` gate ran in each invocation: it built **16.07 MiB of 16 MiB** and released **100%**, identically in all five children, three times.
- The inventory's full-summary control retained **83.4 MiB** for 74.0 MiB of archived presentation, i.e. 113%. Its buffering control peaked at **105.9 MiB** above settled, against a bound of 40.2 MiB.
- The stop retain control held 105% of its 3.41 MB of encoded intents and released 100.3% of what it held, in all five children.
- Every open-only measurement left its corpus byte-identical (`diskChangedByOpen: []`).

---

## Cohort 1 — stop state

### Bytes per target, by owner

Every figure is the difference of medians against the same tree without a stop, divided by the
target count. These are medians of five; the per-run values are in the raw files.

| | 1×100 | 1×1,000 | 10×1,000 | marginal 1×100→1×1,000 |
|---|---|---|---|---|
| root disk, accepted | 137.4 | 132.5 | 132.5 | 132.0 |
| root disk, satisfied | 166.7 | 154.4 | 154.4 | 153.0 |
| root disk, released | 170.6 | 154.8 | 154.8 | 153.0 |
| target-side disk per paused target | 834 | 834 | 834 | |
| resident, latching (accepted − none) | 1,422 | 745 | 724 | 670 |
| resident, satisfied − released | 486 | 494 | 513 | 495 |
| resident, released − none | 2,004 | 1,158 | 1,111 | 1,064 |
| of which: paused lifecycle (paused − none) | — | 195 | 199 | |
| of which: stop residue (released − paused) | — | 963 | 913 | |
| stop-residue disk (released − paused, all task records) | — | 257 | 257 | |

At 1×100, a few hundred bytes of fixed per-root cost spread over 100 targets inflate every figure.
That cost is the stop and release operations plus the root's own pause. Its latch slack (2.6 KB per
target) is also wider than every range, so **1×100 is not evidence for the latch ranges in either
direction**, as the layer-1 review pointed out.

At 128-character ids (1×1,000): root disk 344.0 / 344.8 B per target satisfied / released;
resident 2,406 / 1,727 B per target over the no-stop tree.

**Evidence** (999 external targets per arm): 110 B per record at minimal identities and 613 B at
maximal. Resident difference of differences +0.002 MiB. Satisfied-over-none is 1.477 MiB (small)
and 1.480 MiB (max). Max released-over-none is 1.009 MiB.

**What a released or settled intent still retains.** On disk it keeps everything: the whole target
list stays in the root record (154.8 B per target at 36-hex keys), and every target keeps its
stop-marked command. Resident, the latch book drops it: no latches and no attempts, and 486–513 B
per target released. The **stop book keeps one marked-command entry per paused target until that
target is archived**: `markedTasks` 1,000 and `stopContent` 1,000 after release. That is the
~0.9–1.0 KB per target residue above. A settled cancel matches it, with 999 marked commands — the
root is archived and drops out.

**Shapes** (structural counts, from the internal inspection, after open):

| arm | latched tasks | attempts | marked commands | stop content |
|---|---|---|---|---|
| 1×1,000 accepted | 1,000 | 1,000 | 0 | 1 |
| 1×1,000 satisfied | 1,000 | 1,000 | 1,000 | 1,000 |
| 1×1,000 released | 0 | 0 | 1,000 | 1,000 |
| settled (cancel, root archived) | 0 | 0 | 999 | 999 |

### Which dimension limits a stop, and when

| question | answer | evidence |
|---|---|---|
| widest single stop (fixture profile) | **1,000 targets**, by `defaultMaxStopTargets`. 1,001 is refused as `invalid` and nothing is written | breadth 5/5 |
| widest whole-repository stop (default profile) | **325 plain tasks**, `logical-bytes`. Each target reserves an attempt bundle (643,625 logical bytes) on top of its closeout | search, 5/5 |
| widest stop over unresolved children (default) | **251 children**, `logical-bytes` | search, 5/5 |
| repeated stop/release on one root, 1,000 targets (fixture) | **24 cycles admitted; the 25th refused on `record-bytes`**. The root grows 153,915 B per cycle, to 3,696,417 B. The model predicted 24 admitted (cycle 23–27 refused) | 5/5 |
| the same, 128-character ids | **11 admitted; the 12th refused on `record-bytes`** — 342,939 B per cycle, to 3,776,666 B (predicted cycle 10–14) | 5/5 |
| repeated stop/release, 200 targets (default) | **61 admitted; the 62nd refused on `operations`** (the root's 128 per-task slots). The root is then 1,924,752 B, far from 8 MiB | 5/5 |

**Does `record-bytes` limit stop breadth? No.** It limits stop *repetition*, at widths the default
profile's `logical-bytes` does not admit. Under the default profile, repetition at an admissible
width is limited by `operations` first.

### Latency (descriptive, measured under the concurrent run)

| | stop + pump to satisfied | per target |
|---|---|---|
| 1×100 | 0.88 s | 8.8 ms |
| 1×1,000 | 19.0 s | 19 ms |
| 10×1,000 | 456 s | 46 ms |

A 1,000-target release takes 0.32–0.41 s; a full stop/pump/release cycle on one already-paused 1,000-target tree takes 3.9 s (1.5 s at 200 targets). Per-target pump cost grows with the number of
concurrently latched tasks: 2.4× per target from 1,000 to 10,000. It is reported, not predicted,
and routed (§ *Routed*).

---

## Cohort 2 — the production profile at its earliest limiting dimension

### What refused, and at what count (default profile; deterministic, 5/5 each)

| fixture | admitted | refused on | `reclaimableByCleanup` | written / reserved logical bytes at refusal |
|---|---|---|---|---|
| plain tracked tasks, 4,000-hex descriptions | 532 | `logical-bytes` (533rd) | true | 5.1 MB / 531.6 MB |
| checklist churn: create, succeed, archive under one list | 9,999 items | `retained-tasks` (10,000th) | false | 28.0 MB / 1.0 MB |
| one subscription, all terminal, unacknowledged | 529 | `logical-bytes` | true | 12.8 MB / 523.7 MB |
| 32 subscriptions, one pinned receipt each | 519 | `logical-bytes` | true | 12.9 MB / 523.8 MB |
| 25 subscriptions per round, closed with disposal | 7 rounds | `acknowledgement-ids` (round 8; 198,600 history ids) | true | 18.3 MB / 0 |
| one subscription to its 50,000-id cap | 485 tasks | per-subscription `acknowledgement-ids` cap | false | 31.0 MB / 2.1 MB |
| external tasks, ~120 KB commands | 67 tasks, 58 commands each (last 47) | per task `record-bytes`; then the repository on `logical-bytes` | true | 469.5 MB / 66.9 MB |
| unresolved external registrations | 363 | `logical-bytes` | true | 0.8 MB / 535.1 MB |
| 9,000 archived plus live tasks | 442 live | `logical-bytes` (9,443 retained) | true | 93.7 MB / 442.6 MB |

**Earliest limiting dimension: `logical-bytes`, in every mix that keeps tasks live.** At refusal,
reservations are 97–99% of it, so the repository holds 5–13 MB on disk when it refuses its
530th task. The exceptions are mixes that keep nothing live. Archive churn reaches
`retained-tasks` first, and accumulated history reaches `acknowledgement-ids` (repository-wide,
or per subscription). The 1,000 `non-archived-tasks` ceiling was reached by no fixture. This
confirms T8b's 536 anchor; the plain fixture's 4,000-character descriptions bring it to 532.

### Absolute memory (medians of five; MiB)

`heap` is post-GC heapUsed above the import baseline; the baseline itself is ~8.2 MiB of heap and
~64 MiB RSS for an empty repository.

| fixture | heap | open peak above settled | rebuild peak above settled | RSS after open | process maxRSS | disk | open ms |
|---|---|---|---|---|---|---|---|
| empty | 0.30 | 0.02 | 0.00 | 63.8 | 63.8 | 0.0 | 9 |
| plain (532) | 4.06 | 7.42 | 14.97 | 82.3 | 104.5 | 4.9 | 349 |
| churn (10,000 retained) | 14.34 | 24.03 | 32.91 | 116.4 | 133.0 | 26.7 | 4,068 |
| owed (529 terminal, unacked) | 12.71 | 12.89 | 13.91 | 110.2 | 130.2 | 12.2 | 874 |
| fanout (519 × 32 subscriptions) | 13.71 | 13.56 | 14.16 | 112.9 | 128.7 | 12.3 | 1,003 |
| unresolved (363) | 1.61 | 7.84 | 8.07 | 77.1 | 79.1 | 0.8 | 212 |
| inventory (9,000 archived + 442 live) | 16.79 | 22.77 | 33.61 | 119.6 | 137.4 | 89.4 | — |
| history (200 closed subs, 198,600 ids) | 1.80 | 16.15 | 16.70 | 95.2 | 98.4 | 17.5 | 1,446 |
| consumer (50,000-id cap) | 1.69 | 42.00 | 43.45 | 114.0 | 194.4 | 29.5 | 2,247 |
| evidence (67 tasks at the 8 MiB record) | −0.14 | 140.03 | 139.20 | 206.1 | 274.0 | 447.8 | 8,492 |

**Receipt preparation and acknowledgement (owed, 1,587 owed updates):** prepare 380 ms and ack
28 ms. One preparation reads **200 task records** and peaks at 25.4 MiB above settled (8.7 MiB of
it in old-space). **Acknowledgement rewrite at the consumer cap:** 1.32 s for a 3.29 MiB record
holding 49,954 disposals. It peaks at 92.4 MiB above settled, 58.6 MiB of that in old-space.

---

## Misses — each a finding, none re-thresholded

The harness was diagnosed first in each case. The shakeouts had already shown four of these
outside their ranges; the amendment recording that predates the recorded run, and no threshold
moved.

1. **stop.diskPerTarget, at 1×100 only.**
   - *Harness:* the figures are exact encodings, so nothing was mis-measured.
   - *Cause:* the prediction did not model fixed per-root costs (the stop and release operations,
     the root's own command). At 100 targets they add 12–16 B per target. At 1,000 and above,
     every figure is in range.
   - *Consequence:* none for the design. The modelled per-target encoding (153 B, or 341 B at
     128-character ids) is what the root record carries.
2. **stop.latch, released-over-none.**
   - *Harness:* the paused control separates ordinary paused-task growth (195–199 B per target)
     from the stop residue (913–963 B per target), so the miss belongs to the stop book. The
     inspection confirms it: 1,000 marked commands remain after release.
   - *Cause:* the prediction priced a marked-command entry at ≤ 600 B. The stop book keeps a
     per-task map, an `IStopContent` record and three id strings parsed fresh from each record.
   - *Consequence:* a released or settled stop keeps ~1 KB per target resident until its targets
     are archived. That is 10 MiB for 10,000 once-stopped tasks — bounded by the retained-task
     ceiling and not a leak, but routed.
3. **stop.peak, the release of a 1,000-target intent.**
   - *Harness:* the sample is taken after a settled baseline with only primitives held (review
     P2-2), and the JSON-boundary samples can only raise it.
   - *Measured:* 18.3–19.8 MiB `heapUsed` above settled over 55 releases, of which old-space is
     1.2–1.7 MiB, at 0.32–0.41 s.
   - *Cause:* nursery churn from re-encoding and validating a ~155 KB root record, not retention.
   - *Consequence:* none for residency. The figure is release working space, and goes into host
     provisioning.
4. **profile.owed, the receipt preparation peak.**
   - *Harness:* the broker and delivery are bound before the settled baseline; the read counters
     are internal instrumentation.
   - *Cause:* `prepare` gathers up to `maxPreparedUpdates` (1,000) owed updates and projects each,
     and queries a 200-task current page (`broker/delivery.ts`), **whatever the receipt budget**.
     One receipt of ~8,000 characters read 200 task records.
   - *Consequence:* preparation's working set is set by owed volume and those two constants, not
     by the receipt. It is bounded — at most 1,000 updates and 200 tasks — but its worst case at
     maximal envelopes was not measured. Routed.
5. **profile.consumer, the acknowledgement rewrite peak.**
   - *Harness:* each measuring child had its own copy of the seeded tree (review P1-1), and the
     peak was taken against a settled baseline.
   - *Measured:* 92.4 MiB above settled for a 3.29 MiB record (~28× its bytes), with 58.6 MiB in
     old-space — the whole history is parsed into objects, validated and re-encoded on every
     rewrite.
   - *Consequence:* the per-subscription cap (50,000 ids) bounds the record. The consumer record's
     own ceiling is 32 MiB (`maxConsumerRecordBytes`), and at maximal evidence (512 B per id) a
     record nears 24.4 MiB. At the ratio observed, that is a transient of several hundred MiB:
     **extrapolated, not measured**. This is the largest per-operation transient in the profile.
     Routed to the profile decision.
6. **profile.evidence.**
   - *Commands per task: 58, not 50–56.* My model of the in-flight command's `record-bytes`
     reservation was ~250 KB too large. The bound the code enforces is what was measured, and
     there is no design consequence.
   - *Open/rebuild peak:* 140 MiB above settled, against 48 MiB (sharp) and 127.9 MiB (loose: 25%
     of 447.8 MiB cold, plus 16 MiB). Old-space +61.6 MiB, maxRSS 274 MiB. Settled state is clean
     (−0.14 MiB vs import).
   - *Cause:* the materialization gate holds one record at a time (high-water 1). Each record here
     is ~7 MB, though, and V8 collects the parsed garbage of successive records lazily, so the
     sampled heap climbs to ~20 records' worth before collection. The cold-history bound held for
     60 KB records (frozen peak cohort: 16.4 MiB). **It does not hold near the 8 MiB task-record
     ceiling.**
   - *Consequence:* a host must budget open/rebuild working space by record size as well as by
     cold volume — here ~140 MiB sampled heap and ~274 MiB RSS. Routed.

---

## Recommendation on the production profile

**Keep the default profile as shipped. Qualify it for hosts by the budget below, not by a single
RSS number.** The measurements give no reason to move a default. What they change is what a host
must provision.

**Memory.** At the default profile, the task-repository process measured 64 MiB RSS empty and
**78–120 MiB RSS after open** across every live-task mix at its ceiling. Process high-water was
**98–137 MiB**, except where large records are parsed:

- **194 MiB** maxRSS for a consumer at its 50,000-id cap, from the acknowledgement rewrite;
- **274 MiB** maxRSS for a repository at full `logical-bytes` with 7 MB task records, at open and
  rebuild.

A host should provision the process at the worst profile its workload can reach: **~140 MiB for
ordinary live-task work, ~300 MiB if task records can approach the 8 MiB ceiling or consumers the
50,000-id cap**. Add the host's own workloads and the V8 heap limit it runs under on top of that.
These are sampled figures from one machine and one Node version, so they size a budget; they do not
guarantee one. The consumer-record extrapolation above is unmeasured, and it is the reason a host
expecting maximal-evidence acknowledgement histories should measure before trusting 300 MiB.

**Disk.** `logical-bytes` (512 MiB) is the written ceiling: the evidence fixture reached 447.8 MiB
on disk. Provision **at least 512 MiB plus scratch for one atomic replacement of the largest
record**: 8 MiB for a task, 32 MiB for a consumer record. Under every live-task mix the repository
is refused at 5–13 MB written. **The live-task count is bounded by reservations, not by disk.**

**For the profile decision** (TECH_DEBT P3, "the default's 1,000 is unreachable" — its trigger is
this cohort, and it has fired):
- M1 confirms `logical-bytes` binds at 519–533 live tasks in every live mix, and never at 1,000.
- The memory cost of raising it to admit 1,000 is small: ~12.7 MiB of heap at 529 owed tasks
  scales to ~25 MiB at 1,000.
- The disk cost is not: 1.5 GiB of logical budget per repository, almost all of it reservation.

That trade-off is the orchestrator's and the user's to decide. It is surfaced, not made here, and
`capacityProfile.ts` is untouched.

---

## Amendments and harness defects, in order

1. **Before the first run:** the predictions and fixture declarations were added (`f09c24a2`).
2. **After one-repetition shakeouts and the layer-1 review, before any recorded run** (`acc4a974`).
   - Changes: JSON-boundary and old-space sampling; per-child copies for seed-once arms;
     report-only controls; verdict code aligned with the frozen text.
   - The shakeouts had already shown values outside four ranges, and that is disclosed in the
     amendment. No prediction changed.
3. **After the first recorded stop run** (`fc381e98`). Five arms with 128-character ids failed at
   open, because the clone path suffixed 128-character claim ids past their bound. Fixed with a
   fresh same-length id. Those five arms alone were re-run (`--only`, `--merge`) and analysed with
   the first run's other arms.
4. **Found while diagnosing, not amended into any figure:** the m1 measuring child's *after-close
   residual* is inflated.
   - What holds it: `openMeasure`'s own suspended async frame holds the open result. Heap snapshot
     path: GC roots → stack → `DetailedSuccess` → `repository` → `TaskIndex.owedPayloads`.
   - The size of the effect: with the open moved into an inner frame, owed's residual falls from
     13.17 MiB to **1.18 MiB**.
   - **No predicted figure is affected.** The repository is live at every predicted sample.
   - The reported `afterClose` residuals of m1 arms (e.g. owed 12.60, fanout 12.70 MiB) are
     therefore a harness artifact, **not a library leak**. The frozen cohorts' `measure` (the
     inventory arms) shows 1.35 MiB.
   - The harness is corrected for future runs in `4e34f21f`; re-measured on the owed corpus, the residual is 1.03 MiB.

**No revert-matrix rows.** This stream measures; it adds no protection, so there is nothing to
revert. `perf/mutationMatrix.js` is untouched.

---

## Routed

To `docs/TECH_DEBT.md` in this PR:

- **P3 updated** — "the default's 1,000 is unreachable": the trigger has fired, and the M1 data and
  the disk/memory trade-off are recorded there. It stays open for the decision.
- **T9 stop hand-off (3) resolved** — the stop-state cohort has run.
- **New P2** — receipt preparation working set: owed-bounded rather than receipt-bounded; 200 task
  reads for one receipt.
- **New P2** — consumer-record rewrite transient: ~28× record bytes at the 50,000-id cap, with an
  unmeasured worst case at maximal evidence.
- **New P2** — open/rebuild working space near the 8 MiB task-record ceiling: 140 MiB sampled heap
  and 274 MiB RSS; the cold-history bound does not hold there.
- **New P3** — released and settled stops keep ~1 KB per target in the stop book until their
  targets are archived; repeated stops are never compacted (24 cycles at 1,000 targets, 61 at the
  default profile's width).
- **New P3** — pump cost grows with concurrently latched tasks: 2.4× per target from 1,000 to
  10,000.
- **Not built, unchanged** — the plan table's history-growth (0/1k/10k/40k on one subscription) and
  cache-saturation cohorts are in neither the frozen harness nor this brief. They remain M1 work
  for whoever next qualifies a raised profile.

## Review

**Layer 1 (`code-reviewer`, on `a5254d15`, before any recorded run).** It ran one stop arm through
the real children and answered the brief's question — *does any arm share state with another, and is
every delta attributable to one owner?*

- **P1-1 — fixed.** A seed-once arm's measured action (the consumer's acknowledgement rewrite)
  changed the directory its five measuring children shared. Each child now measures its own copy.
- **P2s — fixed.**
  - The release action held the parsed root across its settled sample.
  - Stop states were never asserted.
  - Unguarded failures could kill a multi-hour run, and nothing was checkpointed.
  - The fanout verdict did not require 32 pinned receipts.
  - Peaks could not tell nursery churn from retention; old-space is now sampled beside heapUsed.
- **P2s — dispositioned with controls rather than changed verdicts.**
  - Released-over-none bundled paused-task growth with the stop book. A stop-free paused control
    arm now separates them.
  - Settled-over-none mixed policy, terminal children and root archival. A satisfied-cancel arm now
    separates them.
  - The 1×100 figures carry fixed per-root costs. The marginal slope is now reported beside them.
- **P3s.** Applied: breadth names no dimension; repetition counts admission refusals only; the
  history control must complete its plan; the new cohorts imply the fixture gate; clones get fresh
  titles; old-space is reported for every peak. Labelled: the evidence difference of differences
  can include identity-scaled satisfied-only copies.

Not caught by layer 1 (found afterwards and disclosed under *Amendments*): the 128-character
claim-id overflow, and the after-close residual frame.

**Copilot:** requested on #708 by comment.

## Gates

On the merged tree (I2 #707 merged in, `1731e10b`):
- `rushx build`: zero warnings, and the API report is unchanged by this stream.
- `rushx test`: 102 suites pass, at 100% statements, branches, functions and lines.
- `rush change --verify --target-branch origin/integration/agent-tasks-v1`: passes. The change file
  is `type: none`, because nothing in `lib`, `dist` or the published documentation changes.
- `src/` is unchanged, so lint does not apply; `perf/` is not linted.
- The harness runs from a built `lib/`, five repetitions per arm, and the parent removes its temp
  roots (`withRoot`; `/tmp` held no `fgv-tasks-m1-*` after each run).

**After merging I2.** I2 changed only `packlets/prompt/`, a new `context/escaping.ts` and tool
presentation, none of the storage, broker, delivery or renderer code measured here. So the full
matrix was not repeated. A representative subset was re-run on the merged build (`cf112be3`):
fixture gate, 1×1,000 none/accepted/satisfied/released, breadth, default repetition, plain, owed, fanout, unresolved and churn, five reps each (`m1-verify-merged-cf112be3.json`). The results:
- **Refusal counts and dimensions are identical**: 533 / 530 / 520 / 364 on `logical-bytes`;
  item 10,000 on `retained-tasks`; cycle 62 on `operations`; 1,001 targets `invalid`.
- **Root-record bytes are byte-identical.**
- **Post-GC heap is uniformly 0.06–0.14 MiB lower**, so every per-target difference is unchanged
  (accepted − none: 0.711 vs 0.728 MiB at 1,000 targets). Uniform means the baseline moved: I2's
  new modules enlarge the import graph that every "above import" figure is measured from.
- **The owed receipt peak is 24.2 MiB**, still a miss.

Nothing in the findings changes..

## Raw data

The JSON beside this file is the raw data for every run.
- `m1-stop-run-acc4a974.json` is the first stop run. Its five 128-character-id arms failed.
- `m1-stop-run-merged-fc381e98.json` holds those five arms re-run, merged with the first run's
  other arms, and the analysis over both.
- `m1-profile-run-acc4a974.json` is the production-profile run.
- `m1-verify-merged-cf112be3.json` is the re-check on the build with I2 merged.

The `fixture` gate appears in each file.
