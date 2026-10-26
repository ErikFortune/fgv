# Result: `agent-tasks-delivery-and-deferral`

**Shipped:** `@fgv/ts-agent-tasks` gains the host's own delivery and deferral loops as bounded calls — `TaskDeliveryPump`, which drains a subscription one owed revision at a time and never acknowledges on its own, and `DeferredObligations`, durable retry obligations kept as waiting tracked tasks that a crash cannot duplicate — plus `IBoundTaskView.queryDue`, so the due pass is both authorized and indexed.

Origin: personaility#698 (fgv-ask), slices B-1 and B-2. Target: `integration/agent-tasks-host` (not
promoted with the batch, per the 2026-10-26 user decision). Change file typed `minor`, with
`BREAKING (implementers only):` — `IBoundTaskView` widened.

## Placement and API decisions

**Packlet: the existing `host`.** #758 created it for host-side plumbing over the broker and
storage, and these two are the same audience with the same imports (`broker`, `converters`,
`types`); a new packlet would have drawn the same boundary twice. Nothing in `broker` imports
`host`, so the dependency runs one way.

**The structural guard is its own type,** `ITaskHostWriteGuard`: `{ guard<T>(write: () =>
Promise<Result<T>>): Promise<Result<T>> }`, the brief's shape over plain `Result`. The broker's
`ITaskWriteGuard` is over `TaskResult`, so the two could not be one type; a gate written over plain
`Result` satisfies both. A gate that throws becomes a failure (`write guard threw: …`).

**How the two guards compose.** The helper guard wraps **one whole helper call** (a pump pass; an
acknowledgement with its release and superseded disposal; a deferral's create and wait). The broker's
`writeGuard` wraps **each writer section inside it**. Helper-only: a pause never falls inside a
helper call, but broker writes outside the helpers are not seen. Broker-only: every write is seen,
and a pause can fall between two sections of one helper call — every helper call is written to be
safe across that (each step idempotent, or the work presented again). **Both with one pausing gate**
is the case to avoid: the helper call is in flight *at* the gate while its sections wait *behind*
the same gate's pause, and only the gate's timeout ends it. Documented on `ITaskHostWriteGuard` and
in `CAPABILITIES.md`.

**Authorization is never bypassed.** The pump delivers and disposes under one binding the host
supplies (it binds the delivery itself, so the two cannot diverge). Every obligation read is a bound
view's and every write a bound writer's, under the principal and policy the host supplies. For the
host's own principal, `trustedKindAuthority` (#758) is documented as the way to get one — with
`scopeMatch: 'some'` when deferrals carry an instance scope beside the helper's.

**`IBoundTaskView.queryDue`** — added because the indexed due query existed only on
`ITaskRepository`, and the brief requires the due pass to be both indexed and authorized. It is
`query`'s contract (view scopes, authorize and project each candidate, view- and epoch-bound cursor,
generation check) over `repository.queryDue`. Consumer sweep: implementations are `BoundTaskView` and
eleven structural test doubles in `src/test/unit/tools/{bounding,factory}.test.ts`, all updated;
`samples/testbed/src/scenarios/agentTasks/{journey,world}.ts` consume the interface and implement
none of it; no `IBoundTaskView` in `tools/` or elsewhere. Lift-condition sweep: nothing in this repo
named it; the ask's B-2 contract is what it lifts.

## What shipped, per helper

### B-1 — `TaskDeliveryPump`

`TaskDeliveryPump.create({ broker, delivery, guard?, budget?, maxStaleRenders? })` →
`Result<TaskDeliveryPump>`.

- **`next()`** → `IPreparedTaskDelivery | undefined`: reads what is owed (all pages); nothing visible
  → `undefined`, no receipt issued. Otherwise prepares one item (`maxItems: 1`; depth and text from
  `budget`, default `defaultTaskContextBudget`). An entry with update ids is presented with its
  envelope, `terminal`, `categories` (ascending) and `updateIds`, plus the receipt and the context.
- **Stale render.** An entry with no update ids — a task's current state that outranks its owed
  older revisions — is released, every owed update of that task older than the rendered revision is
  disposed of (`superseded by revision N of the same task`), and the pass renders again. A round
  that clears nothing **fails loudly** (`renders without what it is owed … cannot be delivered within
  this budget`), as does a render with no entry, and a pass past `maxStaleRenders` (default 20).
