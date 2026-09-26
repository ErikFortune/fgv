# Stream brief — `agent-tasks-t8b`

**PR 2 of slice T8** — Retention, backpressure and recovery journeys
(`docs/design/agent-tasks/implementation-plan.md` § T8). PR 1 shipped the mechanism via
[#698](https://github.com/ErikFortune/fgv/pull/698); this is the rest.

## Mission

The A3 saturation journeys for every § 8.6 dimension with exact used/reserved transfers at every
crash point; lifetime acknowledgement exhaustion; the M1 cohort run; and the capacity-profile
decision the whole family has been deferring.

**T8's acceptance criteria are not met until this lands, and the `agent-tasks-v1` cluster does not
close before it.** PR 1 said so in its own ledger entry. You are the slice that closes T8.

**Dependencies:** T3–T7 and T8 PR 1 — all landed on `integration/agent-tasks-v1`.

## Branch and PR posture

- **Branch:** `claude/agent-tasks-t8b`, created off `integration/agent-tasks-v1` at `cae5d7db4`
  (the T8 PR 1 landing) and pushed.
- **PR into `integration/agent-tasks-v1`** — **not `release`.**
- **Artifacts stay in `.ai/tasks/active/agent-tasks-t8b/`.** This family finalizes at **cluster
  close**, not per slice. Do **not** run `/finalize-task`.

---

## What PR 1 already did, so you do not redo it

Read `.ai/tasks/active/agent-tasks-t8/result.md` in full first. In summary, shipped and verified:

- the retention rule in storage (an owed update leaves only on durable acknowledged-or-disposed
  evidence, fingerprint-verified through the checkpoint store, never the resident index)
- disposition, subscription closure (`retain` / `dispose`), `coalesceProgress` coalescing with
  receipt pins, command abandonment, tombstone archive with pruning
- the source-replay `unregistered-binding` cursor stop
- `ITaskRepository.outstanding()` — every incomplete operation, named
- ten real-`SIGKILL` crash cases around dispose, cleanup and archive
- the host runbook in `CAPABILITIES.md`
- 1,707 tests, 100 % on every metric, zero `c8 ignore`; an 11-row revert matrix on its final source

Orchestrator re-verified that suite and re-ran the M1 retention revert: it reddens exactly the eight
suites PR 1 named. **Treat PR 1's mechanism as sound and do not reshape it** — the split was granted
on the explicit basis that this work depends on the mechanism but on nothing in it being reshaped.
If you find you *must* reshape it, that is a finding worth surfacing, not a licence to proceed.

## Deliverable 1 — the A3 saturation journeys

The plan's paragraph is the specification; it is dense, so here it is decomposed.

For **every** § 8.6 dimension, use small finite profiles to reach ordinary saturation while
preserving claims. Then drive this journey and assert throughout:

1. reject new growth
2. complete the largest allowed accepted task
3. settle an accepted uncertain command after source resolution
4. prepare/ack **or explicitly dispose** every accepted update
5. prune → archive → close → reopen

**Assert exact used/reserved transfers across every crash point** — including pending subscription
activation and acknowledged-but-unpruned records. Not "capacity was released" but the exact figures
either side.

Also required, each its own test:

- **Distinguish transient capacity released by cleanup from identity / acknowledgement / dedup
  ceilings that never shrink in v1.** This distinction is the heart of A3's finite-horizon claim.
- **An already-admitted required event must not need new unreserved acknowledgement space.**
- **Lifetime acknowledgement exhaustion** on one subscription, *and* across many closed
  subscriptions. PR 1 made closure retain history as a lifetime charge; this is where that bites.
- Repeated ordinary command identities; rejected-after-admission operations; pinned receipts;
  oversized results; claimed-but-never-resolved pending registrations.
- **Cleanup cannot invent successful outcomes, abandon obligations without authority, or bypass stop
  blockers.** PR 1 built the authority checks; you prove they hold under saturation, which is
  exactly where a drain path is tempted to cut a corner.

## Deliverable 2 — M1, on this implementation

`libraries/ts-agent-tasks/perf/residentMemory.js` was authored in T4: 788 lines, four cohorts
(`fixture`, `archived`, `terminal`, `peak`), **prediction manifest frozen 2026-09-23**.

```
rushx build && node perf/residentMemory.js --reps 5 --out <file>.json
```

**You run it; you do not rewrite it, and you do not edit its frozen manifest.** Its own header says
a miss is diagnosed at the harness first, then the design or profile — *never* the threshold. Read
`TESTING_GUIDELINES.md` § *Measurement Harnesses* before interpreting any output; the `fixture`
cohort is the residency sanity check that section makes non-optional, and if dropping the fixture
does not release roughly what building it consumed, every number downstream is noise.

Paste the actual figures into `result.md`. A green check is not a measurement.

**The plan's ordering is load-bearing:** *"Run final M1 cohorts on this implementation before
accepting its default profile."* M1 comes before the profile decision, not after it.

## Deliverable 3 — the profile decision

This is the one the whole family has deferred, and PR 1 did the arithmetic so you don't have to
re-derive it. From `.ai/tasks/active/agent-tasks-t8/result.md` § *Profile arithmetic*:

**Two findings are settled and you should build on them rather than re-litigate:**

- **A single update cannot exceed 37,417 B** (36.54 KiB) — the 32 KiB envelope bound plus fixed
  framing. `maxUpdateBytes` (64 KiB) is therefore *unreachable*, and the closeout has been reserving
  7 × 64 KiB for payloads that can never be that large.
- **Candidate (a), "charge actual", is structurally unavailable.** A closeout reservation guarantees
  a terminal step *not yet taken*; its size is unknown at admission, so it must reserve the most it
  could need. What can be tightened is what "the most" means — which is (d).

| candidate | per registration | ceiling at 64 MiB | + 1 command | + command + 1 `current` sub |
|---|---|---|---|---|
| today, 7 × 64 KiB | 448 KiB | 146 | 128 | 113 |
| **(d)** derived maximum, 7 × 37,417 B | 255.8 KiB | **256** | 224 | 199 |
| (d′) `maxUpdateBytes` = 40 KiB | 280 KiB | 234 | 204 | 182 |
| (d″) derived maximum × 5 categories | 182.7 KiB | 358 | 298 | 256 |
| (b) raise `resident-payload-bytes` | 448 KiB | 1,000 needs **437.5 MiB** | | |
| (c) lower `non-archived-tasks` | — | honest value 146 / 128 | | |

PR 1's recommendation is **(d) + (c)**. Your job is to run M1 first and then either confirm it with
measurements or show why it is wrong.

**(d″) needs a proof PR 1 declined to claim:** that no single commit can produce `assignment` or
`relationship` alongside a terminal transition. Plausible — those are catalog operations and never
terminal — but shrinking "at most seven categories" is a *design statement*, not an optimisation.
If you can prove it from the code, say so and show the proof; if it needs a design decision, route
it rather than assuming it.

**Also yours: the subscription-record inconsistency** (T7's hand-off 2, restated by PR 1).
`maxConsumerRecordBytes / E` = 8 MiB / 512 B = **16,384** owed-or-future links, against
`maxAcknowledgementIdsPerSubscription` advertising **50,000**. Either lower the per-subscription id
limit to ≈16,000 or raise the consumer-record bound to ≥ 25 MiB. Decide it with the rest of the
profile, with the arithmetic shown.

### Do not change the published profile without the round-trip

`defaultTaskCapacityLimits` and `defaultTaskCapacityProfile` are `@public`, and the number is what
consumers size against. **Deliver the decision with its evidence and stop there**; the orchestrator
takes it to the design authority. PR 1 held this line correctly and so must you.

The one thing that makes this cheap: the profile's own docstring already calls it *"proposed …
not measured safe maxima"*, pending *"the planned residency and reopen measurements before the
profile is advertised"*. Those measurements are yours. Correcting the number now costs nothing
downstream — which is an argument for correcting it, not for correcting it silently.

## Review gates — this PR has the same two as PR 1

1. **Layer 1, `code-reviewer` before coverage closure.**
2. **An independent persistence/delivery antagonist pass.** The plan requires it for T8, and T8 is
   not closed until this PR lands, so it applies here too. On PR 1 it found one MED that four
   Copilot rounds had not. Commission it after layer 1 and before the Copilot loop.
3. Then the implementer-driven Copilot loop.

**Loop expectation, calibrated from PR 1.** PR 1 ran four rounds and stopped correctly — but note
*how* it stopped: rounds 2 and 3 each posted **zero findings in the main list while carrying real
findings in their "previously missed" block** (a MEDIUM on dispose not abandoning unacknowledged
manifests, and two doc nits). PR 1 caught all three. **A round is not empty until its
previously-missed block is empty too.** Round 4 was genuinely empty, and that was the stop.

Your surface is capacity accounting under saturation — arithmetic and ordering, not authorization —
so the loop may well be shorter. Judge on the finding profile, not the count.

## Explicitly out of scope

- **Reshaping PR 1's mechanism.** See above; surface it instead.
- **Physical deletion and inventory / acknowledgement / dedup compaction**, under A3's explicit
  finite-history limitation. If you conclude the limitation does not cover a case you hit, stop and
  surface it rather than quietly compacting.
- **T9** — cascade stop, `ITaskSource.capabilities()`, the source side of a stop; and T5's open
  hand-off that no stop latch is checked by list completion or relationship operations.
- **I1, I2, P1.** M1 harness *authorship* (you run it).
- **Every package outside `ts-agent-tasks`.**
- **Do not fix `ts-utils`'s `isKeyOf`.** Escalated by T1, still unfixed, still not this slice's.
- **Do not fix the three known CI flakes** (`docs/TECH_DEBT.md`, P2 inventory). Read the log,
  confirm it is one of those three, re-trigger.

## Gates

- [ ] `rushx build` **zero warnings**; `rushx lint`; `rushx fixlint` before the final commit
- [ ] `rushx test` at 100 % coverage with **zero `c8 ignore`** — T4 through T8 PR 1 all managed it
- [ ] `rush change --verify --target-branch origin/integration/agent-tasks-v1`. **Type the change
      file `minor`**, with a `BREAKING:` prefix if it breaks anything — `ts-agent-tasks` has never
      been published, so `major` is wrong however breaking the change is. See
      `ACTIVE_DEVELOPMENT.md` § *How to type a change file*
- [ ] Repo-wide `rebuild` **and** `test`, **on the final source**
- [ ] `verify-capability-docs`, `generate-capability-feed --check`, `verify-esm-entrypoints`,
      `verify-bundler-resolution`, `verify-tarball-exports`
- [ ] No `any`; all fallible operations return `Result<T>`
- [ ] All three review layers recorded in `result.md`
- [ ] **The plan's T8 status line moves from 🟡 to ✅, and the ledger's `agent-tasks-t8` entry is
      closed out** — this PR completes T8, so the docs that say it is partial become wrong when it
      lands. Write them as shipped *in this PR*; a PR cannot observe its own merge

## Skills to load, and when

| when you are about to | load |
|---|---|
| write or review any `Result<T>`-returning code | `/result-pattern` |
| write or review tests | `/result-tests` |
| write or review a converter or validator | `/type-safe-validation` |
| touch file I/O or a directory walk | `/filetree-io` |
| write anything that "feels general" | `/published-primitives-reflex` |

## Traps this stream's predecessors paid for

1. **An evidence run is only evidence of the code it was run against.** T3's mutation matrix ran on
   an intermediate head; re-run on the final source, nine rows turned nothing red and five were real
   gaps. Every slice since has re-run. **Re-run before you claim it.**
2. **Quote a suite and a total, not a bare ratio.** T7 reported "22 of 28" for a test-double
   falsifier; the re-run gave 26 of 33, because "28" named nothing anyone could count. PR 1 fixed
   this by naming suites per revert row, and the orchestrator reproduced its eight-suite claim
   exactly. **Every number in your `result.md` must name what a reader can re-run to get it.**
3. **A measurement harness fails differently from a test** — a broken test goes red, a broken
   harness prints a plausible figure and is believed. This is your main deliverable's main risk.
4. **A threshold chosen after seeing the result measures nothing.**
5. **A test comparing a constant to a constant looks like a guard and is not.** Under saturation
   testing, where many assertions are arithmetic, this is easy to write by accident.
6. **A review round that posts zero comments is not evidence of a clean diff** — read the
   previously-missed block. PR 1 hit this twice in four rounds.
7. **A finding that lives only in a PR body is one you are throwing away.** Route anything that
   outlives this slice to `docs/TECH_DEBT.md` **in this PR**.

## Exit artifact

`result.md`, opening with a one-line `**Shipped:** …` that becomes the capability-feed `sourceLine`
verbatim. It must record:

- the A3 journey results per § 8.6 dimension, with exact used/reserved transfers at each crash point
- the transient-vs-permanent capacity distinction, demonstrated rather than asserted
- **M1's four cohort figures, pasted**, with the `fixture` residency check stated and any manifest
  miss reported as a miss
- **the profile decision with its evidence** — the recommendation, the measurements behind it, the
  `(d″)` proof or the reason it needs a design decision, and the subscription-record resolution
- confirmation that T8's acceptance criteria are now met, item by item against the plan
- anything belonging to T9/I1/I2/P1, routed durably

Keep `state.md` current. If the session crosses a context boundary, `state.md` plus this brief must
be enough to resume cold.

## Required reading, in order

1. This brief.
2. `.ai/tasks/active/agent-tasks-t8/result.md` — PR 1's record, especially § *Profile arithmetic*.
3. `docs/design/agent-tasks/implementation-plan.md` § T8, and § A3 in § 1.
4. `docs/design/agent-tasks/development-design.md` § 8.6 — every dimension you must saturate.
5. `docs/TECH_DEBT.md` — the capacity/profile entry with its T6, T7 and T8 amendments.
6. `.ai/instructions/TESTING_GUIDELINES.md` § *Measurement Harnesses*, then
   `libraries/ts-agent-tasks/perf/residentMemory.js` — its header and frozen manifest.
7. `.ai/tasks/active/agent-tasks-t8/state.md` — PR 1's review record and round-by-round detail.
8. `libraries/ts-agent-tasks/src/packlets/storage/` — `retention.ts`, `subscriptions.ts`,
   `capacityLedger`-related code.
9. `.ai/instructions/ACTIVE_DEVELOPMENT.md` § *How to type a change file*.

## Missing-input rule

If a required-reading file does not exist, or a plan section does not say what this brief claims,
**STOP and surface the gap.** Do not reconstruct intent from surrounding code and proceed.
