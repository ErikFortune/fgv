# agent-tasks-drain-principals — result

**Shipped:** a subscription now records the principals that may bind and drain its delivery — `bindDelivery` refuses anyone else exactly as it refuses a missing subscription, every bound-delivery operation re-applies the rule, the host can change the list through `TaskBroker.setSubscriptionDrain`, and `disposeWithheld` ends withheld obligations only through a binding whose policy carries the identity the subscription recorded as the consumer's own.

Branch `agent-tasks-drain-principals`, into `integration/agent-tasks-host` (PR #TBD). Package
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

## `docs/TECH_DEBT.md` — closure note for the orchestrator to reconcile

The entry from #780 is not on this branch (release is at #779 after Step 0). Both halves are
resolved by this stream: **(a)** any host code naming a consumer could bind and drain it — closed by
decisions 1–3; **(b)** the `disposeWithheld` policy-identity residual — closed by decision 4. Close
the whole entry when #780 and this stream meet.

## Red → green evidence

Tests were written after the code, so each protection was proved by reverting it:
`revert-matrix.py` (this directory) removes one protection from the source, runs the delivery and
host suites, and counts red tests. Every row went red; each was restored.

| row | red tests |
| --- | --- |
| R1 bindDelivery ignores drain principals | 7 |
| R2 subscribe default is not the registrant | 11 |
| R3 legacy record is not registrant-only | 1 |
| R4 request list not de-duplicated / sorted | 1 |
| R5 request list may be empty | 1 (0 at first: the storage converter also refused it — a test now pins the request-level refusal) |
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
| R20 replay ignores drain authority | 2 |
| R21 setSubscriptionDrain: selectors not required | 1 |

Tests: `src/test/unit/delivery/drainPrincipals.test.ts` (new, 35), plus updates to
`deliveryWithheld`, `withheldFaults`, `accounting`, `receipts` and the writer doubles.

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

**Accepted, documented:** a receipt a removed principal prepared stays issued; a principal still
named can acknowledge or abandon it under its own authority. The manifest does not record who
prepared it. See *Open questions*.

## Inline review (code-reviewer rubric, before coverage closure)

No P1. P2 applied: the in-writer `disposeWithheld` refusal reuses the shared `_denied` helper. P2
kept with reason: `setSubscriptionDrain`'s sequential early returns match its siblings `subscribe`
and `_disposeWithheldOnce`. No `c8 ignore` added. No independent reviewer was run: a delegated
worker cannot spawn one — the orchestrator's gate-time review is the independent pass.

## Gates (worktree root; logs in scratchpad `drain/`)

| gate | exit | fail-grep | warnings |
| --- | --- | --- | --- |
| `install` | 0 | 0 | — |
| `change --verify --target-branch origin/integration/agent-tasks-host` | 0 | — | — |
| `change --verify --target-branch origin/release` | 0 | — | — |
| `rebuild` | 0 | 0 | 1 (tracked-symlink notice) |
| `lint` | 0 | 0 | 1 (tracked-symlink notice) |
| `test` | see `## Gates — test` below | | |

Package-level: `heft test --clean` in `ts-agent-tasks` exit 0, 100% on all four measures.

## Open questions

- Should removing a drain principal also abandon receipts it prepared? Needs a "prepared by" field
  on `IIssuedTaskReceipt`; not built. Recorded as a P3 in `docs/TECH_DEBT.md`.
- `setSubscriptionDrain` requires the registrant. A host whose registering principal is ephemeral
  would have no way to re-delegate; none observed.
