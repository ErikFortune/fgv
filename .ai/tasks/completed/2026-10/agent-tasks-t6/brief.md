# Stream brief — `agent-tasks-t6`

Slice **T6 — Source adapters, commands and reconciliation** of
`docs/design/agent-tasks/implementation-plan.md` § 5.

## Mission

An external helper with typed projections and commands, a source revision comparator, optional push
hints, explicit paged reconciliation and recovery, source cursor storage, native/external operation
receipts, and safe handling of uncertain outcomes. Plus deterministic controllable and
observation-only test sources.

The acceptance bar in one line: **the source owns execution truth, and the broker never sets
external status optimistically.**

## Branch and PR posture

- **Branch:** `claude/agent-tasks-t6`, created off `integration/agent-tasks-v1` at `30da05785`
  (the T5 landing) and pushed.
- **PR into `integration/agent-tasks-v1`** — **not `release`.** T1–T5 all landed there.
- **Artifacts stay in `.ai/tasks/active/agent-tasks-t6/`.** This family finalizes at **cluster
  close**, not per slice — T1 through T5 are all still under `active/`. Do **not** run
  `/finalize-task` or migrate to `completed/`.

## The question that used to be open — DECIDED, build against it

**Executor-payload dereference: may terminal presentation dereference an executor-owned payload
after the broker update is acknowledged?**

**Decided 2026-09-24: no.** Terminal presentation shows the bounded projection only. It never
follows a reference to an executor-owned payload. Reaching that payload is a **separately-authorized
host action**, outside terminal presentation entirely.

This was carried undecided through T1–T5 and was going to land on you. It is settled *before* T6
rather than during it, so you build against a stated contract instead of stopping mid-slice.

**Where it is written down**, both of which you should read rather than relying on this brief:

- `development-design.md` at the bounds paragraph — the existing rule *"references carry
  identifiers, not automatic dereference permission"* now states explicitly that **terminal
  presentation is not an exception**.
- `implementation-plan.md` § 1 — the decision record, with the alternative that was declined and
  why.

**What this means concretely for T6.** The plan's layering fixture is now a straightforward
consequence rather than an open design: *an executor-owned payload larger than 64 KiB, a bounded
task projection that fits `details`, and proof that task and source-checkpoint records do not copy
retained source text or execution checkpoints, with recovery resolving the original source binding.*
Measure the serialized adapter projection independently of the execution record. The 1 MiB broker
source-checkpoint bound is **not** an executor-job limit — external storage keeps its own capacity
and durability contract.

**If the implementation pushes back on this, say so.** The decision was made from the design rule
and an asymmetry argument — permitting dereference later as an authorized host action breaks
nothing, while withdrawing it would be a contract change — not from evidence inside the adapter
layer. You are the first slice to hold these payloads. If building against it turns up a concrete
reason it is wrong, **surface that**; it is exactly the evidence the decision was made without.

## The second open question, which *is* yours to close

**Source-history spelling.** § 5 says `'latest-snapshot' | 'replayable-updates'`; § 1 and § 8.6 say
`'observed-state'` / `'source-replay'`. **T1 unified on § 8.6 and named T6 as the confirmer.**

Confirm § 8.6's spelling is right, and **correct § 5 of the plan in this PR** so the discrepancy
stops propagating. If implementation shows § 5's spelling is the better one, say so and surface it
rather than silently switching — T1's vocabulary is already built on § 8.6.

## The review gate: no blind re-execution, no second authoritative lifecycle store

Both halves are load-bearing and the plan states a specific trap for each:

- **Verify the simulated source actually applies commands.** The plan warns: *"the ingestion
  compatibility adapter's empty command set supplies no command evidence."* A test source that
  accepts a command and does nothing will make every command test pass while proving nothing.
  Your deterministic controllable source must actually apply, and a test must fail if it stops.
- **No second authoritative lifecycle store.** The source owns execution truth. **Accepted differs
  from applied**, and the broker must never write external status optimistically.

## Acceptance (plan § T6 — the list is the specification)

Source owns execution truth; broker never sets external status optimistically; accepted differs from
applied; an outage or missing implementation does not fail execution; terminal reconciliation works
after a missed publication; old pages and commands deduplicate; **unsupported or non-idempotent
uncertain dispatch is held rather than replayed**; the source cursor advances only after committed
projections; restart opens storage **without external side effects**.

