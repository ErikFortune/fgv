# Result — `agent-tasks-t9` (slice T9)

**Shipped:** A cascade pause or cancel is a persisted, honestly reported intent — the repository freezes the whole authoritative subtree before a reopened store accepts a write, reserves every target's command before accepting the stop, and a host-driven pump confirms each target under current authority, never rounding a partial stop up to success.

PR: _(filled on open)_ into `integration/agent-tasks-v1`. Written 2026-09-27.

---

## The stop model, as implemented against design § 10

| § 10 element | as implemented | deviation, and why |
|---|---|---|
| `StopMode`, the eight `StopTargetState`s, `IStopTarget`, `IStopRequest`, `IStopResult` | as written | `IStopTarget` gains `violation` (a contradicted stable stop, kept durably) and `stableSourceEvidence` (source, contract version, confirming revision). `IStopResult` gains `restrictedWorkRemains` and `capacity` |
| `IStopIntent` on the root (§ 8.3 `stop?`) | `IResolvedTaskCommitRecord.stops?: IStopIntent[]` | an **array**: § 10 represents overlapping pause/cancel intents independently. At most one *latching* intent per mode per root; released and settled intents stay as evidence |
| intent states | `pending` `blocked` `satisfied` latch; `released` `settled` do not | — |
| command identity per `(intent, target, mode, attempt)` | a **minted** operation id per attempt, persisted in the root intent before any dispatch; the target's stored command carries `stop: { rootId, intentId }` | tuple-encoding two 128-char ids cannot fit the 128-char operation-id bound. The property that matters — the same key across restarts — comes from persisting it |
| `ITaskSource.capabilities()` | optional; absent = the source stops nothing | names the stop **command and its parameters** per mode instead of § 5's `commands: string[]`: the kind registry is already the command authority (T6), and a stop needs parameters a name cannot supply |
| stop authority | `stop` on the root as `subject` to request/pump; `stop` as the new role **`stop-target`** on every target; `release-stop` to release | — |
| a task list | a pause target is confirmed without a command (it has no own work); a cancel target is cancelled | — |

The four traversal rules are implemented as stated: the subtree is captured from the resident graph
(hidden, archived, unresolved, quarantined and external descendants included); a descendant's
`stopPolicy` is never consulted for traversal; the only bound is 1,000 targets, and a larger tree is
**refused, never truncated**; the preset needs a native root (external parents use `none`, § 4).

### Every place acceptance is distinguished from completion

| # | where | the test a "success with skipped child" implementation fails |
|---|---|---|
| 1 | `requestStop` persists the intent `pending`, every target `unexamined`, and **dispatches nothing** | `stopAcceptance` *"persists the whole authoritative subtree, root first then breadth-first by id, and dispatches nothing"* |
| 2 | storage refuses a new intent whose targets are not **exactly** the authoritative subtree, whoever computed it | `stopRules` *"a stop that skips a child is refused, whatever computed it"*; revert rows T9-1 (storage) and T9-2 (broker capture) |
| 3 | a pass limited by its budget cannot satisfy: `satisfied` needs a pass that visited every target and found each `confirmed` | `stopPump` *"a bounded pass stops at its limit…"*; revert row T9-24 |
| 4 | a receipt is not a stop: an `accepted` command is `pending` until the source's state shows the stop | `stopSources` *"a receipt is not a stop"* |
| 5 | an external target is `confirmed` only under a **declared stable stop**, with its evidence; a sampled pause is `unsupported` | `stopSources` *"a sampled pause…"* |
| 6 | observation-only / undeclared children are `unsupported`, a blocker | `stopSources`, `stopPump` *"an external child without a stop declaration blocks; the native effects stand, with no rollback"* |
| 7 | the summary may lag its records; a **presentation never overstates**: a confirmed target that left the stopped set is shown `indeterminate` with its violation, and the stop `blocked`, before any pump runs | `stopSources` *"an autonomous restart…"*; revert row T9-28 |
| 8 | stable-stop evidence is revalidated per broker instance: after a restart a satisfied stop resting on it is shown `pending` until this instance's own complete pass persists it satisfied | `stopCrash` *"…stable-stop evidence is revalidated after reopen"*, `stopRegressions` H1; revert rows T9-18, T9-29 |
| 9 | a contradicted stable stop keeps the intent `blocked` until re-confirmed under a new attempt | `stopRegressions` L1; revert row T9-22 |
| 10 | a tree whose membership moved outside the broker blocks the stop, and the host is told | `stopFaults` *"a tree whose membership moved…"* |
| 11 | a blocked cancel is never archived as a successful stop; only an archive of a satisfied cancel whose targets are **terminal now** settles it | `stopRelease`; `stopFaults` *"an archive settles a cancel only from its targets as they are now"* |

