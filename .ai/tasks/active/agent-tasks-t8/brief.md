# Stream brief — `agent-tasks-t8`

Slice **T8 — Retention, backpressure and recovery journeys** of
`docs/design/agent-tasks/implementation-plan.md` § T8.

## Mission

Explicit obligation disposition and consumer closure; safe progress coalescing; issued-receipt
pins; tombstone archive with a minimal resident projection; full A3 capacity accounting and
protected drain behaviour; end-to-end reopen reconciliation; recovery reports and index repair.

**Dependencies:** T3–T7 — all landed on `integration/agent-tasks-v1`.

## Branch and PR posture

- **Branch:** `claude/agent-tasks-t8`, created off `integration/agent-tasks-v1` at the T7 landing
  and pushed.
- **PR into `integration/agent-tasks-v1`** — **not `release`.**
- **Artifacts stay in `.ai/tasks/active/agent-tasks-t8/`.** This family finalizes at **cluster
  close**, not per slice. Do **not** run `/finalize-task`.

---

## You are the slice that makes `archive` possible at all

Read this before anything else, because it inverts what the earlier slices could assume.

`archive` refuses a terminal task while any retained update names a non-empty audience —
`retention-blocked`. Before T7 that never fired in production, because the audience seam answered
"nobody". T7 filled the seam, and the consequence is recorded in its `result.md` and pinned by
`delivery/retention.test.ts`:

> **With one matching subscription, every task it covers is retention-blocked at archive — and it
> stays blocked after every id has been acknowledged**, because T7 never prunes a stored audience.

So today, on the integration branch, a repository with any subscription whose selection covers a
task **can never archive that task**. T7 correctly declined to fix it and routed it here. **Your
pruning against exact acknowledgement history and disposition evidence is what unblocks it.**

Two consequences for how you work:

1. **You cannot treat the existing `retention-blocked` tests as a specification to preserve.** Some
   of them pin the *current* refusal, which is exactly what you are replacing. Read
   `delivery/retention.test.ts` as evidence about today's behaviour, then decide per test whether
   it survives, changes or goes. Say which in `result.md`.
2. **`archive` unblocking is a widened accepted set, and no signature moves.** Per
   `TESTING_GUIDELINES.md`, a repo-wide `rush rebuild` is a compiler and cannot see it. The
   repo-wide `rush test` gate below is not optional for this slice.

## The two ways an obligation can end, and why disposition is the hard one

An obligation is discharged by **acknowledgement** (T7 built this: the exact id lands in the
consumer's history) or by **disposition** (yours: the obligation ends *without* the consumer ever
acknowledging it).

Disposition is where the whole slice can go quietly wrong, because the tempting implementation is
"drop it and free the reservation". The plan's review gate is explicit about the standard:

> every recovery case must be either preserved state/obligation, explicit incomplete operation, or
> explicit error — **never unexplained absence.**

and the acceptance list adds: **cleanup cannot invent successful outcomes, abandon obligations
without authority, or bypass stop blockers.**

Three specific dispositions the earlier slices have already routed to you, each with a hand-off
entry in `docs/TECH_DEBT.md`:

- **A held command never settles on its own** (from T6). A `possibly-sent` command the pump holds
  — non-idempotent with no lookup answer, or its source key expired — stays unsettled indefinitely,
  keeps its 64 KiB settlement reservation, and blocks `archive`. Only a later `lookupCommand` that
  finds it settles it; an ordinary observation does not, and a source with no lookup never will.
  You need an **explicit, audited host disposition** (e.g. *"abandoned: outcome unknown"*) that
  consumes the reservation **without claiming an outcome**. The same holds for a `source-replay`
  command settled `accepted` while it awaits a feed revision the feed never reaches.
- **A closed or revoked subscription's obligations** must be retained or explicitly disposed —
  never silently dropped. T7's subscriptions are only ever active; `closed`, `disposed` and
  `coalesceProgress` are yours, together with the capacity each releases.
- **A `source-replay` task registered after the feed passed its revisions** (from T6). The feed
  reports an observation for a binding no task holds as `unknown-binding` and moves on, so
  revisions emitted before registration are never replayed. Your recovery journeys should either
  **enforce the ordering or detect the gap** — decide which, and say why.

**The falsifier to write early.** A disposition that frees a reservation while the consumer could
still legitimately be owed the update is indistinguishable, in every functional test, from a
correct one. Before you build the disposition path, write the test that a "drop it and free the
slot" implementation fails: an obligation disposed without authority, or a disposition that
reports success for an outcome nobody observed. If you cannot name the test that goes red, you do
not yet have the distinction implemented.

