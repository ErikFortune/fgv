# Stream brief — `agent-tasks-t9`

Slice **T9 — Persistent cascade stop with admission enforcement** of
`docs/design/agent-tasks/implementation-plan.md` § T9.

## Mission

Root + transitive target capture; persisted latch and target operation identities; bounded
host-driven reconciliation; current per-target authority; classified partial outcomes; stable-stop
source declaration and explicit pause-latch release. The full-hierarchy admission gate is enforced
on reopen, before any mutation.

**Dependencies:** T5, T6, T8 and amendment A2 — all landed on `integration/agent-tasks-v1`.

## Branch and PR posture

- **Branch:** `claude/agent-tasks-t9`, created off `integration/agent-tasks-v1` at `ea6b6f38b`
  (the `release`-up merge following T8's close) and pushed.
- **PR into `integration/agent-tasks-v1`** — **not `release`.**
- **Artifacts stay in `.ai/tasks/active/agent-tasks-t9/`.** This family finalizes at **cluster
  close**, not per slice. Do **not** run `/finalize-task`.

---

## The semantics this slice exists to get right

**A2 is the approved amendment and it is unusually explicit.** Read its row in the plan's § 1 table
before the T9 section:

> Include bounded cascade pause/cancel **as a best attempt with an observable result**: persisted
> intent, explicit partial effects/blockers, stable-stop source opt-in, and frozen subtree admission
> while latched. **Acceptance remains distinct from completion. No all-or-nothing execution promise;
> no silent skipped children or weakening of intent/recovery requirements.**

Everything hard about T9 follows from that sentence. A stop is not a transaction. It is an intent
that is *persisted*, *partially satisfied*, and *honestly reported* — and the failure mode is a
design that quietly rounds a partial result up to a success.

**The review gate names the exact rounding you must not do:** *"A standing guarantee is withheld for
sources without the stable-stop contract; **no 'success with skipped child' fallback**."*

Design **§ 10** gives you the types verbatim — `StopMode`, `StopTargetState` (eight states:
`unexamined` `pending` `confirmed` `unsupported` `denied` `unavailable` `refused` `indeterminate`),
`IStopTarget`, `IStopIntent`, `IStopRequest`, `IStopResult`. Use them as written; where you must
deviate, say so and why, as earlier slices did when they revised T1's vocabulary.

### Four traversal rules that are easy to get backwards

All four are stated in § 10's opening paragraph, and each inverts a reasonable instinct:

1. **Traversal is authoritative, not visibility-filtered.** A target the caller cannot see is still
   a target. `IStopResult.targets` is *view-filtered for the caller*, but the intent is not. A stop
   that misses a hidden-but-delegated descendant is wrong even though the caller cannot tell.
2. **A descendant's `stopPolicy: 'none'` does not block ancestor traversal.** It controls requests
   *originating at that descendant*. Treating it as an opt-out of being stopped is the natural
   misreading.
3. **No display-depth or visibility budget limits traversal.** Deep trees and the target limit are
   an explicit test case; a bound that silently truncates is the same defect as a skipped child.
4. **The preset is only available where this repository owns complete tree membership.** A host with
   externally mutated topology cannot enable it without routing all admission through the same
   broker boundary.

### Acceptance is distinct from completion — make the distinction visible in the types

- Root own work **and** all authoritative descendants are accounted for.
- **Open observation-only children block satisfaction.** They are not stoppable and not ignorable.
- Supported children may stop while others remain blocked, **with no rollback claim**.
- Accepted commands remain `pending` until authority confirms quiescence — a receipt is not a stop.
  The plan's test list says this twice, in different words: *"real child stop vs mere receipt."*
- **External autonomous restart violates the stable-stop contract and degrades satisfaction
  visibly.** A source that restarts work after a confirmed stop must make the intent observably
  worse, not silently stay satisfied.

## The admission freeze

While a latch is held: new subtree admission, reparent, start and resume are **rejected**. The gate
is enforced **on reopen before mutations**, not only in the live process — a latch that evaporates
on restart is the whole slice failing.

Concurrency cases the plan names, each its own test: concurrent attachment before and after the
latch; attachment *below* descendants; reparent out of and within the subtree; a newly discovered
external child; and **attempts to bypass via update tools**.

**Two inherited hand-offs are yours, both in `docs/TECH_DEBT.md`:**

1. **From T5** — *"no stop latch is checked by list completion or relationship operations yet."*
   Those are exactly the paths a caller would use to get around a freeze.
2. **From T6** — *"`ITaskSource.capabilities()` and the source side of a stop."* Design § 5 lists
   `capabilities()`; T6 omitted it deliberately, because the kind registry was the only authority it
   needed. A cascade stop that must ask a source to stop is yours to add, together with whatever
   capability report it needs. **The stable-stop contract is declared here.**

## Recovery and the crash windows

Crash after the root intent; after a child command commit; after a child effect; before the root
summary; and before satisfaction. **Recover by child operation IDs** — that is why the identities
are persisted.

Also required:

- Revalidate persisted **source stop-contract evidence after restart**. A contract that was true
  before the restart is not evidence that it is true now.
- A **definitely rejected** revision-conflict attempt gets a **new** persisted attempt/key; an
  **uncertain** attempt retains its **original** request/key. That asymmetry is the idempotency
  rule, and getting it backwards either duplicates an effect or loses one.
- Archive a fully satisfied cancel into a settled summary with retained graph closure. **A blocked
  cancel must not become a successful archived stop.**
- Exercise `paused → waiting` as well as start/resume against the stopped-state invariant.
- Nested `none`; overlapping pause/cancel; stronger cancellation; releasing one of several latches;
  pending pause release with commands in flight; terminal cancel membership.
- **No timer or work-start behaviour in the pump.** The pump reconciles; it does not drive work.

## A3 — capacity, and the partial-dispatch proof

Preflight and reserve the **root and per-target settlement**, the required audiences, and the
permitted release/disposition **before accepting a stop**.

At saturation: accepted attempts can settle, and the intent can be maintained or released where
authorized; a fresh attempt may fail admission **with an observable capacity blocker**.

**And the one that needs a deliberate test: prove no partial dispatch occurs merely because later
targets lack reserved capacity.** A stop that dispatches to the first three of five targets and then
discovers it cannot pay for the rest has already changed the world. Reserve for all, then dispatch.

T8 closed the capacity work and left the profile documented at **536 plain registrations**, bound by
`logical-bytes` rather than `non-archived-tasks`. Your saturation tests inherit that reality; if a
stop's reservations change what binds first, say so.

## M1's stop-state cohort

The plan schedules M1's **stop-state cohort after T9**. The harness
(`libraries/ts-agent-tasks/perf/residentMemory.js`) exists, was run by T8b on this implementation,
and its prediction manifest is **frozen**. If T9 warrants a stop-state cohort, adding one is a
harness change and needs saying out loud — **do not edit the frozen manifest**, and do not choose a
threshold after seeing a result. If you conclude the cohort belongs to P1 or to a later pass, say
that instead of inventing one.

## Review gates — the plan names a semantic review

1. **Layer 1, `code-reviewer` before coverage closure.**
2. **Semantic review against design § 10, plus the cascade adversarial journey.** The plan asks for
   this specifically. T8 ran an independent persistence/delivery antagonist and it found two HIGHs
   that four Copilot rounds had not; commission the equivalent here, pointed at § 10's semantics
   rather than at persistence.
3. Then the implementer-driven Copilot loop.

**Loop expectation.** `CODING_STANDARDS.md` § *"Authorization boundaries are the same blind spot,
and the loop runs longer"* applies directly: a stop **is** an authority — to freeze admission, to
end others' work, to refuse a mutation. T5 ran seven rounds, T6 six, T7 six, T8 PR 1 four plus an
antagonist. Judge on the finding profile, and remember that **a round is not empty until its
previously-missed block is empty too** — T8 PR 1 hit that twice in four rounds.

At layer 1, enumerate every check-then-act window in the diff and say what re-checks after it. Four
slices running have found their real defects that way.

## Package surface

`libraries/ts-agent-tasks` only — `broker/`, `implementations/`, `storage/`, their types, converters
and tests; plus this stream's artifacts, the plan's T9 status line and this stream's ledger entry.

**Headroom check before you add to a file.** The `max-lines` cap is a promoted **P1** and T8b paid
it with a designed extraction. As of 2026-09-27 nothing in this package is close —
`storage/repository.ts` is 1817 (183 of headroom) and the next is 1467 — but you are working in
`storage/` and `broker/`, so check the file you are about to grow rather than discovering the cap as
a red check.

## Explicitly out of scope

- **I1's tool factory, I2's prompt fragments, P1's proving ground.** Note I1 needs T9 *only* for
  opting into stop tools, so do not build tool surface here.
- **Reshaping T8's retention or capacity work.** Surface it if you must.
- **Every package outside `ts-agent-tasks`.**
- **Do not fix the three known CI flakes** (`docs/TECH_DEBT.md`, P2 inventory). Read the log,
  confirm it is one of the three, re-trigger.
- **The non-UX coverage-to-100% chore** is filed and parked until this cluster lands; it is not
  yours.

## Gates

- [ ] `rushx build` **zero warnings**; `rushx lint`; `rushx fixlint` before the final commit
- [ ] `rushx test` at 100 % coverage with **zero `c8 ignore`** — every slice from T4 on has managed it
- [ ] `rush change --verify --target-branch origin/integration/agent-tasks-v1`. **Type the change
      file `minor`**, with a `BREAKING:` prefix if it breaks anything — `ts-agent-tasks` has never
      been published, so `major` is wrong however breaking the change is
      (`ACTIVE_DEVELOPMENT.md` § *How to type a change file*)
- [ ] Repo-wide `rebuild` **and** `test`, **on the final source**
- [ ] `verify-capability-docs`, `generate-capability-feed --check`, `verify-esm-entrypoints`,
      `verify-bundler-resolution`, `verify-tarball-exports`
- [ ] No `any`; all fallible operations return `Result<T>`
- [ ] All three review layers recorded in `result.md`
- [ ] The plan's T9 status line and this stream's ledger entry **written as shipped in this PR** —
      a PR cannot observe its own merge

## Skills to load, and when

| when you are about to | load |
|---|---|
| write or review any `Result<T>`-returning code | `/result-pattern` |
| write or review tests | `/result-tests` |
| write or review a converter, validator or type guard | `/type-safe-validation` |
| touch file I/O or the persisted-latch paths | `/filetree-io` |
| compute a structural fingerprint or use an object as a map key | `/value-hashing` |
| write anything that "feels general" | `/published-primitives-reflex` |

## Traps this stream's predecessors paid for

1. **An evidence run is only evidence of the code it was run against.** T3's mutation matrix ran on
   an intermediate head; re-run on the final source, nine rows turned nothing red and five were real
   gaps. Every slice since re-runs. **Re-run before you claim it.**
2. **Quote a suite and a total, not a bare ratio.** T7 reported "22 of 28" for a falsifier; the
   re-run gave 26 of 33, because "28" named nothing anyone could count. T8 fixed this by naming
   suites per revert row, and the orchestrator reproduced its eight-suite claim exactly.
3. **A brief's arithmetic is a claim like any other.** The orchestrator's capacity table for T8b
   modelled one dimension and concluded 1,000 was reachable; implemented, the profile refuses the
   537th registration on a *different* dimension. T8b caught it because it reproduced the numbers
   instead of trusting them. **Do the same to anything numeric in this brief.**
4. **A test double that accepts and does nothing proves nothing.** Neuter yours and watch tests go
   red.
5. **A bounded array whose entries carry an identity needs a uniqueness constraint, not just a
   length cap.** You are persisting target and attempt identities — this is your slice.
6. **A review round that posts zero comments is not evidence of a clean diff** — read the
   previously-missed block.
7. **A finding that lives only in a PR body is one you are throwing away.** Route anything that
   outlives this slice to `docs/TECH_DEBT.md` **in this PR**.

## Exit artifact

`result.md`, opening with a one-line `**Shipped:** …` that becomes the capability-feed `sourceLine`
verbatim. It must record:

- The stop model as implemented against § 10, and **every place acceptance is distinguished from
  completion** — with the test that a "success with skipped child" implementation fails.
- Every check-then-act window and its re-check.
- The admission freeze: what it rejects, and the evidence it survives reopen.
- The two inherited hand-offs (T5's latch gap, T6's `capabilities()`), resolved or explicitly routed.
- The A3 results, including **the no-partial-dispatch proof**.
- Whether an M1 stop-state cohort was added, deferred, or judged to belong elsewhere — with reasoning.
- Anything belonging to I1/I2/P1, routed durably.

Keep `state.md` current. If the session crosses a context boundary, `state.md` plus this brief must
be enough to resume cold.

## Required reading, in order

1. This brief.
2. `docs/design/agent-tasks/development-design.md` **§ 10** — the types, verbatim.
3. `docs/design/agent-tasks/implementation-plan.md` § T9, the **A2 row** in § 1, and row 9 of the
   gate table.
4. `docs/TECH_DEBT.md` — the T5 and T6 hand-off entries addressed to T9.
5. `.ai/tasks/active/agent-tasks-t8b/result.md` and `agent-tasks-t8/result.md` — what the capacity
   ledger and retention rules now do, and the 536 figure your saturation tests inherit.
6. `.ai/tasks/active/agent-tasks-t5/result.md` — bound authority; who may authorize what.
7. `libraries/ts-agent-tasks/src/packlets/` — `broker/`, `storage/`, `implementations/`.
8. `.ai/instructions/CODING_STANDARDS.md` § *Review-loop discipline*, especially the
   authorization-boundary section.

## Missing-input rule

If a required-reading file does not exist, or a plan section does not say what this brief claims,
**STOP and surface the gap.** Do not reconstruct intent from surrounding code and proceed.