## Check-then-act windows and their re-checks

| # | window | what re-checks after it |
|---|---|---|
| W1 | `requestStop`: visibility, `stop` authorization, root admission (native, not archived, policy), revision — outside the writer | in the writer: root re-read (gone → changed); the same key committed meanwhile → replayed, not re-accepted; revision equal (so kind, policy and archived state are the ones admitted); no latching intent of the mode; **subtree captured here**; keys minted here; policy epoch immediately before the commit. Storage then re-verifies subtree equality, the acceptance shape and the reservation |
| W2 | `releaseStop`: authorization, `_releasable`, revision — outside | in the writer: re-read; same key → replay; revision; `_releasable` **again** (an intent's state moves without a semantic revision — another release, a pump); epoch before the commit |
| W3 | a replayed request or release | `isSameCatalog`, re-authorization of the action, and `confirmUnchanged` (revision + epoch in the writer) before the evolving result is released |
| W4 | pump: `stop` on the root at the start (epoch captured before the first question); per-target `stop-target` authorization at each visit | in the writer, for a native commit and for an external intent record alike (`_current`): the intent still latches and the attempt is unchanged; the target re-read; its authorization subject unchanged; epoch immediately before the write |
| W5 | the dispatch boundary under `stop` authority (`dispatchIntent` with the stop permit) | in the writer: command still `not-sent`; subject unchanged; epoch; the **latch/marker gate** — an unmarked command under a latch settles `stop-active`, a stop's command whose intent no longer latches settles `conflict`; storage's key rule: a marked command must be a live, unlanded attempt of the intent it names |
| W6 | an uncertain stop command resolved by its key (`resolveCommand` with the stop permit) | T6's resolution windows, unchanged |
| W7 | supersession, decided from a visit (and, for a conflict, a fresh observation) | in the writer: the intent still latches and the attempt is still the one decided on (`_ours`); a key minted; epoch; storage: attempt +1, key held by no attempt |
| W8 | the pass's findings → the root's summary | in the writer: the intent re-read; released/settled meanwhile → findings discarded; merged target by target by attempt (a target another caller superseded keeps that caller's entry); **epoch moved → discarded, and nothing counts as revalidated** (H1) |
| W9 | revalidation of stable evidence | marked only from a result this pass itself persisted `satisfied`, from a complete pass, under an unchanged epoch |
| W10 | presentation from a lagging summary | reads each target's current record; no write |
| W11 | archive of a satisfied cancel's root | in the writer: every target re-read and required terminal **now** |
| W12 | catalog operations under a latch (create, reparent, complete, archive) | the broker's pre-check is for a clear refusal only; storage re-checks inside the same commit, which is the guarantee (revert row T9-32 shows the storage refusal standing alone) |
| W13 | capacity preflight → the write | planned and applied in the same synchronous storage commit: no await between |

## The admission freeze

**Enforced by storage, on every commit, under the writer.** Refused while a stop latches: a
registration under a latched parent; a reparent of a latched task or into a latched task; a lifecycle
move to `running` from anything, or out of the latch's required stopped set (`paused → waiting` under
a pause) — decided on the states, so no command spelling bypasses it; a new unsettled command to a
latched external task's source; the sending of a command recorded before the latch; a command
squatting on an attempt key; a marked command that is not a live attempt; list completion; archive of
a latched task. Source observations of **external** tasks are exempt — a source is authoritative and
a restart degrades the stop instead — and a native task gets no such exemption (M3).

**It survives reopen.** The latch book is part of the `TaskIndex`, fed by every indexed record;
open recounts it after its first pass, derives every stop reservation, and only then accepts a write.
Evidence: `stopCrash` (a latch in force after a crash at each window), `stopOpen` (a clean repository
reopens with its latches; forged records block open), `stopCapacity` (a repository reopened mid-stop
derives the identical ledger). Revert rows T9-15, T9-16.

Concurrency cases the plan names, each its own test in `stopFreeze`: attachment before and after the
latch, attachment below descendants, reparent out of and within the subtree, a newly discovered
external child, and bypass through update tools and the raw writer.

## The two inherited hand-offs

- **T5 (4) — no stop latch was checked by list completion or relationship operations.** Resolved:
  storage refuses list completion, new children, reparenting and archive under a latch; the broker
  pre-checks for a clear `stop-active` refusal. `docs/TECH_DEBT.md` marked resolved.
- **T6 (4) — `ITaskSource.capabilities()` and the source side of a stop.** Resolved:
  `ITaskSource.capabilities?(binding)`, validated by a converter on every pass and never carried
  across a restart; `ExternalTaskSource` takes it as an option. The stable-stop contract is declared
  there. Marked resolved.

## A3 — capacity, and the no-partial-dispatch proof

Reproduced from source, not taken from the brief: one attempt bundle = one operation + one
`maxStoredOperationBytes` + one `maximumSettlementCharges` = **643,625 logical / 627,241 record /
37,417 resident bytes** under the default profile; maximum target encoding 1,834 B, intent framing
6,538 B.

- **Reserved before acceptance, for every target.** Each unlanded, unconfirmed attempt on a live
  target funds one bundle: the additive dimensions on the root's ledger entry, `record-bytes` (a
  per-record dimension) on the target's; the root also holds the intent's maximum growth and a release
  operation. Per-task operation slots and subscription delivery units are held the same way.
  **Derived from the records, never stored**; open recomputes it.