Two ordering properties worth calling out because they are easy to satisfy accidentally and hard to
satisfy deliberately:

- For a replayable source, a latest revision-3 hint delivered **before** required feed revision 2
  must still commit revision 2's obligation before advancing projection to 3. **Neither command
  observations nor ordinary polling may bypass that cursor order.**
- For an unchanged source revision with a later `observedAt`, prove a freshness refresh is **not** a
  semantic-contract violation.

## A3 — reservations, and a live inconsistency you must not worsen

Reserve the maximum command result and settlement **before dispatch**; load retained dedup evidence
on demand, including archived-task replay; qualify finite source-replay envelopes or reject that
stronger guarantee before registration/subscription activation. Test bound exhaustion and extension,
over-bound source-contract failure, an unchanged cursor under backpressure, and a reserved terminal
observation while ordinary observed-state sampling is capacity-blocked. **No arbitrary replay
history may be skipped to reach terminal state.**

**Read `docs/TECH_DEBT.md` § the capacity-profile entry first.** The default profile declares
`'non-archived-tasks': 1000` beside `'resident-payload-bytes': 64 * MiB`, while each registration
already reserves 7 update categories × 64 KiB = 448 KiB — an effective ceiling of **146**. T5 added
reservations without moving that; verified independently at orchestration time.

T6 adds *more* reservations (command result and settlement, pre-dispatch). So: do not silently
increase the per-registration total; **state any new per-registration figure and the new effective
ceiling in `result.md`** and amend the TECH_DEBT arithmetic in this PR; and if A3's requirements
prove unimplementable under the current profile rather than merely tight, **stop and surface it**.

## T5 hand-offs you inherit

`docs/TECH_DEBT.md` carries T5's recorded hand-offs to T6/T7/T8/T9. Read that entry before
designing. The one that binds hardest on a neighbour: **T7 must reserve acknowledgement evidence
before the internal audience seam (`createTaskBroker`, not exported) is given real subscriptions** —
so if T6 finds itself wanting to widen that seam, that is a T7 conversation, not a T6 change.

## You still hold licence to revise T1's vocabulary — with three accumulated constraints

T1's unions were predictions, `ts-agent-tasks` is on the active-development list, and **nothing has
reached `release`**. If a member is wrong for what source adapters actually need, change it and
update T1's declared-vs-exercised table.

- **T3's constraint:** a revision changing a *persisted* shape is a storage-format change. Migration
  story, or a clear statement that no persisted record carries the member.
- **T4's constraint:** a revision changing an *indexed* member changes an index shape, so it needs a
  rebuild story, and `rebuildIndexes()` is the path that must produce it.
- **T5's precedent:** T5 revised nothing and instead *decided* several shapes, recording them as
  decisions. That is the better outcome when it is available — prefer deciding over revising.

## Package surface

`libraries/ts-agent-tasks` only — implementations, broker and storage packlets, their types,
converters and tests. Plus this stream's artifacts, `docs/design/agent-tasks/implementation-plan.md`
(the T6 status line, **and § 5's source-history spelling**), and this stream's own ledger entry.

## Out of scope

- **Every package outside `ts-agent-tasks`.** It depends only on `@fgv/ts-json-base` and
  `@fgv/ts-utils`; if you find yourself editing either, or `libraries/ts-res/`, stop and surface it.
- **Tools** — the ai-assist tool factory is I1.
- **T7 subscriptions and receipts; T8 retention and backpressure; T9 cascade stop.**
- **Do not fix `ts-utils`'s `isKeyOf`** (`item.hasOwnProperty(key)` rather than
  `Object.prototype.hasOwnProperty.call(...)`). Escalated by T1, still unfixed, still not this
  slice's business.
- **Do not fix the known CI flakes**, which are logged in `docs/TECH_DEBT.md` on `release`: a
  wall-clock assertion in `ts-extras`, `rush install`'s single-attempt dependency fetch, and an
  Argon2id mock deriving colliding keys. If one of them reddens your PR, **read the log, confirm it
  is one of those three, and re-trigger** — do not fix another package to get green.

## Repo gates

- [ ] `rushx build` **zero warnings**; `rushx lint`; `rushx fixlint` before the final commit
- [ ] `rushx test` at 100% coverage. **Remove branches that cannot execute rather than testing
      them** — T4 and T5 both closed to 100% with zero `c8 ignore`