## Checkpoint commits precede update pruning — and consumer corruption blocks cleanup

Two acceptance properties that are orderings, not features:

- **Checkpoint commits precede update pruning.** You may not prune an update until the evidence
  that discharges it is durably committed. The crash matrix is the proof: failure before and after
  the checkpoint replace, after acknowledgement before response, and before and after task update
  cleanup.
- **Consumer corruption blocks cleanup.** A consumer record that cannot be read or verified must
  stop pruning, not be skipped. T7 built the fail-closed store custody (`storage-corrupt`,
  read-back fencing); yours is the cleanup path that must respect it rather than route around it.

Enumerate every check-then-act window in your diff and say what re-checks after it, as T6 (twelve
windows) and T7 (thirteen) did. That enumeration is why their threat models read as guarantees
rather than as lists of checks, and it is the single practice that has most reliably found the real
defects in this family.

## A3 — the saturation journeys, and the profile decision you must stage

### The journeys

For **every** § 8.6 dimension, use small finite profiles to reach ordinary saturation while
preserving claims, then: reject new growth → complete the largest allowed accepted task → settle an
accepted uncertain command after source resolution → prepare/ack or explicitly dispose every
accepted update → prune → archive → close → reopen. **Assert exact used/reserved transfers across
every crash point**, including pending subscription activation and acknowledged-but-unpruned
records.

Distinguish **transient capacity released by cleanup** from **identity / acknowledgement / dedup
ceilings that never shrink in v1**. An already-admitted required event must not need new
unreserved acknowledgement space.

Also: lifetime acknowledgement exhaustion on one subscription and across many closed subscriptions;
repeated ordinary command identities and rejected-after-admission operations; pinned receipts;
oversized results; claimed-but-never-resolved pending registrations.

### The profile decision — stage it, do not guess it

`docs/TECH_DEBT.md` records the headline: `defaultTaskCapacityLimits` advertises
`'non-archived-tasks': 1000`, and the reservation arithmetic admits **146** (448 KiB per
registration against 64 MiB of `resident-payload-bytes`) — **128** with one in-flight command per
task, **113** with one `current` subscription as well. Unreachable by ~7× under *ordinary* use.
The entry says plainly: **"T8 cannot sign off the profile without resolving this."**

Three candidate resolutions are recorded there, and the choice is a design decision, not a cleanup:

- **(a) charge actual rather than worst-case-per-category** in the closeout reserve, if the
  reservation model permits it
- **(b) raise `resident-payload-bytes`** to whatever actually admits 1,000 (≈ 448 MiB)
- **(c) lower `'non-archived-tasks'`** to the number the profile can actually serve, and say so

**Investigate (a) first, and report whether it is structurally possible.** The honest doubt is
this: a reservation exists to guarantee a *future* step can be paid, and you cannot charge "actual"
for an update you have not seen — you must reserve the maximum it might need. If that reasoning
holds, (a) is not available for a forward reservation and the entry's framing is optimistic. Say so
with the reasoning if you find it; that is a useful finding, not a failure to deliver.

**A fourth candidate the entry does not name, which you should evaluate:** the 448 KiB is
`7 categories × maxUpdateBytes (64 KiB)`. Lowering `maxUpdateBytes` moves the ceiling
proportionally. Whether 64 KiB per update payload is the right cap is a real question this family
has never examined — it was chosen in T1. Evaluate it; do not assume it is fixed.

**What to deliver, and what to escalate.** Deliver the arithmetic for each candidate with its
resulting number, and your recommendation with reasoning. **Do not change the published default
profile without an orchestrator round-trip** — `defaultTaskCapacityLimits` is `@public` and the
number is what consumers size against. Its docstring already calls the profile *proposed* pending
"the planned residency and reopen measurements before the profile is advertised", so correcting it
costs nothing downstream; that is an argument for correcting it, not for correcting it silently.

**M1 runs on your implementation, and the harness already exists.** The plan says *"Run final M1
cohorts on this implementation before accepting its default profile."*
`libraries/ts-agent-tasks/perf/residentMemory.js` was authored in T4 (788 lines, four cohorts —
`fixture`, `archived`, `terminal`, `peak`) and runs on demand against the built package:

```
rushx build && node perf/residentMemory.js --reps 5 --out <file>.json
```

**You are running it, not writing it.** Two things follow, and both matter:

- **Its prediction manifest was frozen on 2026-09-23, before the first run, and its header says it
  is not edited after one.** Respect that. If a cohort misses, the harness's own instruction is:
  *"diagnose the harness first, then revise the design or profile — never the threshold."* A
  threshold moved to match a result measures nothing.
