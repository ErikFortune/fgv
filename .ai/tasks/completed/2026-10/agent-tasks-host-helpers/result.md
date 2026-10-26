# Result: `agent-tasks-host-helpers`

**Shipped:** `@fgv/ts-agent-tasks` gains the host plumbing every broker consumer rewrites: `openOrInitializeTaskRepository` with the exported root probe the repository itself uses, `trustedKindAuthority` for trusted host principals, `TaskBroker.whenIdle`, a `writeGuard` around every broker write, `IBoundTaskDelivery.issued()`, and resumption of a pending registration from the request the repository stored.

Origin: personaility#698 (fgv-ask), slices B-3, B-7, B-4, B-5 + F8. B-1, B-2 and B-6 were not built,
per the brief. Change file typed `minor` (`BREAKING (implementers only):` — three interfaces widened).

## What changed, per slice

### B-3 — `trustedKindAuthority` (`host` packlet)

`trustedKindAuthority({ kinds?, scopes?, scopeMatch?, actions, epoch }): ITaskAuthorization`.

- `actions` is required; a request whose action is not listed is refused.
- A request **naming a task** (or an unresolved reference), in any role, needs its kind in `kinds`
  (when given) and *some* of its own scopes in `scopes` (when given).
- A request **asking for scopes** (creation, subscription, dispose-over-subscription, and a scope
  change's targets) needs them matched by `scopeMatch`: `'every'` (default, the brief's rule) or
  `'some'`. An empty requested list is refused. With `scopes` omitted, a request naming no task is
  refused.
- A creation names no kind, so `kinds` does not constrain it.
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
  canonical request (trusted host API, resident state). **Widens `ITaskRepository`.**
- `IBoundTaskWriter.resumePendingRegistration(taskId)` — native (`create-tracked` / `create-list`):
  the stored request is fed back through `createNative`, so `create` is authorized **now**, the
  epoch is captured before the policy is asked and re-checked inside the writer immediately before
  the record is written, and the repository's identity check matches it against the pending entry.
  Another principal's pending registration is answered exactly like an id with none.
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
  `allowSessionOverDurable: true`. A manifest without the field opens in either mode. An unknown
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
| resume: authorize → commit | `pendingRegistration` (outside the writer), principal match, `mayCreate` | `writer.register` | epoch captured before the first policy question and re-checked inside the writer as the last step before `register`, which awaits nothing before writing; `register` compares the full identity (operation id, operation, principal, record type, canonical request) against the pending entry **under the writer**; a resume that loses a race to another resume finds a live record and replays its receipt (`createNative`'s existing path) |
| resume (external) | `pendingRegistration`, operation kind | `registerExternal` | parent re-read inside the writer, source checkpoint history compared inside the writer, identity matched by `register` under the writer |
| open-or-init: probe → open/initialize | `probeTaskRepositoryRoot` (outside ownership) picks the mode | `_acquire` → initialize or open | `RecordStore.create` re-runs the **same probe** inside `_acquire`, so a root whose capability changed in between is refused rather than opened in the wrong mode; the open-vs-initialize decision is taken **after** `acquireRoot` and temporary cleanup, from the listing made under ownership — there is no window for content to land between the decision and the operation (in-process; cross-process exclusivity stays the host's requirement, as documented) |
| open: manifest mode vs requested mode | `initializedMode` read in `scanRoot` | the scan's only write (completing landed registrations) | the check runs before any write, and a refusal releases ownership (`_openAcquired`) |
| `whenIdle`: observing the queue vs a newly enqueued write | `busy` read synchronously | resolve | none, by design: a write enqueued after the resolve runs normally. A write enqueued while waiting keeps the count above zero, so the waiter fires only when **that** write is done too (test: `never takes the writer…`) |
| the guard around `withWriter` | the guard's own decision | `withWriter(section)` | the guard runs inside the queue's turn, so nothing else can take the writer between its decision and the section; the section's own epoch / revision rechecks run after the guard, inside the writer, unchanged |
| `issued()` vs a concurrent acknowledge | `readSubscription` under the writer | the host's later `abandon` | `abandon` re-reads the record under the writer and removes only a manifest still present; abandoning one acknowledged meanwhile removes a manifest whose history is already committed (nothing lost), and a later replay of that acknowledgement is refused as an invalid receipt (test: `a moment, not a hold…`) |

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
the test double above. No consumer outside `ts-agent-tasks`.

## Gates

See the final section, filled at close.

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
