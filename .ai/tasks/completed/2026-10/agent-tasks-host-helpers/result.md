# Result: `agent-tasks-host-helpers`

**Shipped:** `@fgv/ts-agent-tasks` gains the host plumbing every broker consumer rewrites: `openOrInitializeTaskRepository` with the exported root probe the repository itself uses, `trustedKindAuthority` for trusted host principals, `TaskBroker.whenIdle`, a `writeGuard` around every broker write, `IBoundTaskDelivery.issued()`, and resumption of a pending registration from the request the repository stored.

Origin: personaility#698 (fgv-ask), slices B-3, B-7, B-4, B-5 + F8. B-1, B-2 and B-6 were not built,
per the brief. Change file typed `minor` (`BREAKING (implementers only):` — three interfaces widened).

## What changed, per slice

### B-3 — `trustedKindAuthority` (`host` packlet)

`trustedKindAuthority({ kinds?, scopes?, scopeMatch?, actions, epoch }): Result<ITaskAuthorization>`
(a `Result` since review round 1: an empty `kinds`, `scopes` or `actions` list fails construction).

- `actions` is required; a request whose action is not listed is refused.
- A request **naming a task** (or an unresolved reference), in any role, needs its kind in `kinds`
  (when given) and *some* of its own scopes in `scopes` (when given); with `scopes` omitted it is
  decided on kind alone.
- A request **asking for scopes** (creation, subscription, dispose-over-subscription, and a scope
  change — which since round 1 asks for the full resulting scope set) needs them matched by
  `scopeMatch`: `'every'` (default, the brief's rule) or `'some'`. An empty requested list is
  refused. With `scopes` omitted, every request asking for scopes is refused.
- A creation names no kind, so `kinds` does not constrain it. It ignores `role`, `command` and
  `targetResponsibility`; under `'some'` a subscription can accrue audience it cannot read.
- TSDoc says **trusted host principals only, never model-facing**. Parameters are copied.

**The two PersonAIlity copies, and which rule each used** (personaility `working` @ `47991958`):

| copy | named task | no task (creation / subscription) |
|---|---|---|
| `curate/ingestionCatalog.ts` `hubIngestionAuthority` | kind must equal the ingestion kind; **scopes not checked** | **every** requested scope must equal the kind scope; non-empty |
| `curate/ingestionWakeTasks.ts` `hubWakeAuthority` | kind must be `fgv.tracked` **and some** scope equals the wake scope | no reference, and **some** requested scope equals the wake scope |

Neither copy checks the action. The catalog copy is `scopeMatch: 'every'`; the wake copy needs
`'some'`, because a wake creation carries `conversation:<id>` beside `kind:wake`. That is why
`scopeMatch` exists (interpretation 1 in `state.md`).

### B-7 — resume a pending registration (`broker` + `storage`)

- `ITaskRepository.pendingRegistration(taskId)` answers a pending entry's identity and stored
  canonical request, plus `landedScopes` when its first record already landed (trusted host API).
  **Widens `ITaskRepository`.**
- `IBoundTaskWriter.resumePendingRegistration(taskId)` — native (`create-tracked` / `create-list`):
  the stored request is fed back through `createNative`, so `create` is authorized **now**, the
  epoch is captured before the policy is asked and re-checked inside the writer immediately before
  the record is written, and the repository's identity check matches it against the pending entry.
  Another principal's pending registration is answered exactly like an id with none.
  **Since round 1:** `create` is asked of the scopes that will be committed — the landed record's
  when it landed (which the view must select), otherwise the view's creation scopes — and storage
  refuses to adopt a landed record whose scopes differ from the draft's (the authorized ones). A
  resume whose response was lost replays the committed receipt, re-authorized.
- `TaskBroker.resumePendingRegistration(taskId)` — external (`register-external`): a trusted host
  operation, resumed under the stored principal via `registerExternal`, which repeats every check.
- Each refuses the other kind with `invalid`. Withdrawal / recycling not built (brief: out of scope).

### B-4 — open-or-initialize (`storage` + `host`)

- **`probeTaskRepositoryRoot(root)`** exported from `storage`; `RecordStore.create` now uses it. It
  requires `atomicReplace` **and** the listed guarantee — the requirement the PersonAIlity probe
  (`_guaranteesOf`) misses.
- **`FileTreeTaskRepository.openOrInitialize(params)`** — the open-vs-initialize decision is taken
  under the exclusive ownership `_acquire` takes, after temporaries are reclaimed, by `initialize`'s
  own emptiness test. Implemented by splitting `initializeRepository` / `openRepository` into
  `_initializeAcquired` / `_openAcquired`.
- **Manifest `initializedMode?: 'session' | 'process-crash'`**, written by `initialize`, carried by
  every manifest rewrite (all spread the prior manifest). `open` as `session` over a
  `process-crash`-initialized repository is refused (`unsupported`) unless
  `allowSessionOverDurable: true`. A manifest without the field opens in either mode, and since
  round 1 the first durable open backfills `initializedMode: 'process-crash'` into it. An unknown
  value is `manifest-invalid`.
- **`openOrInitializeTaskRepository({ root, fallback, …})`** (`host`) → `{ state, repository |
  recovery, durability, placement, report }`. `fallback: 'in-memory'` is always labelled
  (`placement: 'in-memory'`, `report.fallbackReason`). `recovery-required` is surfaced, never
  repaired. Building the broker stays with the host.
- `CAPABILITIES.md` drift fixed: `initialize` accepts a root holding only an interrupted write's
  working files.

### B-5 / F8 / F3 — broker primitives

- **`TaskBroker.whenIdle(timeoutMs)`** — `WriterQueue` now tracks idle (`busy`, `onIdle`); waiters
  are notified when the queued+running count returns to zero. It never takes a queue turn. Bounded by
  an injected `schedule` (`TaskScheduleTimer`, `(fn, ms) => cancel`, default `setTimeout`) on
  `TaskBroker.create`. Timeout is `conflict`, retry `safe`; an invalid timeout or a throwing schedule
  is `invalid`. Documented as a moment, not a hold.
- **`writeGuard?: ITaskWriteGuard`** on `TaskBroker.create`, applied in `BrokerCore.gated` inside
  the queue's turn, around `withWriter`. Every broker write already goes through `gated` (the only
  `withWriter` call in `broker/`). A detail-less refusal → `storage-unavailable` / `after-host-action`;
  a throw → `invalid`. The 64-waiter fill is documented on the option and in `CAPABILITIES.md`.
