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
  `extendReplayEnvelope(taskId, add)`; `registerExternal` takes `sourceReplay` for a
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
| W8 | page → cursor | the cursor commits only after every observation in the page; a gap, broken per-binding order, contract violation or backpressure stops with the cursor unmoved; `commitSource` is fenced by record revision; passes over one source are serialized |
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
- **Additive persisted field:** `IStoredCommandOperation.awaiting?: ISourceRevision`. Old records
  read unchanged.
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

**Layer 2 (Copilot).** See the PR; rounds recorded below as they run.

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
