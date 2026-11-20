# Stream brief — `agent-tasks-t7`

Slice **T7 — Subscriptions, exact issued receipts and acknowledgement** of
`docs/design/agent-tasks/implementation-plan.md` § 5.

## Mission

Explicit consumer and subscription identity with start policies; serialized baseline creation;
candidate audiences committed with updates; broker preparation around pure rendering; an injected
checkpoint store; exact issued-receipt manifests with expiry and pins; and durable exact-ID
acknowledgement.

**Dependencies:** T2, T5, T6 — all landed.

## Branch and PR posture

- **Branch:** `claude/agent-tasks-t7`, created off `integration/agent-tasks-v1` at `6a0e6c4ea`
  (the T6 landing) and pushed.
- **PR into `integration/agent-tasks-v1`** — **not `release`.**
- **Artifacts stay in `.ai/tasks/active/agent-tasks-t7/`.** This family finalizes at **cluster
  close**, not per slice. Do **not** run `/finalize-task`.

---

## You are turning on a seam that two prior slices built reservations against

This is the single most important thing in this brief, and getting it wrong is silent.

**Today the audience seam answers "nobody."** `TaskAudienceResolver` is internal
(`createTaskBroker` in the broker packlet, **not exported from the package**), and in production it
resolves every update's audience to the empty set. That is deliberate: T5 recorded that the seam
writes audience links **with no acknowledgement-evidence reservation**, which is precisely why it
was never made a host option.

**T7 is the slice that fills it.** Two consequences, both recorded in `docs/TECH_DEBT.md` as
hand-offs to you:

1. **From T5** — *"every accepted update must first reserve its per-audience acknowledgement
   evidence (design § 8.6 allocation 2)."* An update accepted without that reservation is an
   obligation the store cannot prove it can discharge.
2. **From T6, and this is the one that is easy to get backwards** — *"Settlement and replay claims
   reserve `maxAudiencePerUpdate` links/acknowledgement ids per update, but the audience seam still
   answers 'nobody'; when T7 fills it, it must **spend these reservations rather than mint new
   ones**."*

**Minting instead of spending is the failure mode.** It passes every functional test — the
subscription works, the receipt issues, the ack lands — and quietly double-counts capacity against
a profile that is already over-subscribed. Write a test that pins the *charge*, not just the
behaviour: an update whose audience the seam now fills must consume the claim T6 already reserved,
and the ledger must show one charge rather than two.

Note the related retention fact you inherit: **an update owed to no one is not retained.** Once the
seam answers someone, retention behaviour changes for updates that previously vanished. That is a
behaviour widening no signature will reveal — see the repo-wide `rush test` gate below.

## The review gate: exact-ID logic, not a max-revision watermark

The plan's gate is *"adversarial receipts and checkpoint custody; verify exact-ID logic rather than
max revision, and fail-closed behavior of custom checkpoint stores."*

**The tempting implementation is a high-water mark** — remember the newest acknowledged revision and
treat everything at or below it as discharged. It is simpler, it is what a checkpoint intuitively
suggests, and it is wrong. The plan hands you the exact falsifier:

> Omit a revision-3 attention change, include revision-4 progress, and **prove ack does not clear
> revision 3.**

A watermark implementation passes almost everything and fails that one. **Write that test early** —
before the acknowledgement path is finished — so the design is forced into exact-ID from the start
rather than retrofitted. If you find yourself storing a single revision number per subscription,
stop and re-read this paragraph.

The adversarial receipt list is the specification: fabricated delivery ID; modified task, revision
or update list; **shortened and enlarged** receipts; foreign consumer, subscription or store
receipt; unissued snapshot receipt; duplicate entries; replay before ack, after ack, and after
expiry. And: *old and truncated receipts cannot consume newer or omitted obligations*.

**Fail-closed custom checkpoint stores.** The store is injected, so a host can supply one that
throws, lies, or returns someone else's checkpoint. A store that fails must not produce an
acknowledgeable context — *"issuance failure returns no acknowledgeable context"* — and **host
processing precedes checkpoint commit.**

## The structural acceptance properties