- **The `fixture` cohort is the residency sanity check** that `TESTING_GUIDELINES.md` §
  *Measurement Harnesses* makes non-optional: if dropping the fixture does not release roughly what
  building it consumed, the corpus was never resident and every number downstream of it is noise.
  Read that section before you interpret any output.

Paste the actual figures into `result.md`. A green check is not a measurement.

## The host runbook ships in this PR

The plan requires it at implementation time, in the **package documentation**: status and 80%
pressure, stopping new admissions, draining reclaimable space, explicit finite-limit raise after
resource review, or leaving a full repository available for reads and drain. **No deletion or
migration workaround.**

Per `CODING_STANDARDS.md` § *Docs ship with the code*, this is not a follow-up. A runbook that
lands after the mechanism is a runbook written from memory.

## Explicitly out of scope

- **Physical deletion, and inventory / acknowledgement / dedup compaction** — out of scope **only
  under A3's explicit finite-history limitation**. If you conclude the limitation does not actually
  cover a case you hit, stop and surface it rather than quietly compacting.
- **T9** — the persistent cascade stop, `ITaskSource.capabilities()`, and the source side of a
  stop. Note T5's hand-off: no stop latch is checked by list completion or relationship operations
  yet. That stays T9's.
- **I1's tool factory, I2, P1.** M1's harness is **authored already** (T4) — you run its cohorts
  and report the figures; you do not rewrite it, and you do not edit its frozen manifest.
- **Every package outside `ts-agent-tasks`.** It depends only on `@fgv/ts-json-base` and
  `@fgv/ts-utils`; if you find yourself editing either, stop and surface it.
- **Do not fix `ts-utils`'s `isKeyOf`.** Escalated by T1, still unfixed, still not this slice's.
- **Do not fix the three known CI flakes** (`docs/TECH_DEBT.md`, P2 inventory): a wall-clock
  assertion in `ts-extras`, `rush install`'s single-attempt dependency fetch, and an Argon2id mock
  deriving colliding keys. Read the log, confirm it is one of those three, re-trigger.

## Review gates — note that this slice has two

1. **Layer 1, `code-reviewer` before coverage closure** — as every slice.
2. **An independent persistence/delivery antagonist pass**, which the plan requires for T8
   specifically and for no other slice in this family. That is a *separate agent* reading for
   recovery-case completeness against the standard above — preserved state, explicit incomplete
   operation, or explicit error, never unexplained absence. Commission it after layer 1 and before
   the Copilot loop, and record its findings in `result.md` alongside the other two layers.

**Loop expectation.** `CODING_STANDARDS.md` § *"Authorization boundaries are the same blind spot,
and the loop runs longer"* applies squarely: disposition is the authority to end an obligation
nobody discharged. T5 ran seven rounds, T6 six, T7 six — each finding real ordering and custody
defects after a clean layer 1. **Do not call diminishing returns while rounds are still finding
real defects.**

## On size — surface early if this outgrows one PR

T7 was 83 files and +12,111/−605 with a six-round loop, and T8's deliverable list is longer on
paper. `CODING_STANDARDS.md` notes that a PR hitting the ten-round cap "almost always indicates
layer 1 was skipped or the PR is too large for the loop and should be decomposed."

**If you reach a point where the mechanism (disposition, closure, coalescing, pins, tombstone
archive, pruning, recovery reports, index repair) is complete and the saturation-journey matrix
plus profile qualification is clearly a second body of work, stop and surface a proposed split**
rather than pushing one unreviewable PR. That is an orchestrator decision, not yours to take
unilaterally — but it is yours to *raise*, and raising it early is much cheaper than at round eight.

## Gates

- [ ] `rushx build` **zero warnings**; `rushx lint`; `rushx fixlint` before the final commit
- [ ] `rushx test` at 100% coverage. **Remove branches that cannot execute rather than testing
      them** — T4 through T7 all closed to 100% with zero `c8 ignore`
- [ ] `rush change --verify --target-branch origin/integration/agent-tasks-v1`
- [ ] Repo-wide `rebuild` **and** `test`, **on the final source**. The `test` half is load-bearing
      here: unblocking `archive` widens what the store accepts without moving a signature
- [ ] `verify-capability-docs`, `generate-capability-feed --check`, `verify-esm-entrypoints`,
      `verify-bundler-resolution`, `verify-tarball-exports`
- [ ] No `any`; all fallible operations return `Result<T>`
- [ ] `code-reviewer` **before** coverage closure; then the independent antagonist pass; findings
      from both resolved or dispositioned in the PR

