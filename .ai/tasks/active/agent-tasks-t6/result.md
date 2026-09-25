# Result — `agent-tasks-t6`

**Shipped:** External task sources — a typed `ExternalTaskSource` helper and the `ITaskSource` contract, observations ordered by the source's own revision comparator, paged reconciliation whose cursor advances only after the page's projections commit, recovery over every recovery outcome, and external commands that reserve their settlement before dispatch, record accepted apart from applied, and hold an uncertain non-idempotent command rather than resend it.

**T6 does not close the stream.** Artifacts stay in `.ai/tasks/active/agent-tasks-t6/`; this family
finalizes at cluster close. Written 2026-09-25.

---

## What shipped

- **`ITaskSource`** (`types`): `id`, `history`, `compare`, `observe`, `reconcile(cursor?)`,
  `dispatch(binding, request, expectedSourceRevision?)`, `recover`, optional `lookupCommand`. Result
  unions `SourceRead`, `ISourceReconcilePage` (with `completeness` **and** `coverage:
  'all-bindings' | 'active-only'`), `SourceCommandResult` (`rejected` / `accepted` / `applied` /
  `indeterminate` / `key-expired`), `SourceCommandLookup` (+ `not-found`). Converters in
  `TaskConverters.sources`.
- **`ExternalTaskSource.create(params)`** (`implementations`): typed projections encoded through a
  host `encodeDetails`, commands from `ExternalTaskSource.command(descriptor, apply)` validated
  against the same descriptor the kind registry declares; every callback failure or throw is
  `source-unavailable`, never an escaped exception.
- **Broker host operations**: `TaskBroker.create({ …, sources })`, `observe(taskId)`,
  `hint(binding)`, `reconcile({ sourceId, maxPages? })`, `recover(taskId)`,
  `extendReplayEnvelope(taskId, add)`; `registerExternal` takes `history: { history: 'source-replay', envelope }` for a
  `source-replay` source. Bound writer: `execute` on an external kind dispatches through its source;
  `resolveCommands({ limit })` is the uncertain-command pump.
- **Storage**: a per-source checkpoint record (`source-<id>.json`: history, cursor, page count,
  record revision), created record-first then manifest-live, with adoption of an exactly-initial
  record a crash left behind; the `unsettledCommands` index; `accepted-operation-settlement` and
  `admitted-source-replay` capacity claims; a health-only observation commit at an unchanged
  source revision; `ITaskKindRegistry.getCommand`; `ITaskRepository.registry`.
- **Test sources** (`src/test/helpers/sourceFixtures.ts`): `SimulatedExecutor` — an executor with
  its own job state, a source-key ledger, conditional preconditions, a replay feed, gaps, outages,
  lost responses and key expiry — wrapped as a **controllable** source (pause/resume `source-key`,
  cancel `none` + conditional, advance `none`) and an **observation-only** source (no commands).

## The two questions