- **No subscribe/mutate gap, no renderer write, no global read flag.** Broker preparation wraps
  *pure* rendering; the renderer must not write. T2 built the snapshot-only renderer with pure
  inclusion receipts — keep it pure.
- **B's baseline is independent of A's acknowledgements.** Two consumers do not share progress.
- **Pending delivery uses stored audiences, not current selection membership.** A subscription
  whose selection changes does not retroactively alter what is already owed.
- **An open-only subscription must retain its terminal exit update**, and parent/status-filtered
  subscriptions must retain required exit updates **after reparent or transition**. The filter
  decides what you subscribe to, not whether you are told it ended.
- **Reopen under changed host defaults, and the persisted delivery policy stays authoritative.**
  Reject selection changes or admission incompatible with a required `source-replay` guarantee.
- **Reassignment with two consumers leaves checkpoints independent after reopen.**

## A3 — reservations, and the ceiling you must restate

Reserve each accepted update's and baseline's future **acknowledgement-or-disposition evidence
before acceptance**, and one **reusable cleanup preparation per subscription**. New subscriptions
reserve possible terminal audiences **before activation**.

Test: activation crash with pending claims; exact-ID reservation conversion after an
ack-before-cleanup crash; duplicate receipts consuming **no second slot**; one long-lived
subscription's acknowledged/disposed history growing independently of open and archived task
counts, with **archive and close not reducing its lifetime charge**; expired issuance manifests
evicted **separately** from exact history; and prepare/ack draining at ordinary admission
saturation.

**The running ceiling, which you will move.** `docs/TECH_DEBT.md` records: registration baseline
448 KiB → **146** non-archived tasks; each in-flight external command adds 64 KiB, so one per task
→ 512 KiB → **128**. Against a profile that still advertises **1,000**.

T7 adds per-audience acknowledgement evidence and per-subscription cleanup preparations. **State the
new arithmetic and the new effective ceiling in `result.md`, and amend the TECH_DEBT entry in this
PR.** If T7's reservations make the declared profile unreachable by a wider margin still, say so —
that strengthens T8's case rather than being T7's problem to fix. **But if A3's requirements prove
unimplementable under the current profile rather than merely tight, stop and surface it.**

## Loop expectation, set deliberately

Read `CODING_STANDARDS.md` § *"Authorization boundaries are the same blind spot, and the loop runs
longer"*. **T7 is squarely one**: a receipt is a capability, acknowledgement consumes an obligation,
and a checkpoint is custody. A wrong answer either discloses something or discharges an obligation
that was never met.

T5's loop ran seven rounds and T6's ran six, each finding real ordering and ownership defects after
a clean layer 1. **Expect the same and do not call diminishing returns while rounds are still
finding real defects.**

At layer 1, do what T5 and T6 did: **enumerate every check-then-act window in the diff** — each
point between issuing a receipt and committing its checkpoint, between accepting an update and
reserving its evidence, between preparing and acknowledging — and say what re-checks after it. T6
listed twelve such windows; that enumeration is why its threat model reads as guarantees rather than
as a list of checks.

## Package surface

`libraries/ts-agent-tasks` only — delivery and storage packlets, their types, converters and tests.
Plus this stream's artifacts, the plan's **T7 status line**, and this stream's own ledger entry.

## Out of scope

- **Every package outside `ts-agent-tasks`.** It depends only on `@fgv/ts-json-base` and
  `@fgv/ts-utils`; if you find yourself editing either, or `libraries/ts-res/`, stop and surface it.
- **T8's retention replacement.** `archive` currently refuses a task while any retained update has a
  non-empty audience (`retention-blocked`). **T8 replaces that with acknowledgement/disposition
  evidence and pruning — not you.** Filling the audience seam will make that refusal fire far more
  often; that is expected, and it is T8's to resolve. Record what you observe.
- **T9's `capabilities()` and source-side stop.** **I1's tool factory.**
- **Do not fix `ts-utils`'s `isKeyOf`.** Escalated by T1, still unfixed, still not this slice's.
- **Do not fix the three known CI flakes** (`docs/TECH_DEBT.md`): a wall-clock assertion in
  `ts-extras`, `rush install`'s single-attempt dependency fetch, and an Argon2id mock deriving
  colliding keys. Read the log, confirm it is one of those three, re-trigger.