- **The no-partial-dispatch proof** (`stopCapacity`): with the limit one byte short of the stop's
  whole reservation, the stop is refused on `logical-bytes` and **no record changes** — not the root,
  not the first target, none. At exactly the reservation it is accepted, ordinary growth is then
  refused, and every accepted attempt still lands and the stop is released at the full repository.
  Structurally there is nothing to dispatch at acceptance at all — acceptance writes the intent and
  its reservation in one commit, and the pump sends only reserved attempts. Revert rows T9-12, T9-13,
  T9-14.
- **At saturation** an accepted attempt settles from its reservation; a *fresh* attempt (a
  supersession) is new admission and fails with a visible `IStopResult.capacity` blocker, the old
  attempt standing. A capacity refusal is made safe to return (no record id, no figures of a record
  the caller may not see — M2).
- **What binds first.** A stop changes it: 400 plain registrations admit a stop over **at most 211**
  of them, refused on `logical-bytes` (pinned by test, found by search). Arithmetic estimate, not
  pinned: a stop over a whole repository of *n* plain tasks fits for n ≲ 325. The bundle uses schema
  maxima; tightening it is routed (TECH_DEBT, stop hand-off 2).

## M1 — the stop-state cohort

**Judged to belong with the M1 production-profile cohort, not added here.** What T9 adds to resident
state is the latch book: per latching intent a projection of ids, keys, confirmed flags and encoded
size (never the evidence, § 7), a latch entry per target, and an entry per marked command. Its size
is proportional to the targets of latching intents, which the reservation already bounds (211 of
400 above) and which deterministic tests pin structurally. Measuring its bytes is a harness change
against a frozen manifest; a cohort would need a prediction stated before the run, and the honest
prediction depends on the production profile the remaining M1 run qualifies. Routed:
`docs/TECH_DEBT.md`, stop hand-off (3), trigger *the M1 production-profile cohort run*. The frozen
manifest is untouched.