**Source-history spelling — confirmed, § 5 corrected.** § 8.6's `'observed-state' |
'source-replay'` is right: it names the *guarantee* a consumer relies on, not the mechanism, and T1
built the vocabulary on it. `development-design.md` § 5 said `'latest-snapshot' |
'replayable-updates'`; corrected in place, with a "Source-history spelling (confirmed by T6)"
note. The same stray spelling in `multi-agent-chat-adoption.md` is corrected too. **Locator note:**
the brief located the stale spelling in "§ 5 of the plan"; it is `development-design.md` § 5 (the
plan's § 5 is "Broker and delivery" and never spells it). Not a gap — the brief's intent was
unambiguous.

**Executor-payload dereference — built against the decision (no dereference); no reason found
that it is wrong.** T6 is the first slice to hold executor payloads, and holding them produced
evidence *for* the decision rather than against it:

- Nothing the broker commits ever needed the payload. A projection is bounded `details` plus
  lifecycle/progress/attention; the layering fixture (a 200 KiB executor payload, reconciled,
  reassigned, recovered) shows neither `task-*.json`, `source-*.json` nor the manifest contains
  any of it, and recovery resolves through the original binding.
- The failure mode the decision guards against is real and now refused structurally: an adapter
  that copies retained text into `details` is a **contract violation** at the observation (the
  record is unchanged), never a truncation.
- Terminal presentation is an observation like any other; there was no point in the terminal path
  where a dereference would have had to be inserted.

Recommendation: keep it. If a consumer needs the payload at terminal presentation, the decided
route — a separately authorized host action against the executor — needs no library change.

## Ordering guarantees — each window and its re-check

| # | window | what re-checks after it |
|---|---|---|
| W1 | command authorization → dispatch marker | epoch captured before the check; the marker gate re-reads the command and refuses (`conflict`, intent left `not-sent`) if the policy epoch moved or the authorized subject's catalog fields changed. Revoked authority settles `rejected: denied`; nothing is sent |
| W2 | marker → send | only the caller that wrote `possibly-sent` sends; one that finds it written returns without sending. A conditional command's precondition is the source revision the marker gate read, not the caller's earlier read |
| W3 | send → persisting the answer | a fresh writer section re-reads and merges onto the latest record (a reassignment during the send survives); an already-settled command is left as it is; a write failure is `commit-indeterminate` carrying the operation id, and the reservation stays held |
| W4 | pump authorization → lookup → resend | **found and fixed after layer 1:** the resend passes a gate that refuses if the epoch or subject moved since the pump's check (which preceded the lookup's `await`), and reports a command another caller settled meanwhile without sending it |
| W5 | source read → observation commit | the read is outside the writer; inside it the record is re-read and the comparator runs against the revision committed *now*; execution fields only, catalog from the latest record; terminal absorbing |
| W6 | observed-state `applied` answer → projection | the command settles in the same commit that records its projection — there is no state with one and not the other |
| W7 | replay hint / observe / command answer → feed | none commits a projection (`deferred`); each runs a feed pass from the committed cursor. A replay `applied` answer leaves the receipt `accepted` with `awaiting` until the feed reaches that revision — the rev-3-hint-before-rev-2 test |
| W8 | page → cursor | the cursor commits only after every observation in the page; a gap, broken per-binding order, a foreign binding, a contract violation (either history) or backpressure stops with the cursor unmoved; `commitSource` is fenced by record revision; passes over one source are serialized |
| W9 | source-record creation → manifest | record-first, then manifest; a retry adopts only an exactly-initial record; an on-disk fence refuses anything else |
| W10 | reservation → dispatch | the settlement claim is minted in storage in the intent's own commit, so a full repository refuses the intent before anything is recorded or sent; consumed only when dispatch settles |
| W11 | replay envelope → feed commit | `requiredUpdates` is validated against the envelope inside the commit, before anything is written; overdraw is `source-gap` |
| W12 | repository open → sources | open calls no source; the pump and passes run only when the host calls them |

## Reservation arithmetic (A3)

Implemented, not merely tight. **The per-registration figure is unchanged: 448 KiB → effective
ceiling 146.** T6 adds:

- **`accepted-operation-settlement`, per in-flight external command**: reserved in the intent
  commit, consumed when the command settles. Charges one update, 32 audience links and
  acknowledgement ids, stored-operation + receipt + update record bytes, and **64 KiB resident**.
  With one in-flight command per task: 512 KiB → **⌊64 MiB / 512 KiB⌋ = 128**. Each further
  concurrent in-flight command on a task costs another 64 KiB.
- **`admitted-source-replay`, per `source-replay` task**: exactly the declared finite envelope
  (`remainingRequiredBytes` resident, ≤ 64 KiB × declared updates), spent by each required feed
  revision, released at terminal; extension is new admission. Not charged to `observed-state`
  tasks (the reference consumer's adapter).
- A reserved terminal observation still commits while ordinary `observed-state` sampling is
  capacity-blocked (tested).

`docs/TECH_DEBT.md`'s capacity entry is amended with these figures.

## T1 vocabulary: revisions and decisions

- **Revised:** `RecoveryResult.unrecoverable` carries the source's `value: ISourceProjection` so a
  source-confirmed failure commits as an ordinary observation (it must be failed or cancelled). Not
  persisted anywhere; no migration.
- **Additive persisted field:** `IStoredCommandOperation.awaiting?: ICommandAwaiting` — the
  revision a replay command's effect was reported at plus a digest of the answer's execution
  projection. Old records read unchanged.
- **Decided:** `ITaskSource.history` uses the § 8.6 spelling; `capabilities()` is omitted (the kind
  registry is the one command authority T6 needed — T9 owns any stop capability); `key-expired` is
  its own command-result state; `coverage` is required on every page.
- **Index shape widened:** `unsettledCommands` — rebuilt from records by open and
  `rebuildIndexes()`.

## Acceptance evidence

| acceptance | evidence |
|---|---|
| source owns truth; never optimistic | `accepted` leaves lifecycle unchanged until an observation; the executor's own state is asserted in command tests |
| controllable source really applies | reverting `SimulatedExecutor._apply` to a no-op turns **17** tests red |
| cursor only after committed projections | gap / order / contract / capacity stops leave the cursor; saving the cursor before the page turns 5 tests red |
| push-vs-poll ordering | rev-3 hint before feed rev-2: rev 2 commits first, then 3; applying replay hints directly turns the test red |
| freshness refresh ≠ violation | same revision, later `observedAt`: maintenance commit, no revision |
| active-only rejected for terminal discovery | an active-only pass is never complete |
| uncertain dispatch held | non-idempotent resend turns 3 tests red; expired key → held with and without lookup |
| restart has no side effects | reopening storage and creating the broker make no source call (read, page, recover, dispatch, lookup all counted); the committed cursor survives |
| layering (≥ 64 KiB payload) | 200 KiB payload never in any record; projection measured alone < 100 bytes |

**Revert check — run on the final source.** 18 protections reverted one at a time; every one turned
its tests red (failing tests in parentheses): replay hint applied directly (1), cursor saved past a
capacity block (2), second send after the marker (1), non-idempotent resend (3), no settlement
reservation (13), accepted recorded as applied (2), executor stops applying (17), same-revision
conflict accepted (2), envelope overdraw (1), no authority recheck at dispatch (1), stale
precondition (1), active-only counted complete (1), no feed order check (1), no subject check at
marker (1), cursor saved before observations (5), no epoch fence at resend (1), no subject fence
at resend (1), resend after another caller settled (1).

## Review

**Layer 1 (`code-reviewer`, before coverage closure).** No P1. Fixed: a conditional command's
precondition taken from a read earlier than the marker (now the marker gate's record); a caller
that found the marker already written could still send (now only the marker's writer sends); an
observed-state `applied` answer settled in a separate commit from its projection (now atomic); the
marker did not refuse a catalog change to the authorized subject; `requiredUpdates` was not
validated before replay. Advisory items addressed with doc comments (`resolveCommands` candidate
list is best-effort and re-validated; replay-envelope byte lockstep; `indeterminate` semantics).
After review, a self-audit of the windows table found **W4** (resend without an epoch/subject
fence) — fixed with three tests and three reverts.

**Layer 2 (Copilot).** Driven by the implementer.

- **Round 1** — two high, one low, plus summary-only items. All but one real:
  - *History contract trusted the attached source* (high, real): a task registered `source-replay`
    could be moved by a direct read if a source under the same id were attached as
    `observed-state` (no checkpoint yet to catch it). Now enforced inside the writer: a task holding
    an `admitted-source-replay` claim commits projections only in feed mode — one check covering
    observe, recover, reconcile and command answers.
  - *Helper re-decodes encoded parameters* (high, real in substance): the descriptor's schema is
    documented as the wire schema, but nothing enforced that `encode`'s output validates as `P`
    again. The command handle now refuses a shape-changing encoder at validation, before anything is
    recorded, so the helper's decode is sound; the contract is written on `ITaskCommandDescriptor`.
  - *`sourceReplay` in CAPABILITIES.md* (low, real): the public shape is
    `history: { history: 'source-replay', envelope }`. Fixed there and in this file.
  - *Hard-coded 4,096-character cursor bound* (summary, real): a profile could declare
    `maxSourceCursorBytes` above the ceiling the converters read. The profile field is now bounded
    by a single exported `maxSourceCursorLength`.
  - *Repeated revision in a feed page rejected* (summary, real — a liveness defect): an
    at-least-once duplicate stopped the pass with the cursor unmoved, forever if the source keeps
    serving that page. A repeat is now a duplicate (`unchanged`), or a contract violation if its
    content differs.
  - *Comparator failures classified as contract violations* (summary): kept. A comparator is pure
    host code over the source's own revisions; one that cannot order them is breaking the contract,
    not unreachable.
  Each fix has a test that fails when the fix is reverted (M21, M22 plus the new cases).
- **Round 2** — one high, one medium; both real, both ordering/ownership:
  - *Feed entries naming another source's binding were applied* (high): a faulty source could
    write another source's tasks and advance its own checkpoint. A page with any foreign binding is
    now a contract violation before anything in it is applied.
  - *An observed-state contract violation let the cursor advance* (medium): the checkpoint moved
    past an observation that did not commit, so the next pass skipped it. It now stops the cursor
    like a capacity block — the rest of the page is still applied, the page is re-read next pass.
  Both reverts (M23, M24) turn their tests red.
- **Round 3** — six high; all real:
  - *Archive while a replay command awaits its feed revision*: the command was `settled` but not
    final, and a tombstone takes no observation, so it could never confirm. Archive is now refused
    (broker and storage) while any command is unsettled **or** awaiting.
  - *Replay `applied` at an already-committed revision settled without comparing projections*: a
    contradicting answer was receipted `applied`. It is now `indeterminate` (outcome unknown) and
    stays `possibly-sent`.
  - *Unbounded source diagnostics into health*: a long failure message failed the health
    converter, so outage health was never recorded. Bounded in the shared health path.
  - *Feed order reset per page*: `rev1, rev3 | rev2` passed both pages and checkpointed past a
    required revision. Per-binding order is now carried across a pass's pages. (Across passes the
    committed checkpoint is the boundary: the feed is trusted not to re-emit below it.)
  - *Comparator result not validated*: an answer outside the order union read as `newer`. Now
    converted against the union in the broker, for every source.
  - *Settlement claim bundle shape*: open accepted a settlement claim missing a dimension. It now
    requires every dimension of the bundle, like the closeout and resolution claims.
  Reverts M25–M31 each turn their test red.
- **Round 4** — six high; all real, all at the edges of the replay guarantee:
  - *Admission ignored the persisted checkpoint's history*: a replay task could be admitted against
    a source whose checkpoint every pass then refuses. Registration now reads the checkpoint inside
    the writer and refuses on a mismatch.
  - *An `applied` answer refused as a contract violation settled `accepted`*: for a replay-registered
    task under a weaker attachment, that lost the feed confirmation for good. A contract-violating
    answer now leaves the command uncertain (`indeterminate`, reservation held).
  - *Feed-order keys were not canonical*: two spellings of one reference split its ordering. Keyed
    canonically, as the repository keys bindings.
  - *`awaiting` on a command that is not settled `accepted`* opened and blocked archive forever.
    The stored-command converter now rejects it (open and commit).
  - *Replay claims at open were not checked against their envelope*: now the envelope must be one
    the profile carries, every dimension must be charged, and the resident charge must equal the
    remaining byte envelope (they are one quantity).
  - *Resident bytes overdrawing the byte envelope were silently taken from free capacity*: now a
    source-contract failure, like overdrawing the update count. (The earlier backpressure test had
    built its block from exactly such an overdraw; it now uses a progress-only revision, which
    draws nothing from the envelope.)
  Reverts M32–M37 each turn their test red.
- **Round 5** — one high, real: the deferred twin of round 3's finding. An `applied` answer stored as
  `awaiting` was confirmed by revision order alone, so a feed entry at that revision with other
  content still settled it `applied`. `awaiting` now carries a digest of the answer's execution
  projection; at the awaited revision the feed's projection must match, else the receipt stays
  `accepted` (a settled receipt is final; storage admits exactly that resolution) and stops
  waiting. Revert M38 turns its test red.

## Gates

`rushx build` (zero warnings), `rushx lint`, `rushx fixlint`, `rushx test` — **1,353 tests, 100 %
statements/branches/functions/lines, zero `c8 ignore`**. `rush change --verify --target-branch
origin/integration/agent-tasks-v1`; repo-wide `rebuild` and `test`; `verify-capability-docs`,
`generate-capability-feed --check`, `verify-esm-entrypoints`, `verify-bundler-resolution`,
`verify-tarball-exports` — all pass on the final source (rebuild and test exit 0; zero warnings).

## Hand-offs (routed to `docs/TECH_DEBT.md`)

1. **T8** — a held command never settles on its own (only a later `lookupCommand` that finds it
   does); it keeps its reservation and blocks archive. Needs an audited host disposition.
2. **T8** — a `source-replay` task registered after the feed passed its revisions never receives
   them (`unknown-binding`, pass moves on). Enforce register-before-emit or detect the gap.
3. **T7** — the settlement and replay claims already reserve per-update audience links; T7 must
   spend them rather than mint new ones.
4. **T9** — `ITaskSource.capabilities()` and a source-side stop.