- **`acknowledge(p)`**: fails with nothing discharged if the acknowledgement does not commit.
  Afterwards it releases the receipt and, **for a terminal revision only**, disposes of the task's
  older owed revisions; either follow-up failing is listed in `issues` and the call succeeds.
- **`abandon(p)`** releases. **`dispose(p, reason)`** releases first, then disposes, then (terminal)
  clears superseded revisions.
- **Never acknowledges on its own; at-least-once.** TSDoc says, in the ask's words, that
  exactly-once is not this helper's property: it is at-least-once plus a host whose work is findable
  by `(taskId, revision)`. It also documents the crash case: a receipt left issued by a stopped
  process pins its revision, so `dispose` is refused until it expires (the broker's
  `receiptLifetimeMs`); acknowledging is unaffected; a sole consumer can `issued()` + `abandon`.

### B-2 — `DeferredObligations`

`DeferredObligations.create({ broker, principal, authorization, scope, idPrefix, roles, codes?,
namespaces?, schedule?, operationBudget?, guard?, converters? })` → `Result<DeferredObligations>`.
Every PersonAIlity name is an option: id prefix, roles, reason codes (`wait`, `cancelled`, `merged`,
`abandoned`), reference namespaces (`change`, `obligation`), backoff and day bound (`baseMs`,
`capMs`, `maxDeferralMs`), and the operation budget.

- **Identity**: `taskIdFor({ changeRef, role })` = `<idPrefix>:<role>:<changeRef>`; neither prefix nor
  role may contain `:`, so the encoding is injective and **two roles never share a task**; an id is
  kept 18 characters under the bound so every derived operation id fits. `keyOf` inverts it.