## Routed to I1 / I2 / P1

Nothing was built for them. I1's stop tools map onto `requestStop` / `reconcileStop` /
`releaseStop` / `inspectStop` and the `stop` / `release-stop` actions as they stand; P1 exercises the
journeys. Anything that outlives this slice is in `docs/TECH_DEBT.md` (below).

## Review

**Layer 1 — `code-reviewer`, on `e55f0d5e`, before coverage closure.** No P1 code defects. One lint
warning, fixed. Findings applied: the archived branch of `_closeoutHeld` removed (a latched task is
never archived); the open-time bundle derivation simplified into a Result chain; a
`stopAttemptBundle` overflow unit test (an unrepresentable profile yields no bundle rather than an
inexact one); a non-null assertion on a marker replaced by a local. Coverage gaps it listed were
closed by the scenario work below, not by directives.

**Layer 2 — semantic review against § 10 plus the cascade adversarial journey (independent
antagonist), on `e55f0d5e`.** Seven defects, each demonstrated by a probe; all fixed in `c5e4ceb7`,
each with a regression in `stopRegressions` and a revert row:

| | finding | fix | row |
|---|---|---|---|
| H1 | a pass whose findings were discarded under a moved policy still marked stable evidence revalidated | `_persist` reports whether the summary is this pass's own; revalidation needs it | T9-18 |
| M1 | a freeze refusal named the (possibly hidden) stop root and intent | names only the task asked about | T9-19 |
| M2 | a capacity refusal at acceptance leaked a target's record id and figures | `stopCapacity` / `_safeFailure` keep only the dimension | T9-20 |
| M3 | an observation-purpose commit could start a latched **native** task | the exemption is for external tasks only | T9-11 |
| M4 | abandoning an uncertain stop command dropped its marker | the marker is kept | T9-21 |
| L1 | a contradicted stable stop left the intent `pending`, not `blocked` | blocked while a violation is not re-confirmed | T9-22 |
| L2 | a denial met at the dispatch boundary was never re-attempted | a definite non-effect: superseded under a new attempt | T9-23 |

**Coverage closure after both reviews.** Rather than cover unreachable branches, the pump's
under-writer reads were consolidated (`_ours` / `_current`), drafts share `redraft` / `withIntent`,
every draft builder carries stops through one public helper (`carriedStops`), and two dead paths were
removed: `readCommit` never fails `unknown-kind-version` (only `read` does), and the in-writer
re-admission of an unchanged revision re-decided nothing. What remained was pinned by a race suite
(`stopRaces`: policy-hook and concurrent-caller interleavings), a fault suite (`stopFaults`:
injected storage failures and self-contradicting repositories, source refusals, the effect budget), a
request-edge suite, and raw-writer storage-rule tests. Two non-null assertions in `StopBook` state
the invariant that a removal mirrors an earlier add.

**Layer 3 — Copilot.** _(filled from the loop on the PR)_

## Gates, on the final source

_(filled after the final run)_

## Revert matrix — on the final source

_(filled from `perf/mutationMatrix.js`)_

## Hand-offs (routed to `docs/TECH_DEBT.md` in this PR)

- **P2** stop hand-offs T9 left open: (1) explicit abandonment of a blocked cancel (§ 10 step 8
  "may"); (2) the attempt bundle uses schema maxima; (3) the M1 stop-state cohort.
- The T5 (4) and T6 (4) hand-offs addressed to T9 are marked resolved.
