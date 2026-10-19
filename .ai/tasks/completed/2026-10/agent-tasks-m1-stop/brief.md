# Stream brief — `agent-tasks-m1-stop`

**M1's two remaining cohorts: the stop-state cohort (after T9) and the production-profile cohort.**
`docs/design/agent-tasks/implementation-plan.md` § M1.

**This is a measurement stream, not a feature stream.** It produces numbers and a judgement about a
profile. Read `.ai/instructions/TESTING_GUIDELINES.md` § *Measurement Harnesses* first and in full —
every rule there was paid for.

## Mission

`libraries/ts-agent-tasks/perf/residentMemory.js` **already exists** (792 lines) with four cohorts —
`fixture`, `archived`, `terminal`, `peak` — a frozen prediction manifest, `--reps` / `--cohorts` /
`--out`, a fresh `node --expose-gc` child per arm, its own corpus per arm on a real Node root under
the OS temp directory, and random-hex payloads. **Extend it. Do not rebuild it, and do not rewrite
its existing cohorts.**

Add:

1. **The stop-state cohort** — what a persisted cascade stop costs, resident and on disk.
2. **The production-profile cohort** — qualify the proposed production profile *at its actual
   earliest limiting dimension*, including worst-case schema reservations.

**Dependencies:** T9 (landed, #701) for stop; T8/T8b for the capacity profile. **Not** I2 or P1 — this
runs independently.

## Branch and PR posture

- **Branch:** `claude/agent-tasks-m1-stop`, cut off `integration/agent-tasks-v1` at `e662da68c` and
  pushed.
- **PR into `integration/agent-tasks-v1`** — **not `release`.**
- **Artifacts in `.ai/tasks/active/agent-tasks-m1-stop/`.** The family finalizes at cluster close; do
  **not** run `/finalize-task`.
- **Runs in parallel with `agent-tasks-i2`**, which owns the new `packlets/prompt/`. **You own
  `perf/`.** Do not touch `packlets/prompt/`; I2 will not touch `perf/`. If I2 lands first, merge the
  landing into your branch and re-run, as `agent-tasks-tracked-commands` did.

---

## The manifest discipline — the thing most likely to go wrong

The harness header says, of its `MANIFEST`:

> *"The prediction manifest below was written before the first run and is not edited after one. A miss
> is reported as a miss: diagnose the harness first, then revise the design or profile — never the
> threshold."*

It already carries three `amendments`, each naming what changed and confirming no threshold moved —
including one where a fixture was too small for its own stated precondition and the *count* was raised
rather than the bound lowered. **Follow that form exactly:**

- **Add new prediction keys** (`stop`, `productionProfile`). **Do not edit the existing four.**
- **Write your predictions before the first run of your cohorts**, in the manifest, in the same
  falsifiable shape as the existing ones — a concrete number and what a miss would mean.
- Any change after a recorded run goes in `amendments` with the date, the reason, and what did **not**
  change.
- A failed prediction is a **finding**, and the design or the profile moves, not the threshold.
  `TESTING_GUIDELINES.md`: *"A threshold chosen after seeing the result measures nothing."*

## Fixture validity is a gate, not a preliminary

The same section records a harness that produced confident, meaningless numbers twice. Non-negotiable:

- **Independently generated incompressible random hex.** No `padEnd`, no shared payload arrays, no
  repeated-string backing stores, no closures retaining all records. The existing `hex()` helper is
  there; use it.
- **Each arm builds and releases its own corpus in its own fresh child.** No arm shares a prebuilt
  corpus with another — the A/B that shares one reports "no difference" for entirely the wrong reason.
- **Run the fixture check before trusting anything**: for ≥16 MiB of unique payload, allocation ≥80%
  of payload volume and release 80–120% of the measured allocation, 1 MiB noise. The existing
  `fixture` cohort does this; your cohorts must be covered by it or do their own.
- Drop the repository, caches, returned pages and adapter references before the after-close sample.
  Two of the three existing amendments exist because a lingering reference inflated a residual.

## Cohort 1 — stop state

**What T9 persists, verified:** `stops?: ReadonlyArray<IStopIntent>` lives **on the root task's commit
record** (`types/storage.ts`). An intent's `targets` is *"the complete authoritative subtree captured
under the writer at acceptance — root first, then breadth-first with task-id tie breaks — never a
filtered or truncated tree."* Each `IStopTarget` is
`{ taskId, attempt, operationId, state, confirmedRevision?, stableSourceEvidence?, violation? }`,
where `IStableStopEvidence` is `{ sourceId, contractVersion, sourceRevision }` and `IStopViolation` is
retained durably so a contradicted stop stays inspectable. Latched tasks additionally carry
`IStopLatch`.

**The question this cohort exists to answer.** There are **eleven** capacity dimensions
(`allCapacityDimensions` in `types/failure.ts`) and **not one of them counts stop intents, targets or
latches**. A cascade stop over a wide subtree therefore grows **the root's own record**, charged
against `record-bytes` — which the default profile sets to **32 MiB**
(`types/capacityProfile.ts:63`). So:

> **At what subtree breadth does a cascade stop become limited, and by which dimension?**

State a falsifiable prediction before measuring. The orchestrator's rough reckoning — *and this is a
claim to reproduce, not a result* — is that bare targets are a few hundred bytes of JSON each, putting
`record-bytes` far above the 10,000 non-archived default, **but** that with `stableSourceEvidence` and
maximal 4 KiB source identities the same bound could fall *below* the task-count limit, making
`record-bytes` the earliest limiting dimension for a wide external subtree. **Reproduce or refute
that arithmetic before building a prediction on it.** The orchestrator's capacity arithmetic was
wrong once already: it modelled `resident-payload-bytes` alone and asserted 1,000 registrations were
reachable; built, the profile refused the **537th** on `logical-bytes`.

Measure, at minimum:
- Marginal **disk** bytes and **resident** bytes per target, with and without `stableSourceEvidence`,
  at small and maximal source identities.
- Breadth cohorts (e.g. 100 / 1,000 / 10,000 targets under one root) — report which limit actually
  stopped seeding, as the plan requires.
- Latch cost per latched task, separately from target cost.
- A stop's cost **after** reconciliation and after release, so it is clear what a settled or released
  intent still retains.
- Whether a wide stop's root record read/rewrite shows up in peak, since the whole target list is one
  record. The plan: *"Read/ack/rebuild peak and rewrite time do reflect the largest consumer record"* —
  the same reasoning applies to a stop's root.

**Report marginal bytes per target, per latch and per evidence record separately. Do not sum
non-independent deltas as if shared objects were disjoint** — the plan says this explicitly.

## Cohort 2 — the production profile at its earliest limiting dimension

The plan: *"Separately qualify the proposed production profile at its actual earliest limiting
dimension, including worst-case schema reservations; its maxima are concurrent constraints, not a
promise that every maximum can be reached together."*

This is the cohort that makes A3's resource profile qualified rather than asserted, and the gate says
so: *"Missing measurements keep A3's resource profile unqualified even if deterministic tests and
coverage pass."*

- **Find the earliest limiting dimension empirically**, by seeding until something refuses, and
  **record which dimension refused and at what count** — not which one you expected to.
- Include the limiting fixtures the plan lists: many short-lived tracked checklist items; all allowed
  non-archived tasks terminal-but-unacknowledged; maximum owed/pinned fanout; many closed
  subscriptions near the global history ceiling; large operation evidence; unresolved registrations
  **and stop intents**; a full inventory of mixed archived and live tasks.
- Report **absolute** steady-state and peak memory, not only ratios.
- Measure **receipt preparation and acknowledgement** as well as open: *"making history cold trades
  steady residency for bounded but potentially expensive parsing and rewriting."*
- Throughput and latency are descriptive, reported **separately** from the correctness counters.

**The known concrete datum to start from:** T8b's shipped default profile refuses the **537th**
registration on `logical-bytes` (`.ai/tasks/active/agent-tasks-t8b/result.md`, and
`src/test/unit/delivery/saturation.test.ts` pins 536 admitted). That is a measured fact about the
built profile; use it as the anchor for "earliest limiting dimension" rather than re-deriving it.

## What this stream is not

- **Not a Jest test.** It stays in `perf/`, run on demand against a built `lib/`. It is *"not excluded
  from coverage to make the suite pass"* and *"not a heap/RSS threshold in CI."*
- **Not a replacement for structural evidence.** *"A small measured heap cannot replace structural
  evidence that the real rebuild/acknowledgement lane ran."* The deterministic counters live in
  `src/test/unit/storage/counters.test.ts`; do not touch them to make a number look better.
- **Not a profile change.** If the measurements say the default profile should move, that is a
  **finding to surface with the curves**, and the orchestrator and the user decide. Do not change
  `capacityProfile.ts` in this stream without surfacing first.

## Gates

This stream's gates differ from a feature slice's, because `perf/` is not linted (`eslint src`) and
not covered.

- [ ] `rushx build` passes with **zero warnings** (unchanged `src/` should mean unchanged output)
- [ ] `rushx test` still passes — you are not expected to change `src/`; **if you do**, the full
      feature-slice gates apply to that change (lint, 100 % coverage, no `c8 ignore`), and say why a
      source change was necessary
- [ ] `rush change --verify --target-branch origin/integration/agent-tasks-v1` — **a change file is
      still required**: CI's first gate keys off *files touched*, not surface changed, and `perf/` is
      in the package. Type it **`minor`**, and `"none"` is the right `type` only if nothing shipped
      changes
- [ ] The harness runs clean from a built `lib/`, five repetitions per arm, and the parent cleans up
      its temp roots
- [ ] **Raw per-run data plus medians and ranges published**, not percentage improvements alone
- [ ] Predictions stated in `MANIFEST` **before** the first recorded run; any later change in
      `amendments`
- [ ] The plan's M1 status line updated — it currently says *"the production-profile cohort and the
      stop-state cohort (after T9) remain"* — and the ledger entry written **in this PR**
- [ ] No revert-matrix rows: there is no protection here to revert. **Say so in `result.md`** rather
      than leaving the gate silently unmet

## Review

Layer 1 (`code-reviewer`) on the harness code, then a Copilot loop — the harness is code and can be
wrong. But the review that matters most here is **whether the numbers mean anything**, which is what
the fixture checks, the controls and the stated-before predictions are for. Ask layer 1 specifically:
*does any arm share state with another, and is every reported delta attributable to one owner?*

Include the deliberate **controls** the plan requires — a perf-only full-summary-retaining control and
an all-record-buffering control — *"to show that the harness detects the unwanted behaviors."* A
harness that cannot fail is not evidence.

Copilot's API trigger is unreliable; use a bare `@copilot review` **comment**.

## Exit artifact

`result.md`, opening with a one-line `**Shipped:** …` for the capability feed. It must record:

- **The frozen manifest** for both new cohorts, as stated before the first run.
- **Raw per-run numbers, medians and ranges**, with Node/V8/OS/arch, adapter, profile, fixture
  counts/shapes, sample method, repetitions and tolerances.
- **The fixture validity check** for each new cohort, with its actual allocate/release figures.
- **Which dimension actually limited each cohort, and at what count** — including whether
  `record-bytes` limits stop breadth.
- Marginal bytes per target, per latch and per evidence record, **separately**.
- What a settled and a released intent still retain.
- **Any missed prediction**, stated as a miss, with the harness diagnosis and the design/profile
  consequence — never a revised threshold.
- A recommendation on the production profile, with the reasoning the qualification gate asks for: how
  the measured process *plus other host workloads* fits a host's provisioned memory and disk budget.
  No universal safe RSS number.
- Anything for P1 or a later profile decision, routed durably.

Keep `state.md` current; `state.md` plus this brief must be enough to resume cold.

## Required reading, in order

1. This brief.
2. `.ai/instructions/TESTING_GUIDELINES.md` § *Measurement Harnesses* — in full.
3. `docs/design/agent-tasks/implementation-plan.md` § M1 — the cohort table, the fixture-validity
   rules and the qualification gate.
4. `libraries/ts-agent-tasks/perf/residentMemory.js` — the whole file; its manifest and amendments are
   the form to follow.
5. `.ai/tasks/active/agent-tasks-t8b/result.md` — the capacity profile as built, and the 537th-
   registration finding.
6. `.ai/tasks/active/agent-tasks-t9/result.md` — what a stop persists and when.
7. `libraries/ts-agent-tasks/src/packlets/types/stop.ts` — `IStopIntent`, `IStopTarget`,
   `IStopLatch`, `IStableStopEvidence`, `IStopViolation`.
8. `libraries/ts-agent-tasks/src/packlets/types/capacityProfile.ts` and `types/failure.ts` —
   `allCapacityDimensions`, and `record-bytes` at 32 MiB.
9. `libraries/ts-agent-memory/perf/residentMemory.js` — the cross-package precedent.

## Missing-input rule

If a required-reading file does not exist, or does not say what this brief claims, **STOP and surface
the gap.** Do not reconstruct intent from surrounding code and proceed. In particular: **this brief's
arithmetic about `record-bytes` and target size is the orchestrator's reckoning, not a measurement.**
Check it.
