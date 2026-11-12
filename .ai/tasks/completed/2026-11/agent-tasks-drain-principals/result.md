# agent-tasks-drain-principals — result

**Shipped:** a subscription now records the principals that may bind and drain its delivery — `bindDelivery` refuses anyone else exactly as it refuses a missing subscription, every bound-delivery operation re-applies the rule, the host can change the list through `TaskBroker.setSubscriptionDrain`, and `disposeWithheld` ends withheld obligations only through a binding whose policy carries the identity the subscription recorded as the consumer's own.

Branch `agent-tasks-drain-principals`, into `integration/agent-tasks-host` (PR #781). Package
`@fgv/ts-agent-tasks`; testbed journey updated. Change files: `@fgv/ts-agent-tasks` `minor`
(`BREAKING:`), `@fgv/testbed` `none`.

## Step 0 — `origin/release` merged first

`git merge --no-ff origin/release` (release @ `27dcf35ff`), committed alone as `40d894d5b`.
33 files conflicted because #752–#758 are on both sides — squashed on release into #760 — and git's
base (`e625f523f`, #751) saw two different additions. Every conflicted file was re-merged with
`git merge-file` against **`03f91abec` (#758)** as the base; #760's `ts-agent-tasks` tree is
byte-identical to it, so each side's delta is exactly its own later work. All code merged clean. The
same re-merge over every non-conflicted file both sides changed reproduced git's auto-merge exactly.
Hand resolutions were docs only: the 2026-10 archive and ledger index (both sides' entries, 52), the
regenerated capability feed, and the router, which release + #762's two shortcuts pushed to 24,303
of 24,000 characters (CI's `verify-capability-docs.mjs`) — several `ts-agent-tasks` shortcut
questions were shortened, symbols unchanged, to 23,992. The pre-commit prettier hook reformatted
eight release files inside the merge; they were restored to release's bytes.

Merged-tree gate, before any feature change: `install` ok; `rebuild` exit 0; `test` exit 0; fail-grep
0 in both; the only `warning` line is the tracked-symlink notice.

## Decisions, as shipped

1. **Drain principals at `subscribe`.** `ISubscribeRequest.drainPrincipals` — non-empty, at most
   `maxDrainPrincipals` (32), each a principal key, de-duplicated and stored ascending; default the
   registering principal alone. When a list is given the registrant is **not** added. Stored in the
   subscription specification (so it is in the pending manifest entry, the first record, and both
   replay comparisons), validated strictly on read (`drainPrincipals` converter), and reported on
   `ITaskSubscription.drainPrincipals` as the rule applied.
2. **`bindDelivery` refuses any other principal** with `not-found-or-denied` and the same message as
   a missing subscription or a wrong `consumerId` (a test pins all three equal). So does
   `TaskDeliveryPump.create`. **Beyond the brief:** every bound-delivery operation (`pending`,
   `prepare`, `acknowledge`, `abandon`, `issued`, `disposeWithheld`) re-applies the rule to the
   subscription as it stands — without that, a pump bound before the host removed its principal
   would keep draining.
3. **Legacy records are registrant-only** (`drainPrincipalsOf(record)`, public). Re-`subscribe` is
   not an idempotent update path here — `_replay` refuses any different specification — so the
   update is a small trusted operation, **`TaskBroker.setSubscriptionDrain(binding, { subscriptionId,
   drainPrincipals, policyIdentity? })`**: replace-whole, through the registering principal's
   binding with selectors covering the selection and a `subscribe` grant; active or closed; a no-op
   writes nothing. Storage: `ITaskRepositoryWriter.setSubscriptionDrain` (implementers only). A retry
   of the original `subscribe` after a change is `conflict`.
4. **`disposeWithheld` policy identity — built** (the #762 accepted residual, probe `s4`). New
   optional `ITaskAuthorization.policyIdentity` (read once at binding, converted; a throwing or
   multi-line identity fails the binding), `ISubscribeRequest.policyIdentity` recorded on the
   subscription, settable through `setSubscriptionDrain`; `trustedKindAuthority` takes one.
   `disposeWithheld` requires a recorded identity equal to the binding's — none recorded refuses
   every binding. **Refinement:** its principal rule moves from "the registrant" to "a drain
   principal"; with binding restricted and the policy axis tied to the consumer's identity, the
   drainer (in the host-subscribes / agent-drains pattern, the agent, whose policy is the
   consumer's) is the principal that should be able to end what its own policy withholds. The
   identity is a host-given name, not a credential; the broker checks agreement, not truthfulness.
5. **Testbed:** the journey's `subscribe` takes the drainer and every site names it (`agent:ada`,
   `agent:bob`, `host`); step 2 checks that `agent:bob` binding `sub-ada` is `not-found-or-denied`;
   the pinned check count moves 105 → 106 with the new check pinned.
6. **Docs:** TSDoc on every touched surface; `CAPABILITIES.md` (example names the drainer; the "host's
   to keep straight" paragraph replaced by the rule; `setSubscriptionDrain`; the new `disposeWithheld`
   rule).
7. **Change file:** `minor`, `BREAKING:`.
8. **Independent review fixes** (two P2, four P3; details and reasons in `state.md`):
   - `bindDelivery` decides the binding before it reads the subscription, so a malformed binding is
     `invalid` whether or not the subscription exists (it was an existence oracle).
   - **`TaskBroker.dispose` and `closeSubscription({ obligations: 'dispose' })` require a drain
     principal**; `closeSubscription({ obligations: 'retain' })` a drain principal or the registrant.
     Anyone else is `not-found-or-denied` before any task is put to the policy, re-decided in the
     writer on the record written. This closes the same cross-consumer harm for ending obligations
     that decisions 1–3 close for draining them.
   - A registration recorded without drain principals is the same registration as a retry naming its
     registrant alone (pending resume and live replay both).
   - The retry-after-`setSubscriptionDrain` `conflict` is kept and documented as recovery guidance.
   - `setSubscriptionDrain` and the stream's added checks in `pending` are Result chains; no added
     non-null assertion remains.
   - The request list is de-duplicated before the cap counts it.

## `docs/TECH_DEBT.md` — closure note for the orchestrator to reconcile

The entry from #780 is not on this branch (release is at #779 after Step 0). Both halves are
resolved by this stream: **(a)** any host code naming a consumer could bind and drain it — closed by
decisions 1–3; **(b)** the `disposeWithheld` policy-identity residual — closed by decision 4. Close
the whole entry when #780 and this stream meet. The review round extends (a) to **ending**
obligations: `dispose` and a disposing `closeSubscription` were the same cross-consumer harm through a
different door, and are closed the same way (decision 8). If #780's entry names only binding, note
that the disposition half is closed too.

## Red → green evidence

Tests were written after the code, so each protection was proved by reverting it:
`revert-matrix.py` (this directory) removes one protection from the source, runs the delivery and
host suites, and counts red tests. Every row went red; each was restored.

Re-run in full after the review round (counts below are that run; rows R1–R21 were re-pointed at
the refactored source where their text moved):

| row | red tests |
| --- | --- |
| R1 bindDelivery ignores drain principals | 7 |
| R2 subscribe default is not the registrant | 24 |
| R3 legacy record is not registrant-only | 3 |
| R4 request list not de-duplicated / sorted | 2 |
| R5 request list may be empty | 1 |
| R6 pending: no first drain check | 1 |
| R7 pending: no final drain check | 2 |
| R8 prepare: no drain check | 2 |
| R9 acknowledge: no drain check | 2 |
| R10 abandon: no drain check | 1 |
| R11 issued: no drain check | 1 |
| R12 disposeWithheld: identity not required | 3 |
| R13 disposeWithheld: no in-writer re-check | 2 |
| R14 disposeWithheld: registrant-only (old rule) | 1 |
| R15 setSubscriptionDrain: any principal may change it | 1 |
| R16 setSubscriptionDrain: no subscribe grant asked | 2 |
| R17 setSubscriptionDrain: no epoch fence | 1 |
| R18 setDrain: omitted identity not removed | 1 |
| R19 setDrain: no-op still writes | 1 |
| R20 replay ignores drain authority | 4 |
| R21 setSubscriptionDrain: selectors not required | 1 |
| R22 bindDelivery decides existence before the binding (the oracle) | 1 |
| R23 dispose: no drain-principal requirement before authorizing tasks | 1 |
| R24 dispose / close: no in-writer drain re-check | 3 |
| R25 in-writer re-check reads the raw list, not the legacy rule | 1 |
| R26 closeSubscription disposing admits the registrant | 1 |
| R27 closeSubscription retaining refuses the registrant | 1 |
| R28 closeSubscription retaining admits anyone | 2 |
| R29 pending registration compared without the legacy rule | 8 |
| R30 live registration compared without the legacy rule | 3 |
| R31 request list capped before de-duplication | 2 |
| R32 request list: distinct principals not capped | 1 |
| R33 stored list: strict ascending not required | 2 |
| R34 bind: a throwing policyIdentity is not captured | 2 |

R23 is pinned by the policy being asked nothing for a refused principal: the in-writer re-check
(R24) gives the same answer, so only that observation separates the two. The matrix's compile-error
detector now also matches Heft's `(TS…)` form; before, a row that failed to compile counted as 0
red (R28's first form did, and was rewritten).

Tests: `src/test/unit/delivery/drainPrincipals.test.ts` (new, 42), `drainDisposition.test.ts` (new,
8), two in `storage/subscriptions.test.ts` (legacy pending / live retry), plus updates to
`deliveryWithheld`, `withheldFaults`, `accounting`, `receipts`, `lifetime` and the writer doubles.

## Check-then-act windows this stream adds

| # | window | what can change in it | what re-checks after it |
| --- | --- | --- | --- |
| D1 | `bindDelivery`: descriptor read → binding built | nothing awaited; no window | — |
| D2 | binding made → any later operation | the host removes the principal | every operation re-reads the subscription and applies the rule (D3–D7) |
| D3 | `pending`: first check → listing, decisions, `recordsHold` | drain list replaced | a second descriptor check after the last await (R7) |
| D4 | `prepare`: drain check on the captured descriptor → render → writer | drain list replaced (bumps `recordRevision`) | the issuing section re-proves the record revision; a move recaptures, and the recapture's check refuses (R8; test removes alice mid-capture) |
| D5 | `acknowledge`: pre-check section → per-task authorization → committing section | drain list replaced | `_issuedMatch` applies the rule in the committing section, on the in-writer record (R9; test removes alice during the `acknowledge` grant) |
| D6 | `abandon`, `issued` | — | checked in the writer, on the record it acts on (R10, R11) |
| D7 | `disposeWithheld`: drain + identity pre-check → listing, decisions → writer | drain list or recorded identity replaced | both re-decided on the in-writer record before `disposeObligations` (R13; tests replace each mid-call) |
| D8 | `disposeWithheld`: binding made → call | the policy object's identity property changes | none by design: the identity is read once at binding (test pins it) |
| D9 | `setSubscriptionDrain`: owner/selector/grant decision → writer | the policy epoch; the record | registrant and selection never change, so the decision holds; the epoch is checked after the section's last await (R17); the write is conditioned on the in-writer record revision |
| D10 | `bindDelivery`: binding decided → descriptor read | nothing awaited; no window | — (ordering only: the binding's answer cannot depend on existence) |
| D11 | `dispose`: drain-principal pre-check → per-task authorization → writer | drain list replaced | `_recordActedOn` re-decides on the in-writer record before `disposeObligations` (R24; test removes bob during the `dispose-obligation` grant) |
| D12 | `closeSubscription`: actor pre-check → scope grant, owed capture, per-task authorization → writer | drain list replaced | the same in-writer re-decision, for `dispose` and for a `retain` by a non-registrant drain principal (R24; tests for both) |

**Accepted, documented:** a receipt a removed principal prepared stays issued; a principal still
named can acknowledge or abandon it under its own authority. The manifest does not record who
prepared it. See *Open questions*.

## Inline review (code-reviewer rubric, before coverage closure)

No P1. P2 applied: the in-writer `disposeWithheld` refusal reuses the shared `_denied` helper. P2
kept with reason at the time — `setSubscriptionDrain`'s sequential early returns — was overruled
by the independent review (P3-3) and is now a chain. No `c8 ignore` added. No independent reviewer was run: a delegated
worker cannot spawn one — the orchestrator's gate-time review is the independent pass.

## Gates (worktree root; logs in scratchpad `drain/`)

| gate | exit | fail-grep | warnings |
| --- | --- | --- | --- |
| `install` | 0 | 0 | — |
| `change --verify --target-branch origin/integration/agent-tasks-host` | 0 | — | — |
| `change --verify --target-branch origin/release` | 0 | — | — |
| `rebuild` | 0 | 0 | 1 (tracked-symlink notice) |
| `lint` | 0 | 0 | 1 (tracked-symlink notice) |
| `test` | 0 | 0 | 1 (tracked-symlink notice) |

All rows are the final run, on `7398671dd`. The first `rush test` (on `45f2b9de3`) was **red**:
`@fgv/testbed` branch coverage 99.9%, because the new journey check compared a ternary the run never
took both ways. It now compares the refusal's detail directly; the re-gate above is clean.

Package-level: `heft test --clean` in `ts-agent-tasks` exit 0, 100% on all four measures.

**Re-gate after the review fixes**, on `b3216d00a` (logs in scratchpad `drain-fix/`):

| gate | exit | fail-grep | warnings |
| --- | --- | --- | --- |
| `install` | 0 | 0 | 0 |
| `change --verify --target-branch origin/integration/agent-tasks-host` | 0 | 0 | 0 |
| `rebuild` | 0 | 0 | 1 (tracked-symlink notice) |
| `lint` | 0 | 0 | 1 (tracked-symlink notice) |
| `test` | 0 | 0 | 1 (tracked-symlink notice) |

fail-grep is `not met|Operations failed|error TS|Jest tests? failed|ERR_PNPM`; the test log has no
NUL padding. Package-level `heft test --clean` in `ts-agent-tasks` before the commit: 100% on all
four measures. `rushx fixlint` and prettier were run before the commit.

## Open questions

- Should removing a drain principal also abandon receipts it prepared? Needs a "prepared by" field
  on `IIssuedTaskReceipt`; not built. Recorded as a P3 in `docs/TECH_DEBT.md`.
- `setSubscriptionDrain` requires the registrant. A host whose registering principal is ephemeral
  would have no way to re-delegate; none observed.

## Second independent review — follow-ups (orchestrator)

The re-review of the fixes approved them and raised two P3s, applied directly:

- **P3-a** — `setSubscriptionDrain` reported a committed drain change as `not-found-or-denied` when
  the descriptor read back after the write was missing. It now fails `storage-unavailable` /
  `reconcile-first` ("the change was written but the subscription did not read back; re-read it").
  The pinning test asserts that answer and that the change is durable; under the previous code it
  goes red, since that code answered `not-found-or-denied`.
- **P3-b** — two `CAPABILITIES.md` slips (a misplaced "and so does `TaskDeliveryPump.create`", and a
  circular "as `dispose` does") and one over-long TSDoc line on `TaskBroker.dispose`.