- **`IBoundTaskDelivery.issued()`** — unacknowledged issued receipts (delivery id, `issuedAt`,
  `expiresAt` only), read under the writer, oldest first. **Widens `IBoundTaskDelivery`.**
- **`releaseStale` not built**: the repository exposes **no open generation**.
  `health().generation` starts at 0 on every open and advances per commit, and nothing persisted
  counts opens, so it cannot tell an earlier open's receipt from this one's.

## Check-then-act windows

| window | check | act | what re-checks after the check |
|---|---|---|---|
| resume: authorize → commit | `pendingRegistration` (outside the writer, incl. `landedScopes`), principal match, `mayCreate` for the scopes to be committed | `writer.register` | epoch captured before the first policy question and re-checked inside the writer as the last step before `register`, which awaits nothing before writing; `register` compares the full identity against the pending entry **under the writer**, and refuses to adopt a landed record whose scopes differ from the draft's — so a record that landed (or changed) after `landedScopes` was read can never be committed under scopes nobody authorized. **Correction (round 2):** a resume that lost a race did *not* go through the replay checks — storage replayed the now-live registration inside the writer. Since round 2 the section reads the task first and, if it went live, commits nothing and runs again through the existing-record path |
| resume after a lost response | `readCommit` finds a live record whose creation was a catalog registration | replay | `createNative`'s replay path re-checks visibility, identity and `create` for the live task's scopes, and `confirmUnchanged` re-checks epoch and revision inside the writer |
| resume (external) | `pendingRegistration`, operation kind | `registerExternal` | parent re-read inside the writer, source checkpoint history compared inside the writer, identity matched by `register` under the writer |
| a creation or resume vs a concurrent one that commits first | `mayCreate` for this view's scopes, outside the writer | `register` | inside the writer the task is read first; if it went live the section commits nothing and the operation runs again through the existing-record path — visibility, `create` for the **committed** scopes, parent, and `confirmUnchanged` — so the loser is never handed a task it was not authorized for |
| external registration replay vs a closed parent | an identical live registration found by `readCommit` | `register` replays | the parent checks are skipped only for an identical live registration (operation, principal, canonical request); any other request under the id is a `conflict` before the writer; a non-replay that finds the task went live inside the writer runs again and then replays or conflicts |
| guard returns before its started section settles | the guard's return | end of the queue turn | the started section is awaited before the turn ends, then classified as a section that ran |
| identical `createTracked` retry over a landed record | `mayCreate` for the view's creation scopes | `register` adopts the landed record | storage's scope comparison under the writer refuses (`conflict`) when the landed scopes are not the authorized ones |
| scope change: authorize → commit | `change-scopes` asked with the resulting scope set computed from the record read before the writer | commit | the writer re-checks that record's revision (and the epoch), so the set it commits is the set authorized |
| open-or-init: probe → open/initialize | `probeTaskRepositoryRoot` (outside ownership) picks the mode | `_acquire` → initialize or open | `RecordStore.create` re-runs the **same probe** inside `_acquire`; the open-vs-initialize decision is taken **after** `acquireRoot` and temporary cleanup, from the listing made under ownership (in-process; cross-process exclusivity stays the host's requirement) |
| open: manifest mode vs requested mode | `initializedMode` read in `scanRoot` | the scan's writes (completing landed registrations, backfilling the mode) | the check runs before the scan writes anything, and a refusal releases ownership. **Correction:** it runs *after* `_acquire` has already reclaimed interrupted writes' temporaries, so a refused open is not write-free — it may have removed working files, which no reader treats as data |
| open: backfill `initializedMode` | a durable open, manifest without the field | rewrite the manifest | the same fence as completing registrations: the manifest is re-read and must equal the scanned text before it is rewritten |
| `whenIdle`: observing the queue vs a newly enqueued write | `busy` read synchronously | resolve | none, by design. It observes **sections**, not operations: one operation can resolve-idle between its sections (`acknowledge`, `prepare`, a creation's pre-writer authorization, multi-pass source/cleanup). Documented; quiescing means pausing the guard first |
| `whenIdle` timer vs idle notification | `settle` called by either | resolve, withdraw, cancel | `settled` flag makes it once; the host's `cancel` runs under `captureResult`, and each idle waiter is called under `captureResult`, so host code cannot reject the queue's tail (which is also made non-rejecting) |
| the guard around `withWriter` | the guard's own decision | `withWriter(section)` | the guard runs inside the queue's turn; the broker tracks whether the section ran: ran-then-failed is `reconcile-first`, a second call is refused unrun |
| `issued()` vs a concurrent acknowledge | `readSubscription` under the writer | the host's later `abandon` | `abandon` re-reads under the writer; abandoning one acknowledged meanwhile loses nothing, and a later replay of that acknowledgement is an invalid receipt |

## Revert matrix

Each guarantee was reverted in source, the package rebuilt, and its tests run
(`scratchpad/revert.py`, logs in `.gate-logs/revert-*.log`). Every row went red; the source was
restored after each run.

| guarantee | revert | red test(s) |
|---|---|---|
| resume re-authorizes `create` now | drop `createNative`'s `mayCreate` denial | `create is authorized again at the resume…`; `a policy epoch that moves…` |
| resume re-checks the epoch in the writer | drop the in-writer `epochIs` check | `a policy epoch that moves after the resume is authorized refuses it inside the writer` |
| resume is the same principal's | drop the principal check | `another principal's pending registration is answered exactly as an id with none` |
| open-or-init uses `initialize`'s emptiness | decide by manifest presence instead | `a root holding anything else but no repository is recovery-required…` |
| probe requires `atomicReplace` | use the listed guarantees regardless | `a root that lists guarantees but cannot replace atomically qualifies for nothing`; `the repository itself refuses that root for the same reason` |
| durable repo not silently opened as session | disable the `initializedMode` refusal | `opening it as a session is refused without the opt-in…`; `a durable repository whose root lost its durable capability is refused, unless opted in` |
| `whenIdle` never takes the writer | implement it as a gated no-op | 6 `whenIdle` tests, incl. `never takes the writer…` |
| `whenIdle` waits for the queue to empty | notify on every decrement | `resolves when the last queued write finishes…`; `never takes the writer…` |
| the guard covers every gated section | bypass the guard in `gated` | 11 tests, incl. `every gated section passes the guard…` and `a held section holds the queue…` |
| a detail-less refusal is classified | pass it through unclassified | `a guard that refuses without task detail is storage-unavailable…` |
| `issued()` lists only unacknowledged | drop the filter | `lists nothing before a receipt is issued, then each unacknowledged receipt oldest first` |
| `'every'` is the default scope match | always `some` | `a creation or subscription needs every requested scope…`; `the two copies it replaces…` |
| an empty requested scope list is refused | drop the length check | `a creation or subscription needs every…`; `a scope change must keep the task inside…` |
| no `scopes` → a no-task request is refused | allow it | `a creation or subscription needs every…`; `without scopes, a request that names no task is refused` |

**Red first.** Every new API is new surface, so the tests could not compile against the base; the
matrix above is the red evidence for each behaviour. Three existing tests changed with the
behaviour: `durable.test.ts` and `delivery/checkpoints.test.ts` deliberately open a
`process-crash` repository as `session` and now pass `allowSessionOverDurable: true` (both were red
on the new refusal before the change), and `publicSurface.test.ts` lists the two new
`*Repository*` exports. `prompt/handoff.test.ts`'s `RecordingDelivery` double had a field named
`issued`; renamed to `lastIssued` and the method delegated.

**Conformance.** `runTaskRepositoryConformance` passes against repositories produced by
`openOrInitializeTaskRepository` over an in-memory root and a real Node root
(`host/openOrInitialize.test.ts`).

## Consumer sweep

`grep -rl 'ITaskRepository\|IBoundTaskWriter\|IBoundTaskDelivery' libraries tools samples`:
the only implementations are `FileTreeTaskRepository`, `BoundTaskWriter`, `BoundTaskDelivery`, and
the test double above. **Correction (round 1):** there is a consumer outside the package —
`samples/testbed/src/scenarios/agentTasks/journey.ts` uses `IBoundTaskWriter` and
`IBoundTaskDelivery` — but it implements neither, so the widening does not break it; the repo-wide
`rush rebuild` builds it.

## Gates

Logs under `.gate-logs/` in the worktree (not committed), graded by grep, not exit code.

| gate | result |
|---|---|
| package `build` / `lint` | 0 error/failure matches; no warning lines |
| package `test` | 2465 passed, 0 failed; coverage 100 / 100 / 100 / 100 |
| `rush rebuild` | `SUCCESS: 39 operations`; 0 error/failure matches; the only warning is the tracked-symlink notice |
| `rush test` | 37 succeeded, 1 failed: `@fgv/ts-res-cli` cli-configuration "test consistent output by building same input twice", a known load-sensitive test. Re-run alone: 67 passed, 0 failed |
| `rush change --verify --target-branch origin/integration/asks` | passes; finds `agent-tasks-host-helpers_2026-10-26-18-00.json` (`minor`) |
| prettier 2.8.8 `--check` over every changed file | clean (12 files reformatted before the final commit) |
| `generate-capability-feed.mjs` / `--check` | 2 targets updated, then 0 stale |
| `verify-capability-docs.mjs` | router 23,219/24,000, 0 failed |

## Anything in the brief that was wrong or underspecified

- **`scopeMatch`** is listed with "see below" but the rules below fix both cases; interpreted as the
  knob for requested scopes (state.md §1). Without `'some'` the wake copy cannot be expressed.
- **`releaseStale`**: no open generation exists (above). Not built, recorded.
- **B-7 via "the broker"**: a native resume needs a view (authorization, creation scopes), so it is
  on the bound writer; the external one is on `TaskBroker`.
- **Native pending entries do not store creation scopes** — they come from the creating view, not
  the request. A resume takes the resuming view's creation scopes; documented.
- **The ts-extras `async-control` `ScheduleTimer`** is not on `integration/asks`, so the broker
  declares a structurally identical `TaskScheduleTimer`; consolidate once both land.
- **`whenIdle` with a holding guard** waits for its own hold (a held section is queued work). A host
  using B-6's pause then `whenIdle` must pause *after* idling or use the gate's own quiet; documented.

## Review round 1 (2026-10-26, on `b9b705bdd`)

Each regression test was shown red by reverting exactly that fix in the current source — the
behaviour `b9b705bdd` had — rebuilding, and running it (`scratchpad/revert.py r1-*`). The reviewer's
probes `p1_landed`, `p2_poison`, `p4_guard` now report the fixed behaviour; `p3_scopes` uses the
pre-round-1 `trustedKindAuthority` signature (now a `Result`), and its scenario is the broker test
below.

| finding | fix | test | red on revert |
|---|---|---|---|
| P1-1 resume of a landed record committed unauthorized scopes | `pendingRegistration` reports `landedScopes`; `createNative` authorizes (and requires the view to select) the scopes to be committed; storage refuses to adopt a landed record whose scopes differ from the draft's | `create is authorized against the landed record’s scopes…`; `a view that does not select the landed scopes…`; `an identical createTracked retry from a view with other creation scopes is refused, not adopted` | yes — r1-landed-authorize (2 red), r1-storage-refuse (1 red) |
| P1-2 scope-change targets never reached the policy | `changeScopes` passes `access: { scopes: <resulting set> }` (access may now derive from the record); `ITaskAccessRequest` docs say so | `a scope change that would move a task out of the authority’s scopes is refused` (real broker; also asserts the policy saw `[alpha, beta]`) | yes — r1-changescopes-access |
| P1-2 omitted-`scopes` rule | requested scopes with no `scopes` configured are refused, named or not | `without scopes, every request that asks for scopes is refused, named task or not` | yes — r1-omitted-scopes |
| P1-3 a throwing `cancel` poisoned the queue | `cancel` captured in `settle` and the sync-fire branch; each idle waiter captured; `_tail` made non-rejecting | `a timer whose cancel throws neither breaks the writer queue nor leaves whenIdle unsettled` | yes — r1-cancel-capture |
| P2-1 guard failing after `write()` claimed nothing was written | section wrapped; ran-then-failed/threw → `storage-unavailable`, `reconcile-first`; second call refused unrun | `a guard that fails or throws after running the section reports reconcile-first…`; `a guard that runs the section twice…` | yes — r1-guard-after, r1-guard-once |
| P2-2 `whenIdle` mid-operation | documented: sections, not operations; pause the guard, then `whenIdle` (TSDoc, CAPABILITIES, README) | — (documentation) | — |
| P2-3 imperative ladders | `_resumable` / `resumeNative` / `resumeExternal` and `openOrInitializeTaskRepository` chained with `onSuccess` / `thenOnSuccess` | existing tests | — |
| P2-4 durability values declared twice | `allTaskRepositoryDurabilities` `as const` feeds `TaskRepositoryDurability` and both `enumeratedValue` converters | existing tests | — |
| P3 empty lists | `trustedKindAuthority` returns `Result`, failing on an empty `kinds`/`scopes`/`actions` | `refuses an empty kinds, scopes or actions list at construction` | (new API) |
| P3 TSDoc | ignores `role`/`command`/`targetResponsibility`; `'some'` audience note; `issued()` is gated | — | — |
| P3 replay after a lost response | a live task whose creation was a catalog registration replays through the creation path, re-authorized | `resumes after a reopen…` (second resume replays, then a denying policy refuses); external `resumes through the broker…`; `a live task replays its creation` | yes — r1-replay (3 red) |
| P3 probe union | `ITaskRepositoryRootProbe` discriminated on `mode`; no `reason!` | type-level | — |
| P3 refusal after cleanup | corrected in the table above | — | — |
| P3 backfill | a durable open of a manifest without `initializedMode` records `process-crash` | `a durable open backfills the mode into an older manifest, which then refuses a session open` | yes — r1-backfill |
| P3 consumer sweep | corrected above (`samples/testbed/.../journey.ts`) | — | — |

### Round 1 gates

| gate | result |
|---|---|
| package `build` / `lint` | 0 error/failure matches; no warning lines |
| package `test` | 2480 passed, 0 failed; coverage 100 / 100 / 100 / 100 |
| `rush rebuild` | `SUCCESS: 39 operations`; only the tracked-symlink notice |
| `rush test` | `SUCCESS: 38 operations`, 38 completed, 0 failure matches; only the tracked-symlink notice |
| `change --verify --target-branch origin/integration/asks` | passes |
| prettier 2.8.8 | clean over every changed file |
| feed `--check` / `verify-capability-docs` | 0 stale / 0 failed (router 23,219/24,000) |

## Review round 2 (2026-10-26, on `f8d636823`)

No P1s. Each regression test was shown red by reverting exactly that fix in the current source and
rebuilding (`scratchpad/revert.py r2-*`). The reviewer's probes `p1_race`, `p2_create_race`,
`p3_guard_unawaited` and `p4_ext_replay` now report the fixed behaviour.

| finding | fix | test | red on revert |
|---|---|---|---|
| P2-1 a creation/resume losing a race replayed inside the writer without replay checks | the gated section reads the task first; if live, commits nothing and `createNative` runs again through the existing-record branch; that branch authorizes `create` for the committed scopes (`committedScopes ?? taskRecordScopes(record)`); the external path does the same | `a resume that loses a race…` (alpha first, beta first), `an identical createTracked that loses a race…` (alpha first, beta first), `a replay from a view with other creation scopes is authorized for the committed scopes` | yes — r2-race-native (4 red), r2-replay-scopes (1 red) |
| P2-2 a guard that started the section and returned early reported "nothing written" | the started section is awaited before the turn ends, then classified as ran (`reconcile-first` unless its own result is returned) | `a guard that starts the section without awaiting it…` | yes — r2-guard-unawaited |
| P2-2b `ITaskWriteGuard` TSDoc drift | rewritten for not-called / called / called-twice, and the no-re-entry rule | — | — |
| P2-3 resume / `pendingRegistration` TSDoc | live external tasks replay; "record never written" replaced by "not yet marked live; its first record may or may not have landed" (three sites) | — | — |
| P3-1 external replay refused once the parent closed | an identical live registration is replayed without the parent checks; a different request under the id is a `conflict` | `replays even after its parent closed` | yes — r2-ext-replay-parent |
| P3-2 a broker call from inside the guard wedges the broker | **documented, not detected** (see below) | — | — |
| P3-3 `'some'` lets a scope change add outside scopes | documented in `TrustedScopeMatch` and `trustedKindAuthority` TSDoc and CAPABILITIES | — | — |
| P3-4 `resumeNative` disclosed "external registration" | answered as no pending registration unless the view selects one of its scopes | `a view that selects none of its scopes is told nothing about it` | yes — r2-external-blind |
| P3-5 DRY | `taskRecordScopes` and `taskScopeKey` (types packlet, public) replace the three record-scope copies and the three scope keys; `access.ts`'s `scopeKey` removed | existing tests | — |
| P3-6 `record!.issued` | an absent record is `not-found-or-denied` | `a delivery bound to a subscription the repository does not hold is refused, classified` | yes — r2-issued-ghost |

**P3-2, declined as detection, with reasoning.** A re-entrant call from inside the guard and a
concurrent caller's call both reach `BrokerCore.gated` while the guard is running, and nothing
portable tells them apart: that needs an async context (`AsyncLocalStorage`), which is Node-only and
which no `@fgv/*` library assumes. A flag held while the guard runs would refuse **every**
concurrent write during any guard's run — including a pass-through guard's, during every section —
which breaks ordinary concurrency and contradicts the brief's "a long pause fills the 64-waiter
queue" contract. So the rule is documented on `ITaskWriteGuard` and in CAPABILITIES ("the guard must
not call the broker"; `whenIdle` is the one safe call and times out). If an async context becomes
acceptable, detection is a small change in `_guarded`.