- [ ] `rush change --verify --target-branch origin/integration/agent-tasks-v1`
- [ ] Repo-wide `rebuild` and `test`. **Run them on the final source**, not before review —
      see trap 1
- [ ] `verify-capability-docs`, `generate-capability-feed --check`, `verify-esm-entrypoints`,
      `verify-bundler-resolution`, `verify-tarball-exports`
- [ ] No `any`; all fallible operations return `Result<T>`
- [ ] `code-reviewer` **before** coverage closure; findings resolved or dispositioned in the PR

## Review-loop expectation, set deliberately

Read `CODING_STANDARDS.md` § *"Authorization boundaries are the same blind spot, and the loop runs
longer"* — codified from T5, whose loop ran **seven rounds** after a layer-1 pass with no P1s.

T6 is not an authorization boundary, but it is the same *shape* of risk in a different axis:
**correctness here is a property of ordering and of who owns truth**, not of values. Cursor advance
versus commit, accepted versus applied, hint versus required feed, dispatch versus reservation. A
clean layer-1 pass will not tell you much. **Budget for a substantive layer-2 loop and do not call
diminishing returns while rounds are still finding real ordering defects.**

At layer 1, do what T5 did and what that section now asks for: **enumerate every check-then-act and
observe-then-advance window in the diff** — each point where the cursor could advance past an
uncommitted projection, each dispatch that could precede its reservation — and say what re-checks
after it. A protection you cannot name that precisely is one nobody has located well enough to test.

## Traps this stream's predecessors paid for

1. **An evidence run is only evidence of the code it was run against.** T3's mutation matrix ran on
   an intermediate head; re-run on final source, **nine rows turned nothing red, five of them real
   gaps.** T5 re-ran its revert check on the final source for exactly this reason. If you produce
   evidence and then take review findings, **re-run before you claim it.**
2. **A bounded array whose entries carry an identity needs a uniqueness constraint, not just a
   length cap.** T1 hit this three times in one loop. You are building dedup keys and cursors.
3. **A test comparing a constant to a constant looks like a guard and is not.**
4. **A review round that posts zero comments is not evidence of a clean diff** — read the summary's
   "previously missed" block, not the comment count.
5. **A finding that lives only in a PR body or a stream artifact is a finding you are throwing
   away.** T4's capacity discovery had to be lifted into `TECH_DEBT.md` at orchestration time.
   Anything outliving this slice goes somewhere durable **in this PR**.
6. **Fix the class, not the flagged line.** Several review rounds in this repo flagged one instance
   of a staleness that was wider. Ask what made a finding true, not how to make that line agree with
   itself.

## Exit artifact

`result.md`, opening with a one-line `**Shipped:** …` statement that becomes the capability-feed
`sourceLine` verbatim. It must record:

- The source-history spelling confirmation, and the § 5 correction.
- What you learned about the executor-payload dereference question, and your recommendation.
- Every ordering guarantee, named as a window and its re-check.
- Any change to reservation arithmetic and its effect on the effective ceiling.
- Anything belonging to T7/T8/T9, routed durably.

Keep `state.md` current: what is done, what is open, the next concrete step. If the session crosses
a context boundary, `state.md` plus this brief must be enough to resume cold.

## Required reading, in order

1. This brief.
2. `docs/design/agent-tasks/implementation-plan.md` § T6, and § A3 in § 1.
3. `docs/design/agent-tasks/development-design.md` § 8.3 and § 8.6, and the bounds paragraph at
   line 193 (the "references carry identifiers, not automatic dereference permission" rule).
4. `.ai/tasks/active/agent-tasks-t5/result.md` and `brief.md` — the broker you are adapting into,
   and its recorded decisions.
5. `.ai/tasks/active/agent-tasks-t4/result.md` — the repository and index beneath it.
6. `libraries/ts-agent-tasks/src/packlets/` — `broker/`, `implementations/`, `storage/`.
7. `docs/TECH_DEBT.md` — the capacity-profile entry and T5's hand-offs.
8. `CODING_STANDARDS.md` § *Review-loop discipline*, especially the authorization-boundary section.

## Missing-input rule

If any file above does not exist, or a plan section does not say what this brief claims, **STOP and
surface the gap.** Do not reconstruct intent from surrounding code and proceed.