- **`defer`**: inspect → (absent) `resumePendingRegistration` → else `createTracked` → `wait` with
  `notBefore` → re-read. A task left `pending` is set waiting; a pending registration is resumed from
  the stored request (#758), so a replay need not repeat the title. A waiting obligation is answered
  as it is; a settled one answers `'settled'`.
- **`stateOf`**: `absent` | `pending` | `waiting` (the parsed obligation) | `settled` (status,
  archived). A task under the id that the helper did not write is refused, never adopted.
- **`wait`** (next `notBefore`, optionally new changes / attention / summary), **`succeed`**,
  **`cancel`**, **`merged(obligation, into)`** — cancelled under `merged`, attention
  `[obligation:<into>, change:…]`, after `into` is re-read and found waiting and owing every change.
  Each terminal step archives.
- **`abandonPending(before)`**, **`due(now)`** (bound `queryDue`, oldest `notBefore` first),
  **`waiting()`**, **`archiveSettled()`**. Sweeps answer `{ done, issues }`.
- **Budget.** `waitsRemaining = operationBudget − 2 (closeout) − revision`; `wait` refuses at zero
  without writing, an identical wait writes nothing (not even an unchanged operation), and the
  repository's own closeout reservation remains the final word. **`retry(obligation, now)`** is pure:
  `expire` past `maxDeferralMs`; else backoff = age clamped to `[baseMs, capMs]`; `hold` at the cap
  or with no waits left — PersonAIlity's reason for holding capped retries in memory
  (`hub/ingestionWakeTasks.ts:58-71`) — else `wait`.

## Check-then-act windows

Every `await` between a read and the write that relies on it, and what re-checks after it.

| # | Window | What could go wrong | What re-checks | Test |
|---|---|---|---|---|
| P1 | `next`: owed read → `prepare` | a revision arrives between them | `prepare` captures afresh, fences the subscription record revision and every rendered task's revision inside the writer, and storage refuses a manifest naming an id no longer owed | *a revision arriving during prepare is never lost* (a commit injected from inside the policy check) |
| P2 | `prepare` → `acknowledge` | a newer revision commits after the render | the receipt names only the rendered revision's ids; acknowledgement discharges exactly those | *a revision arriving after prepare stays owed* |
| P3 | stale render: release → owed read → dispose of older | another reader's receipt pins an older id; a newer revision arrives | broker `dispose` re-proves, inside the writer, each id owed or discharged and refuses a pinned one → the pass fails loudly; only `revision < rendered` is ever selected, so a newer revision cannot be | *render presenting the current state … cleared*; R10 |
| P4 | `acknowledge` vs `dispose` on one prepared delivery | both decide | the acknowledgement re-matches its manifest inside the commit section, so a release that landed first refuses it; a release after the commit finds the ids already discharged (`alreadyDischarged`) — each id ends in exactly one history list | *acknowledge and dispose racing … exactly once* |
| P5 | acknowledgement committed → release → superseded disposal | a follow-up fails | the decision stands and the failure is an `issue`; a stuck receipt pins only acknowledged ids until expiry; undisposed older revisions are cleared by a later stale render | *a failed release after an acknowledgement is an issue*; *superseded disposal pinned by another receipt is an issue* |
| P6 | terminal discharge → superseded disposal vs a concurrent revision | a revision newer than the terminal one is disposed | **structurally closed**: terminal is absorbing and archiving is refused while anything is owed, so no newer revision can exist; the filter is `revision < terminal revision` regardless | *a terminal task takes no newer revision while it is owed* (archive refused before, allowed after) |
| P7 | `dispose`: release → dispose | another `next` re-prepares the same revision in between | the new receipt pins the ids, so the disposal is refused; the revision stays owed (at-least-once) | *a receipt a crash left behind* covers the pinned refusal |
| P8 | crash between `next` and its decision | a stale receipt pins the revision | acknowledgement is unaffected; `dispose` is refused until expiry; nothing is lost and the revision is presented again | *a receipt a crash left behind …*; *after a crash, acknowledging … is not refused* |
| D1 | `defer`: create → wait, across a crash | the wait is lost; or the creation itself is | the task is left `pending` (state read again) or as a pending registration (resumed from the stored request, `create` re-authorized by the broker for the committed scopes); the id is deterministic, so a replay finds the same task | *the wait lost to a crash* and *the creation itself lost to a crash* (both via `FaultyRoot`, then a reopen) |
| D2 | `defer` after the wait committed, response lost | a second wait | the replay reads `waiting` and answers it; and the wait's operation id is `<id>.r<rev>`, so a replayed write returns its stored receipt | *a replayed deferral … writes nothing* |
| D3 | two concurrent `defer`s of one key | two tasks | one id; identical creation replays; a different `notBefore` at the same revision is an idempotency conflict on the same operation id | by construction (deterministic ids + broker dedup) |
| D4 | `wait`: obligation read → write | the task moved | `expectedRevision` refuses it | *wait moves notBefore … refuses a stale revision* |
| D5 | `succeed`/`cancel` → archive | the archive fails after the terminal command committed | the obligation is settled-unarchived; retrying the same call replays the terminal command by its operation id and archives; `archiveSettled` sweeps it | *a cancel whose archive fails is finished by retrying* |
| D6 | `merged`: survivor read → cancel | the caller's `into` is stale, or the survivor is settled meanwhile | `into` is read again inside the call and must be waiting and owe every change. **Residual**: a concurrent writer settling `into` between that read and the cancel is not closable without a two-record commit; the host's pass should be the only writer of its obligations | *merged decides on the survivor as it is now*; D8 |
| D7 | `abandonPending`: list → cancel | a replayed deferral sets the task waiting in between | each cancel carries the revision it was listed at and is refused; reported in `issues`, the obligation left waiting | *abandonPending leaves a task that was set waiting after it was listed* (the deferral injected from the cancel's authorization check) |
| D8 | listings: page → page | a commit moves the index mid-listing | the bound view refuses a stale page (`conflict`, `safe`) and the listing restarts, bounded at three attempts | *a listing the repository keeps moving under fails after bounded rereads* |
| D9 | budget: `waitsRemaining` is derived, not read | another writer spent operations | the repository holds the closeout slots itself and refuses the wait (`backpressure`); closeout stays possible | *the repository budget … is what a wait finally answers to* |

## Revert matrix

Each row is a single production mutation, applied, run against the named file, and restored.
Scripted (`revert.py` in the worker's scratchpad); all 22 compiled and lint-clean, all red.

| Row | Mutation | Red |
|---|---|---|
| R1 | `acknowledge` skips releasing the receipt | *acknowledge discharges, then releases the receipt*; *a failed release after an acknowledgement is an issue* |
| R2 | `dispose` disposes without releasing first | *dispose releases the receipt first*; *a terminal disposal also clears the older revisions*; *a receipt a crash left behind*; *every write goes through the guard*; *a failed release …* |
| R3 | superseded disposal after **any** discharge | *a render presenting the current state … cleared* (the non-terminal acknowledgement must leave revision 1 owed); *stale clearing is bounded* |
| R4 | no superseded disposal after a terminal discharge | *superseded revisions are disposed after a terminal discharge only*; *a terminal disposal also clears*; *a terminal task takes no newer revision*; *superseded disposal pinned …* |
| R5 | a stale round that clears nothing retries instead of failing | *a render that delivers nothing and clears nothing fails loudly* |
| R6 | stale rounds unbounded (`maxStaleRenders + 100`) | *stale clearing is bounded* |
| R7 | `next` acknowledges what it prepares | eleven, including *never acknowledges on its own* and *abandon … presented again* |
| R8 | superseded filter drops the task match | *superseded revisions are disposed after a terminal discharge only* (another task's revisions must stay owed) |
| R9 | `next` bypasses the guard | *every write goes through the guard* |
| R10 | a stale render is not released | *a render presenting the current state … cleared*; *… fails loudly, holding no receipt*; *stale clearing is bounded* |
| Q1 | `queryDue` answers the ordinary listing | all four `IBoundTaskView.queryDue` tests |
| D1 | the id ignores the role | *maps (changeRef, role) …*; *two roles … never share an id*; *two roles … are two tasks* |
| D2 | a waiting obligation is waited again on replay | *a replayed deferral finds the waiting obligation and writes nothing* |
| D3 | a `pending` obligation is not finished | *the wait lost to a crash*; *abandonPending leaves a task that was set waiting* |
| D4 | a resumed registration's result is ignored | *the creation itself lost to a crash* |
| D5 | `abandonPending` ignores the cutoff | *abandonPending touches only tasks left pending before the cutoff* |
| D6 | `abandonPending` selects waiting too | same |
| D7 | `due` reads `query` instead of `queryDue` | *due answers only what is due*; *due reads the due index, never the open listing* |
| D8 | `merged` trusts the caller's copy of `into` | *merged decides on the survivor as it is now* |
| D9 | `wait` ignores the budget | *wait refuses without writing once the operation budget is spent* |
| D10 | `defer` bypasses the guard | *every write goes through the guard …*; *a guard that throws is a failure* |
| D11 | an identical wait is written | *wait moves notBefore …* (operation count must not move) |

R3 is caught by the stale-render test rather than the one named for it; the terminal-only test's
non-terminal step has no older revision to catch.

## The ask's contract tests, mapped

| Contract (personaility#698 § Contracts and tests) | Test(s) — `deliveryPump.test.ts` / `deferredObligations.test.ts` |
|---|---|
| B-1 never acknowledges on its own | *never acknowledges on its own: an undecided revision is presented again* (R7) |
| B-1 at-least-once: unacknowledged, undisposed revision presented again | same; *abandon releases the receipt, and what it named is presented again*; *a receipt a crash left behind* |
| B-1 stale-render clearing bounded, failing loudly when it clears nothing | *stale clearing is bounded*; *a render that delivers nothing and clears nothing fails loudly*; *a render with nothing in it is released and refused* (R5, R6, R10) |
| B-1 superseded disposal only after a terminal discharge | *superseded revisions are disposed after a terminal discharge only*; *a terminal disposal also clears*; *render presenting the current state* (R3, R4, R8) |
| B-1 dispose releases the receipt first | *dispose releases the receipt first, then records the reason* (R2) |
| B-1 documented stale-receipt-after-crash behaviour | class TSDoc + *a receipt a crash left behind: acknowledge works, dispose is refused until it expires* (15-minute lifetime, advanced past) |
| B-1 every write through the supplied guard | *every write goes through the guard; a refusing guard prepares nothing* (R9) |
| B-1 exactly-once not the helper's property, said in its docs | class TSDoc § *At-least-once, not exactly-once*; `CAPABILITIES.md` |
| B-2 replay of `defer` after a crash between create and wait finds the same task | *the wait lost to a crash …*; *the creation itself lost to a crash …* (D3, D4) |
| B-2 two roles for one change never share a task | *two roles for one change never share an id*; *two roles for one change are two tasks* (D1) |
| B-2 `merged` cancels with a reference to the surviving task | *merged cancels with a reference to the surviving obligation*; *merged decides on the survivor as it is now* (D8) |
| B-2 `abandonPending` only touches tasks left `pending` before the cutoff | *abandonPending touches only tasks left pending before the cutoff*; *… set waiting after it was listed* (D5, D6) |
| B-2 `due` uses the indexed `queryDue`, never a scan | *due reads the due index, never the open listing*; *due answers only what is due* (D7, Q1) |
| B-2 operation budget per task respected | *wait refuses without writing once the operation budget is spent*; *the repository budget …*; `retry` → `hold` in *firstNotBefore and retry follow the schedule* (D9, D11) |

## Deviations from the brief

- **`IBoundTaskView` widened** (`queryDue`). The brief scoped the change to the `host` packlet or a
  new one; the due pass could not be both authorized and indexed without it. Additive for callers,
  breaking for implementers; consumer sweep above.
- **A committed acknowledgement is a success** with follow-up `issues`, not a failure.
- **`retry` advises; it does not hold.** Backoff and the day bound are options of the helper, but a
  `hold` lives in the host's memory — the brief forbids a resident loop, and a held map would be one.
- **`merged` re-reads its survivor**, and both sweeps report per task and carry on. Neither is in the
  PersonAIlity source.
- **No stale-receipt release.** Documented instead (`issued()` + `abandon`); only the host knows which
  receipts are orphans.
- **Prettier 2.8**: run via the `rush-prettier` autoinstaller (2.8.8); `npx prettier` resolves 3.x.

## Gates

All from the repo root unless noted; logs in `.gate-logs/` in the worktree. Graded by exit code and by
`grep -acE 'not met|Operations failed|error TS|Jest tests? failed'` (must be 0) and
`grep -aiE warning` (only the tracked-symlink notice).

| Gate | Exit | Fail grep | Warnings |
|---|---|---|---|
| `rush install` | 0 | — | — |
| `rush change --verify --target-branch origin/integration/agent-tasks-host` | 0 | — | — |
| `rush rebuild` — `SUCCESS: 39 operations`, 5 min 37 s | 0 | 0 | symlink notice only |
| `rush test` — see below | 0 per part | 0 | 0 |
| `rushx build` / `lint` / `test` (`ts-agent-tasks`, 100% all four metrics) | 0 / 0 / 0 | 0 | 0 |
| `generate-capability-feed.mjs`, `--check`, `verify-capability-docs.mjs` | 0 / 0 / 0 | — | — |

**`rush test` in parts.** The tool here kills a foreground command at ten minutes, and the suite runs
longer, so one full run was interrupted at operation 25 of 39 with the first 24 completed
successfully, and the rest ran as `--only` groups: `ts-res`, `ts-res-cli`, `ts-extras-argon2`,
`ts-extras-re2` (`SUCCESS: 4`); `ts-agent-memory`, `ts-agent-memory-sqlite-vec`, `ts-agent-tasks`,
`ts-prompt-assist` (`SUCCESS: 4`); the remaining apps, samples and `typedoc-compact-theme`
(`SUCCESS: 7`, one defines no work). 24 + 4 + 4 + 7 = 39. One ordering lesson: the interrupted run
had cleaned `ts-res/lib` mid-test, so `ts-prompt-assist` failed to compile in a first group attempt
until `ts-res` was re-run — a mechanic of the interruption, not a defect. None of the known
load-sensitive tests failed.

## Not done

- No Copilot loop and no independent reviewer: the brief and the kickoff forbid sub-agents and PRs.
  The `code-reviewer` rubric was applied inline to the diff; the findings it produced (a merge decided
  on a stale survivor; sweeps that failed whole on one moved task; an `orThrow`-free but
  branch-redundant category lookup; a test double whose spread lost class methods) were fixed before
  the matrix was run. Per the authorization-boundary rule, expect the external loop to be substantive.