## Gates

- [ ] `rushx build` **zero warnings**; `rushx lint`; `rushx fixlint` before the final commit
- [ ] `rushx test` at 100% coverage. **Remove branches that cannot execute rather than testing
      them** — T4, T5 and T6 all closed to 100% with zero `c8 ignore`
- [ ] `rush change --verify --target-branch origin/integration/agent-tasks-v1`
- [ ] Repo-wide `rebuild` **and** `test`, **on the final source**. The `test` half is not optional
      here: filling the audience seam changes what the store *retains* and what `archive` *refuses*
      without moving a signature, and a rebuild is a compiler that cannot see it
- [ ] `verify-capability-docs`, `generate-capability-feed --check`, `verify-esm-entrypoints`,
      `verify-bundler-resolution`, `verify-tarball-exports`
- [ ] No `any`; all fallible operations return `Result<T>`
- [ ] `code-reviewer` **before** coverage closure; findings resolved or dispositioned in the PR

## Traps this stream's predecessors paid for

1. **An evidence run is only evidence of the code it was run against.** T3's mutation matrix ran on
   an intermediate head; re-run on final source, **nine rows turned nothing red, five real gaps.**
   T5 and T6 both re-ran their revert checks on the final source. **Re-run before you claim it.**
2. **A bounded array whose entries carry an identity needs a uniqueness constraint, not just a
   length cap.** T1 hit this three times in one loop. You are building receipt manifests and
   acknowledgement-id sets — this is your whole slice.
3. **A test comparing a constant to a constant looks like a guard and is not.**
4. **A review round that posts zero comments is not evidence of a clean diff** — read the summary's
   "previously missed" block.
5. **A test double that accepts and does nothing proves nothing.** T6's review gate named this
   exactly, and its `SimulatedExecutor` is the answer: neutering it turns 18 tests red. **Your
   injected checkpoint store and your test consumers need the same property** — if a store stops
   persisting, tests must go red. Verify it by doing it.
6. **A finding that lives only in a PR body is one you are throwing away.** Route anything that
   outlives this slice somewhere durable **in this PR**.

## Exit artifact

`result.md`, opening with a one-line `**Shipped:** …` that becomes the capability-feed `sourceLine`
verbatim. It must record:

- **How the T6 claims were spent rather than minted**, with the test that pins the charge.
- Every check-then-act window and its re-check.
- The exact-ID acknowledgement design, and explicitly that it is not a revision watermark.
- The new reservation arithmetic and the new effective ceiling.
- What filling the audience seam did to `retention-blocked` frequency — evidence for T8.
- Anything belonging to T8/T9/I1, routed durably.

Keep `state.md` current. If the session crosses a context boundary, `state.md` plus this brief must
be enough to resume cold.

## Required reading, in order

1. This brief.
2. `docs/design/agent-tasks/implementation-plan.md` § T7, and § A3 in § 1.
3. `docs/design/agent-tasks/development-design.md` § 8.6 — allocation 2, the acknowledgement
   evidence reservation this slice must honour.
4. `docs/TECH_DEBT.md` — **both** hand-off entries (T5's and T6's) and the capacity entry.
5. `.ai/tasks/active/agent-tasks-t6/result.md` — the claims you must spend, and its twelve-window
   enumeration as the model for your own.
6. `.ai/tasks/active/agent-tasks-t5/result.md` — the broker and the audience seam.
7. `.ai/tasks/active/agent-tasks-t2/result.md` — the pure renderer and its inclusion receipts.
8. `libraries/ts-agent-tasks/src/packlets/` — `broker/`, `storage/`, `context/`.
9. `.ai/instructions/CODING_STANDARDS.md` § *Review-loop discipline*, especially the
   authorization-boundary section.

## Missing-input rule

If a required-reading file does not exist, or a plan section does not say what this brief claims,
**STOP and surface the gap.** Do not reconstruct intent from surrounding code and proceed.