## Traps this stream's predecessors paid for

1. **An evidence run is only evidence of the code it was run against.** T3's mutation matrix ran on
   an intermediate head; re-run on the final source, **nine rows turned nothing red and five were
   real gaps.** T5, T6 and T7 all re-ran their revert checks on final source. **Re-run before you
   claim it.**
2. **Quote a suite and a total, not a bare ratio.** T7's artifact reported that neutering the
   checkpoint store turned "22 of 28" tests red. An orchestrator re-run on the final source gave
   **26 of 33** in `delivery/checkpoints.test.ts`. The protection was real and the error was in the
   safe direction — but nobody could re-count "28", which is how an unverifiable figure gets
   believed. Every number in your `result.md` must name what a reader can re-run to get it.
3. **A test double that accepts and does nothing proves nothing.** T6's `SimulatedExecutor` and
   T7's `InMemoryCheckpointStore` both have the property that neutering them turns tests red.
   Whatever doubles your disposition and pruning paths need, **verify it by doing it.**
4. **A bounded array whose entries carry an identity needs a uniqueness constraint, not just a
   length cap.** T1 hit this three times in one loop.
5. **A test comparing a constant to a constant looks like a guard and is not.**
6. **A review round that posts zero comments is not evidence of a clean diff** — read the summary's
   "previously missed" block.
7. **A finding that lives only in a PR body is one you are throwing away.** Route anything that
   outlives this slice somewhere durable **in this PR**.

## Exit artifact

`result.md`, opening with a one-line `**Shipped:** …` that becomes the capability-feed `sourceLine`
verbatim. It must record:

- **What now unblocks `archive`**, and which of T7's `retention-blocked` tests survived, changed or
  went, with reasoning.
- The disposition model: how an obligation ends without an acknowledgement, who may authorize it,
  and the test that a "drop it and free the slot" implementation fails.
- Every check-then-act window and its re-check.
- The full A3 saturation journey results, with exact used/reserved transfers across crash points.
- **The profile arithmetic for every candidate resolution, your recommendation, and the reasoning**
  — explicitly including whether (a) is structurally possible at all.
- **M1 cohort figures, pasted** — all four cohorts on the final source, with the `fixture`
  residency check stated, and any manifest miss reported as a miss.
- Anything belonging to T9/I1/I2/P1, routed durably to `docs/TECH_DEBT.md` in this PR.

Keep `state.md` current. If the session crosses a context boundary, `state.md` plus this brief must
be enough to resume cold.

## Required reading, in order

1. This brief.
2. `docs/design/agent-tasks/implementation-plan.md` § T8, and § A3 in § 1.
3. `docs/TECH_DEBT.md` — **four** entries: the capacity/profile entry (with its T6 and T7
   amendments), and the three hand-off entries from T5, T6 and T7. Every open item addressed to T8
   is in one of them.
4. `.ai/tasks/active/agent-tasks-t7/result.md` — the retention evidence, the reservation
   arithmetic, and the thirteen-window enumeration as the model for your own.
5. `.ai/tasks/active/agent-tasks-t6/result.md` — held commands and the replay envelope.
6. `.ai/tasks/active/agent-tasks-t5/result.md` — bound authority; who may authorize what.
7. `libraries/ts-agent-tasks/src/packlets/` — `storage/`, `delivery/`, `broker/`.
8. `.ai/instructions/TESTING_GUIDELINES.md` § *Measurement Harnesses*, then
   `libraries/ts-agent-tasks/perf/residentMemory.js` — its header and frozen manifest — before any
   M1 run.
9. `.ai/instructions/CODING_STANDARDS.md` § *Review-loop discipline*, especially the
   authorization-boundary section, and § *Docs ship with the code*.

## Skills to load, and when

Load just-in-time, not upfront:

| when you are about to | load |
|---|---|
| write or review any `Result<T>`-returning code | `/result-pattern` |
| write or review tests | `/result-tests` |
| write or review a converter, validator or type guard (disposition records, recovery reports) | `/type-safe-validation` |
| touch any file I/O, directory walk, or the tombstone/pruning paths | `/filetree-io` |
| compute a structural fingerprint, dedup, or use an object as a map key | `/value-hashing` |
| write anything that "feels general" | `/published-primitives-reflex` |
| add diagnostic output — recovery reports and index repair are squarely this | `/ts-utils-logging` |

## Missing-input rule

If a required-reading file does not exist, or a plan section does not say what this brief claims,
**STOP and surface the gap.** Do not reconstruct intent from surrounding code and proceed.
