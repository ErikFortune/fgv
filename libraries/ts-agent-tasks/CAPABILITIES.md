# `@fgv/ts-agent-tasks` — agent task recording and mediation

> **This file is authoritative for what `@fgv/ts-agent-tasks` provides and what not to hand-roll.**
> `README.md` is getting-started material. The always-loaded index at
> [`.ai/instructions/LIBRARY_CAPABILITIES.md`](../../.ai/instructions/LIBRARY_CAPABILITIES.md)
> routes here; it never duplicates this content.

---

[libraries/ts-agent-tasks](https://github.com/ErikFortune/fgv/tree/release/libraries/ts-agent-tasks)

**A library that records work and mediates observations and commands. It runs no agent loop** —
no scheduler, no executor, no model invocation, no retry policy. Hosts call it; nothing here runs
on its own, and importing it has no side effects.

## What ships today

Eight things: the **vocabulary** (the `types` and `converters` packlets), the **snapshot-only
context entry point** (the `context` packlet), **durable task storage** (the `storage` packlet:
`FileTreeTaskRepository`), **indexed selection** over that storage — scope/lifecycle queries,
due candidates and owed updates answered from resident indexes, with keyset paging, a staged
rebuild and a reusable conformance suite for custom repositories — and the **broker**
(`TaskBroker`): principal-bound views and writers, tracked work and task lists, hierarchy and
reassignment, with authorization at every read and mutation — and **external sources**
(`ITaskSource`, `ExternalTaskSource`): observation, paged reconciliation, recovery and command
dispatch for work a source executes, with the source owning execution truth — and **delivery**
(`TaskBroker.subscribe`, `bindDelivery`): subscriptions with persisted policies, receipt manifests
issued before a context is returned, and exact-ID acknowledgement — and **retention**
(`TaskBroker.dispose`, `closeSubscription`, `abandonCommand`, `cleanup`): obligations end only by
acknowledgement or an authorized, recorded disposition, pruning and archive decide from durable
checkpoints, and every incomplete operation is reportable — and **cascade stop**
(`requestStop`, `reconcileStop`, `releaseStop`): a persisted pause or cancel of a task and its whole
authoritative subtree, a frozen subtree while it latches, and an honest partial result — and
**model tools** (`createTaskTools`): `task_query` and `task_inspect` as ai-assist client tools over a
principal-bound view, with bounded output by default, and — only when the host opts in —
`task_create`, `task_update` and `task_reassign` over the same binding's writer, and one typed tool
per registered command the host names, its wire schema the command's registered parameter schema,
and `task_stop` / `task_stop_inspect`, which let a model request and read a cascade stop — never
release it or carry it out. Prompt integration follows in a later slice, and is deliberately absent
from the export surface rather than stubbed.

## Storing tasks durably — `FileTreeTaskRepository`

**One repository implementation over an injected `FileTree` root.** It never sees a native path
and never imports `node:fs`; what backs the root decides what it can promise. Over the in-memory
tree it is a `'session'` repository; over `FsFileTreeAccessors` on a qualified filesystem it is a
`{ durable: 'process-crash' }` one. Same code, same records, same tests — the adapter is the
FileTree accessor, chosen at the host's boot edge.

```ts
// Boot edge: provision the directory, pick the accessor, inject the root.
const root = FileTree.DirectoryItem.create(dir, new FileTree.FsFileTreeAccessors({ prefix: dir, mutable: true })).orThrow();
const environment = TaskEnvironment.create({ logger, clock: Date.now, newId }).orThrow();
const params = { root, mode: { durable: 'process-crash' }, environment, registry } as const;

// Once, into an empty root:
const repository = (await FileTreeTaskRepository.initialize(params)).orThrow();
// Afterwards (a root is held by one instance at a time, so close before reopening):
repository.close();
const opened = (await FileTreeTaskRepository.open(params)).orThrow();
if (opened.state === 'recovery-required') { /* inspect opened.recovery.report; nothing is writable */ }
```

**Durability is exactly what the root can prove, and never degrades.** `{ durable: 'process-crash' }`
is refused at construction — `unsupported`, before any I/O — on any root whose FileTree capability
inquiry does not list `'process-crash'`: the in-memory tree, a read-only tree, and on Node every
filesystem outside F2's allowlist (Linux ext2/ext3/ext4 and tmpfs). **A container's writable layer
is overlayfs and is refused**; put a durable root on a named volume or a Linux bind mount. There
is no OS-crash or power-loss mode, and asking for one fails. `'session'` is explicit and claims
nothing that survives the process.

**Nothing is acknowledged before the FileTree atomic boundary.** Every record is written with
`writeChildAtomically` at the repository's guarantee, and every method returns success only after
that call has — on Node, after the record is renamed into place *and* the directory flushed. The
real-Node crash suite pins the order: a registration's success is the event after the third
write's directory flush, and a mutation's after its one write's.

**One task, one record, one atomic replacement.** `task-<taskId>.json` holds the task's current
state, every owed update (`ITaskUpdate`, one immutable payload per `(task, revision, category)`
whose id is `taskUpdateId`), every operation's dedup evidence (`IStoredTaskOperation`), and the
task's capacity claims — replaced together or not at all. Addresses are task-ID based and never
change. `ITaskRepositoryWriter.commit` takes one of three purposes:
- `operation` — must add exactly its own stored operation. **A repeated operation id replays**:
  the committed record comes back and nothing is applied twice — checked *before* the revision
  preconditions, because a lost-response retry carries the revision it expected before its own
  commit. The same id with a different request, catalog operation or principal is a `conflict`.
- `observation` — a source projection, deduplicated by `sourceRevision`. The same source revision
  projecting the same state is a replay; projecting a different state is `source-gap`.
- `maintenance` — receipt evolution, telemetry, pruning: no semantic change at all (envelope,
  details and `archived` are fixed; only observation timestamps may move), no new operation, no
  new update.

Only an observation may change a committed `sourceRevision`, and only an observation may resolve
an unresolved record. An observation in turn may not change catalog metadata (title, parent,
responsibility, scopes) or archive the task — a source owns execution state, and catalog changes
carry operation evidence. A replay succeeds only if everything the retry offers is already
committed.

Every replacement keeps all operation evidence with its request unchanged and the creation
operation first, keeps every retained
update byte-identical (a required one is removed only by maintenance), advances `recordRevision`
by one, and is refused on a stale `expectedRevision` **or** `expectedRecordRevision` — the two are
separate so pruning cannot erase a receipt committed underneath it. Every read-back checks the
record against a fingerprint of what was committed, and every manifest rewrite first checks the
manifest the same way: an out-of-band change fences the repository rather than being trusted or
overwritten. Identity, kind, detail
version, creation time and source binding never change; terminal state is absorbing; an archived
record (`archived: true`, the tombstone) is immutable. These are storage integrity rules, not
transition policy — which lifecycle moves are allowed is the broker's (a later slice).

**Registration is the ordered inventory protocol.** `register` commits a *pending* inventory entry
(with the canonical creation request and the task's capacity claims), then the record, then marks
the entry *live*. A pending registration is not an accepted task — `read` returns `undefined` —
but it holds its reservations, survives a crash, is reported by the next open, and **resumes when
the host retries the same registration**: same task id, operation id, catalog operation,
principal, first-record type and canonically equal request, same claim ids, no second charge. A pending entry whose record did land is completed by
the next open. The same identity with anything else is a `conflict`. A live identity replays. A new
identity whose record file already exists on disk without this repository having committed it
is a `conflict`, and the file is left untouched. A resumed pending registration whose own first
record already landed (the live write failed cleanly) finishes over that record as it is; any
other file at its name is a `conflict` and left untouched.

**An external task can be registered unresolved.** An `IUnresolvedTaskCommitRecord` carries the
registration and its binding and invents no lifecycle; `read` returns
`{ state: 'unresolved', reference }`. Its first `observation` commit replaces it with the resolved
record — state plus required updates, atomically — and must preserve identity and every piece of
catalog metadata the registration fixed. No other replacement of an unresolved record is accepted.

**`withWriter` is serialization, not a transaction.** One writer per repository: a nested or
concurrent `withWriter` is refused (`conflict`, `retry: 'safe'`), never queued; a handle used after
its callback returns fails; `close` is refused while a callback is active, so the root is never
released under a writer. A replacement that succeeded stays committed if the callback later
fails or throws — there is no rollback, and none is claimed.

**A failure is classified by what a reader can now see.** A write failing with FileTree visibility
`'unchanged'` is `storage-unavailable`, `retry: 'safe'`, and nothing moved. `'replaced'` or
`'unknown'` **fences** the repository — `health().state === 'unavailable'`, every call fails — and
returns `commit-indeterminate` with the operation id: the write may have landed, and a failed call
is not proof that it did not. Close, reopen (which reads what is actually on disk), and retry the
same operation, which replays if it landed and applies once if it did not. A replay rewrites the
committed record byte-for-byte, re-establishing the flush boundary rather than returning a
success whose directory entry was never flushed.

**Open validates everything and initializes nothing.** `open` requires a valid `repository.json`;
`initialize` accepts only an empty root — no files and no directories. Both refuse a kind
registry that fails to freeze. Open reclaims interrupted writes' working files (valid only
now, under exclusive in-process ownership), then checks every named record's presence, strict
UTF-8 (durable mode), JSON, format version, strict converters, filename/ID agreement, the
stored profile's per-value bounds, that every capacity claim is one this release would have
written (owner, ownership, purpose, every bundle dimension present and at most its maximum,
disposition matching the record's state, and a first-resolution claim only on a task registered by
`register-external`), that its first operation is its creation evidence (and, for an unresolved
record, its only operation), that its operation count is within the per-task limit less the
closeout slots it still owes, that a pending entry with
no record is one a registration could resume,
claim-id uniqueness across the repository, the parent graph (a
pending registration is not a live parent), and that committed usage fits the stored profile. A
pending entry whose record landed is completed only when that record is its registration — same
creation operation, request and claim ids. **Anything blocking returns a read-only `ITaskRecoveryHandle`**, never a writable
repository, and nothing is repaired or rewritten. Open performs no clock read, no ID mint and no
source I/O: **it never starts or reattaches external work.** `ITaskRecoveryReport` says what open
found (`ITaskRecoveryIssue`, blocking or advisory) and did (completed registrations, reclaimed
temporaries). A second instance over the same root in one process is refused — by item always,
and by path while a durable repository holds it, so one directory cannot be open as a session
and a durable repository at once. Two session repositories over one real directory through two
different items are not detected: FileTree does not say whether a root is disk-backed. That is a
guard against accidents, not cross-process fencing: exclusivity between processes is the host's
deployment requirement.

**Unknown data is kept, not rewritten.** A record written by a newer storage format (or a newer
envelope schema) blocks open and is left byte-identical. A structurally valid task whose kind is
not registered is **quarantined**: an advisory issue, readable through `readCommit`, `read` fails
`unknown-kind-version`, commits are refused, and the file is never rewritten. Files the inventory
does not name are reported and left alone. Consumer and source records are named in the
inventory, so their absence is detectable, and are validated in full at open.

**Capacity is admitted before anything is written.** Every registration reserves its whole
terminal closeout (`maximumClosureCharges`), and an unresolved one its first resolution as well
(`maximumResolutionCharges`) — claims computed by the repository, never by the caller. Admission
is a vector check over every dimension, against the **widest state the protocol passes through**
(the record written while its pending entry is still in the manifest), and refuses only growth:
a step that does not grow a dimension is never refused on it, so closeout, archive and pruning run
at a full repository. A protected step — first resolution, the terminal transition, archive —
spends from its own claim, whose charges shrink by what it spent; it never spends another task's
reservation. Archive consumes the closeout claim and releases the non-archived slot; nothing
releases a retained identity. Per record, bytes plus that record's reserved growth must fit its
ceiling; per task, ordinary operations leave the closeout's two operation slots free. Refusal is
`backpressure` with `ICapacityFailure` naming the dimension, the figures and whether cleanup could
reclaim it. The ledger is derived — rebuilt from the records at every open, never a quota file.
`capacityStatus()` is the trusted host view: `draining` when a dimension has no headroom,
`admission-blocked` when an `indeterminate` claim fences all growth, `pressure` at 80%.

**The profile is stored, and governs.** `initialize` stores the profile (default
`defaultTaskCapacityProfile`); `open` without one uses the stored profile, and `open` with a
different one — lower, higher or otherwise — fails without touching it. The only way to change it
is `raiseCapacityLimits`, under the writer: every limit and bound must be at least its stored
value, and the policy is replaced atomically. Lowering in place is unsupported.

**What the guarantee rests on, and what it does not.** `'process-crash'` rests on F2's qualified
Node protocol and on this package's crash matrix, which kills a real child process at each leaf
boundary of each write of registration, mutation, terminal closeout, first resolution and limit
increase, on ext4 and tmpfs, and reopens through the real Node path. It says nothing about OS
crashes or power loss: the kernel keeps running in every one of those tests.

## Querying tasks — resident indexes, paging, due and owed

**Queries never read a record.** `query`, `queryDue` and `listOwed` are answered from resident
indexes the repository keeps current on every commit; a warm query performs **zero task-file
reads**. Do not page through `readCommit`, and do not filter a list of every task — the indexes
exist so that growing, unrelated history does not grow a query's work. (The package's counter
suite holds that fixed at 0, 1,000 and 10,000 unrelated tasks.)

```ts
const page = (
  await repository.query({
    selection: { scopes: [projectScope, personalScope], lifecycleClass: 'open' },
    limit: 50
  })
).orThrow();
// page.items: ITaskSummary[], ordered by task id; page.nextCursor when there may be more
const due = (
  await repository.queryDue({ selection: { scopes, lifecycleClass: 'open' }, cutoff: now })
).orThrow();
const owed = (await repository.listOwed({ subscription })).orThrow();
```

**Selection.** `scopes` is a **union**, deduplicated by task before paging; an empty list matches
nothing (never implicit global access). `lifecycleClass` is `open` (pending, running, waiting,
paused), `terminal` (succeeded, failed, cancelled) or `all`; `statuses` narrows to exact statuses
and must lie within the class — `open` with `succeeded` is refused `invalid`, not answered empty.
`parentId` selects direct children; `responsibility` narrows and confers nothing. Pages hold
**non-archived** tasks, terminal ones awaiting cleanup included; an archived task is inspected by
id (`read`), never enumerated.

**Unresolved and quarantined tasks are reported, not hidden.** A registered external task with no
first observation matches on scopes, parent and responsibility, comes back in `page.unresolved`,
shares the page budget and makes the page `partial` — no lifecycle is invented for it. A task
whose kind is not registered is named in `page.issues` (also `partial`).

**Due candidates** are waiting tasks with a `notBefore` at or before `cutoff`: absent `notBefore`
is excluded, equal is included, ordered by `(notBefore, taskId)`. The class must admit `waiting`.
A due query changes nothing — it starts no work and leaves every other prerequisite intact.

**Owed updates** are listed per subscription from their own index, independent of lifecycle: a
terminal or archived task's obligations stay listed after it leaves open work. (This release has
no acknowledgement records, so every audience link on a retained update is owed; subscriptions
arrive later.)

**Paging.** Limit defaults to 50, maximum 200. `nextCursor` is an opaque server-held handle — it
carries no key — valid only at the page's `generation`: **any committed change restarts paging**
(`cursor-stale`, `retry: 'safe'`). A cursor presented with a different query is `invalid`; one from
another repository, from before a reopen, expired (five idle minutes) or evicted (at most 256 per
repository) is `cursor-stale`, never an empty last page. A page that runs out of its candidate
budget returns a cursor even if it is short — it is not the end until there is no cursor.

**Archive keeps identity, edges and source.** Archiving removes the task's summary and every
lifecycle membership in the same commit; its identity, parent edge, final status and source
binding stay resident. `lookupSource(binding)` finds the task a binding is bound to — archived
included — and registering a second task with a binding already bound is refused `conflict`.

**When an index cannot be updated, the repository says so.** A record that commits and whose
index update then fails fences the repository (`unavailable`) and reports the operation
`commit-indeterminate` with its operation id: no stale read. `rebuildIndexes()` is the way out —
it releases the old index and every cursor first, fences queries while it runs, rebuilds in
bounded passes (every task record once, one at a time; consumer and source records once; then only
the records holding owed updates), and either publishes a healthy new generation or leaves the
repository `unavailable` with the problems listed. It never publishes an empty index as healthy.
`open` builds its indexes the same way.

**Bounded working space.** Record reads are limited to four in flight; excess is refused
(`conflict`, `retry: 'safe'`), never queued. The optional parsed-record cache (`recordCache` on
open/initialize) is **off by default**, one per repository, at most 32 entries and 8 MiB of
encoded charge.

**The authoritative graph.** `childStates(parentId)` lists every retained child — archived,
unresolved and quarantined ones included — with its state and final status, from resident data.
`listCompletionCandidates({ limit, after })` lists open automatic task lists whose every child
has succeeded; every commit maintains it and open/rebuild reconstructs it from the records. Both
are trusted host reads; the broker decides from them.

**Custom repositories.** `runTaskRepositoryConformance(factory)` runs the behavioural contract
above against any `ITaskRepository` and succeeds with a report or fails naming each check that
did not pass — framework-free, so it drops into any test runner:

```ts
expect(await runTaskRepositoryConformance(() => MyRepository.createEmpty())).toSucceed();
```

## Bound authority — `TaskBroker`

**Hand a principal a bound view or writer, never the repository.** Repository APIs are trusted
host contracts with no authorization; the broker is the boundary a model tool, an actor or a
remote caller should get.

```ts
const broker = TaskBroker.create({ repository, environment }).orThrow();
const writer = broker
  .bind({ principal: 'agent:ada', scopes: [projectScope], authorization: policy })
  .orThrow();
const view = broker.bindView({ principal: 'agent:bob', scopes: [projectScope], authorization: policy }).orThrow();

await writer.createTaskList({ taskId, operationId, title: 'Ingest batch 7', completion: 'all-children-succeeded' });
await writer.createTracked({ taskId: child, operationId: op2, title: 'Page 1', parentId: taskId });
await writer.execute({ taskId: child, operationId: op3, expectedRevision, command: 'start', parameters: {} });
await writer.reconcileListCompletions({ limit: 50 }); // host-pumped; completes eligible lists
```

**Visibility needs both.** A task is visible to a binding only when one of its scopes is among
the binding's selectors **and** the host policy's `check({ action: 'read' })` allows it. Scopes are
labels; responsibility, parentage, source binding and receipts grant nothing. A hidden task and a
foreign id fail identically (`not-found-or-denied`, same message).

**Authorization is not a wrapper.** Every operation authorizes its subject — and, for a
relationship change, each affected parent in its `role` (`parent`, `previous-parent`,
`new-parent`) — then re-reads everything it authorized inside one serialized writer section and
refuses (`conflict`, `retry: 'safe'`) if the policy epoch moved or a record changed. Supply a
host `ITaskAuthorization` whose `policyEpoch()` changes whenever its answers might. A check that
fails, throws or rejects is a denial. Requests carry no principal or scope field; a fabricated one
is `invalid`.

**Views emit projected data only.** `IProjectedTaskEnvelope` has no `binding` member, details
appear only through a host `ITaskProjector.details`, and `defaultTaskProjector` also removes
outcome artifact references. A projector that fails, throws, adds a field or describes another
task **fails the call — nothing falls back to unprojected data**. Query pages drop denied
candidates before inclusion, count nothing, carry no repository generation, and bind their cursor
to the view and the policy epoch. `bindView` returns an object with no mutation method.

**Tracked work.** `fgv.tracked@1` commands are a transition table, not `setStatus`: `start`
(pending→running), `wait`/`pause` (with a reason), `resume` (waiting/paused→running), `succeed` /
`fail` / `cancel` (terminal, absorbing), and `set-title` / `set-description` / `set-progress` /
`set-attention` in open states. Restating the current state is `applied` at the current revision.
Receipts: `applied`, or `rejected` with `invalid-transition`, `unsupported` (unknown command), `conflict` (stale revision), `denied` or
`idempotency-conflict`. The first three are recorded under the operation id and replay; `denied`
and `idempotency-conflict` are returned and never recorded.

**Task lists.** `fgv.task-list@1` succeeds only from its **complete** child set — archived,
unresolved and hidden children included: `completeList` explicitly (the only way an empty list
completes), or the pump for `all-children-succeeded` lists with at least one child. The pump reads
the repository's completion-candidate index (rebuilt from records at open, so a crash between a
last child's success and the list's completion leaves a candidate), authorizes `complete-list`,
and rechecks membership inside the writer. Nothing runs unless the host pumps it.

**Hierarchy.** One parent, no self-parent, no cycle, no missing parent — checked inside the writer
against the graph as it is then. Terminal edges are immutable: a terminal task keeps its parent,
a terminal parent keeps its children and takes no new one. An archived tombstone still anchors its
children.

**Reassignment changes responsibility and nothing else.** `reassign` preserves id, record, parent,
children, scopes, outcome, details, claims and source binding; it never reassigns children, grants
access or quiesces work (a stale write simply conflicts). `'unassigned'` is explicit — the field
is required. External tasks, observation-only ones included, may be reassigned; their source
binding and `lookupSource` never move.

**Capacity.** The broker adds no reservation: terminal transitions and list completion spend the
task's `terminal-closeout` claim, so at a saturated profile new identities are refused
(`backpressure`) while same-key replays, completion of accepted work and archive proceed.

**Host operations.** `registerExternal(principal, request)` registers an externally executed task
with host-supplied scopes and binding — unresolved until its first observation, or resolved from
an `initialObservation`. An update owed to no one is not retained; who an update is owed to is
decided by storage from the active subscriptions (below), never by the caller.

## External sources — `ITaskSource`, `ExternalTaskSource`

**The source owns execution truth; the broker records what the source says, never what it
expects.** Attach sources at `TaskBroker.create({ repository, environment, sources })`. Build one
from typed callbacks with `ExternalTaskSource.create({ id, history, encodeDetails, compare, read,
feed, recover, commands?, lookupCommand? })`; each command comes from
`ExternalTaskSource.command(descriptor, apply)`, whose descriptor is the same one the kind
registry declares (`idempotency: 'source-key' | 'none'`, `conditional`). A callback that fails or
throws is `source-unavailable`, never an escaped exception; parameters the descriptor refuses
never reach it.

**History contract.** `'observed-state'`: the source can report its current state, and any read
may commit it. `'source-replay'`: the source replays every revision in order, and **only its
reconcile feed commits projections** — `observe`, push hints and command answers run a feed pass
from the committed cursor instead, so a revision-3 hint cannot overtake revision 2's obligation.
Registering against a `source-replay` source requires a finite envelope
(`history: { history: 'source-replay', envelope: { remainingRequiredUpdates,
remainingRequiredBytes } }`), reserved at admission — and from then on only that source's feed
commits the task's projections, whatever source is later attached under its id;
a feed that exceeds it is a `source-gap` with the cursor unmoved, and
`extendReplayEnvelope(taskId, add)` is new admission.

**Ordering by the source's comparator, never by timestamps.** For each observation:
`newer` commits (execution fields only — catalog fields are the broker's, terminal is absorbing);
`same` with the same execution state is a freshness refresh (no revision, no update); `same` with a
different state is a source-contract violation (`source-gap`); `older` is stale and ignored;
`incomparable` (e.g. a new epoch) is ignored until explicit `recover`.

**Reconciliation.** `reconcile({ sourceId, maxPages? })` reads pages from the cursor in the
source's checkpoint record, applies every observation, and only then commits the page's cursor. A
gap, broken per-binding order, contract violation or backpressure stops the pass with the cursor
where it was. A pass is complete only when the source says so **and** its coverage is
`'all-bindings'` — an active-only listing never completes terminal discovery. Opening a repository
calls no source.

**Commands on external tasks.** `writer.execute` on an external kind: records the intent
(`not-sent`, receipt `accepted`) **and reserves its settlement** before anything is sent,
re-checks authority, marks `possibly-sent`, then dispatches outside the writer (a conditional
command carries the source revision committed at the marker). Receipts: `rejected` (with the
source's reason), `accepted` (sent; not yet observed applied — **accepted is not applied**),
`applied` (at the revision whose observation committed it), or `indeterminate` (outcome unknown).
An unattached source leaves the task untouched and answers `source-unavailable`.

**Uncertain outcomes.** `writer.resolveCommands({ limit })` pumps unsettled commands: an intent
never sent is dispatched; a `possibly-sent` one is looked up (`lookupCommand`), re-sent only when
its command is `idempotency: 'source-key'` and the key has not expired, and otherwise **held** —
never replayed. Revoked authority settles `rejected: denied` without sending.

**Recovery.** `recover(taskId)` handles every `RecoveryResult`: `reattached` / `completed` /
`unrecoverable` (which must carry a failed or cancelled projection) commit as observations, an
incomparable epoch included; `unavailable` marks observation health; `resumable` and `unresolved`
are reported and change nothing. Records hold the bounded projection only; an executor-owned
payload stays in the executor, and terminal presentation never dereferences it.

**Capacity.** Each in-flight external command holds a settlement reservation until it settles: one
owed result at the derived update maximum (`maximumUpdateBytes` — 37,417 bytes of resident payload
at the default profile) plus its stored operation and receipt. The default profile's remarks give the
ceilings this implies.

## Delivery — subscriptions, issued receipts, exact acknowledgement

**A consumer learns about task changes by subscribing; it acknowledges only what it was actually
shown.** The host subscribes; a principal then works a bound delivery (`IBoundTaskDelivery`:
`pending`, `prepare`, `acknowledge`, `abandon`).

```ts
await broker.subscribe(
  { principal: 'host', scopes: [projectScope], authorization: policy },
  { subscriptionId, operationId, consumerId, selection: { scopes: [projectScope], lifecycleClass: 'all' },
    start: 'current' /* or 'from-now' */, policy: { categories: ['attention', 'lifecycle', 'result'] } }
);
const delivery = broker.bindDelivery({ principal: 'agent:ada', scopes: [projectScope], authorization: policy,
  subscriptionId, consumerId }).orThrow();
const { context } = (await delivery.prepare({ maxItems: 20, maxDepth: 3, maxChars: 8000 })).orThrow();
// … the host processes `context` (model call, etc.) …
await delivery.acknowledge(context.receipt); // only after the host's own success boundary
```

**Audience is storage's.** An update is owed to an active subscription iff its category is in the
subscription's `policy.categories` (`attention`, `lifecycle`, `result` are always included) and the
selection matched the task **before or after** the commit — so an open-only or filtered subscription
still receives the update that takes a task out of it. Storage recomputes every new update's
audience inside the commit and refuses a caller-chosen one. **The persisted policy is
authoritative:** broker `delivery` defaults apply only when a subscription is created.

**`start: 'current'`** baselines every selected task the principal may see, at its committed state,
with no gap to a concurrent commit (the capture is re-verified inside the activating writer and
redone if anything moved). A selection larger than the baseline bound is refused, never truncated.

**Receipts are capabilities.** `prepare` renders purely, then commits the receipt's exact manifest
(keyed by a fresh delivery id, with an expiry) before returning the context; if issuance fails,
nothing acknowledgeable is returned. `acknowledge(receipt)` accepts only a receipt that matches, in
full canonical form, an unexpired manifest this subscription issued — a fabricated, modified,
shortened, enlarged, foreign-subscription or foreign-store receipt, a snapshot-only receipt, or a
replay after expiry all get the same `invalid-receipt` answer. A copied valid receipt replays
(`alreadyAcknowledged`), consuming nothing twice. `abandon(deliveryId)` releases a manifest.

**Exact IDs, never a watermark.** A subscription stores the exact set of update ids it has
acknowledged. A receipt that omitted revision 3 and included revision 4 clears only revision 4.
Every task in a receipt is re-authorized (read + `acknowledge`) at acknowledgement, and fenced
against change until the commit; revocation blocks delivery, it never acknowledges.

**Checkpoint custody.** Subscriptions persist through `ITaskCheckpointStore` (synchronous; default
`FileTreeCheckpointStore` in the repository root; inject one via `checkpoints` at
`initialize`/`open`). A store's success is checked, not believed: every write is read back, and a
store that reports a write it does not hold, answers another record, throws, or cannot say whether
a write landed fences the repository. A `process-crash` repository refuses a `session` store.

**Capacity.** Each audience link's acknowledgement evidence (one id + 512 B) is spent from the
claims that already reserved it (closeout, resolution, settlement, replay) and held by the
subscription until its exact id lands in lifetime history. At most `maxAudiencePerUpdate`
subscriptions may cover one task. Each subscription holds a 64 KiB receipt-preparation reservation;
a `current` baseline holds each covered task's payload until acknowledged or disposed — see
`docs/TECH_DEBT.md` for the effective ceiling.

## Retention — disposition, closure, pruning and archive

**An obligation ends in exactly two ways: the consumer acknowledges its exact id, or a host
disposes of it with a recorded reason.** Nothing else — not expiry, not revocation, not capacity
pressure, not cleanup — ends one. Both land in the subscription's exact history
(`ITaskConsumerRecord.acknowledged` / `.disposed`), which is retained for the record's life.

- **`TaskBroker.dispose(binding, { subscriptionId, updateIds, reason })`** — a trusted host
  operation; `binding`'s policy must also allow `dispose-obligation` on every task the ids name.
  Every id must be owed now (or already discharged — reported, not rewritten); an id an
  unacknowledged issued receipt names is refused until that receipt is acknowledged or abandoned.
  The reason is bounded by the profile's `maxDispositionReasonBytes`. It converts the evidence slot
  the obligation already reserved; it needs no new capacity.
- **`TaskBroker.closeSubscription(binding, { subscriptionId, obligations, reason? })`** — the
  subscription joins no audience again and releases its future-update reservation. `retain` keeps
  what it is owed, drainable through its bound delivery (a closed subscription's `prepare`
  presents only what it is still owed); `dispose` abandons its unacknowledged receipts and disposes
  everything it is owed, with `reason`. Its record, identity slot and history are retained; its id
  is never reused. Once a closed subscription owes nothing it releases its 64 KiB preparation.
- **`TaskBroker.abandonCommand(binding, { taskId, operationId, reason })`** — ends tracking of an
  external command whose outcome is not known (never sent, sent-and-held, or awaiting a
  `source-replay` feed revision). The receipt becomes `{ state: 'abandoned', reason, from }`: it
  never claims the command was or was not applied. The settlement reservation is released.
- **Coalescing** — a subscription created with `policy.coalesceProgress: true` accepts that an
  undelivered routine (`progress`/`observation`) update may be superseded by a newer one of the same
  category, which records the gap in `ITaskUpdate.coalesced`. Required categories never coalesce,
  and an update an unacknowledged receipt names is never superseded. Default `false`.

**Pruning and archive decide from durable evidence, never from the resident index.** An update
leaves a task record only when every audience member's checkpoint — read through the store and
verified against what was committed — holds its id in the exact history (or it is coalesced as
above). A checkpoint that cannot be read or verified **fences the repository and stops cleanup**;
it is never skipped. `TaskBroker.cleanup({ limit })` prunes discharged payloads (the candidates
come from `ITaskRepository.prunableTasks`). `archive` writes a tombstone that retains **no** update
payload, and is refused (`retention-blocked`) while any update or baseline for the task is still
owed, or any command is unsettled or awaiting its feed. The refusal a principal sees never names a
subscription.

**A `source-replay` feed never passes a binding no task holds.** A pass that meets a revision for
an unregistered binding stops with the cursor unmoved (`stopped: 'unregistered-binding'`);
registering the binding lets the next pass apply it. Register `source-replay` tasks before the
source emits for them — the stop makes a missed ordering visible instead of silently lost.

**Every incomplete operation is reportable.** `ITaskRepository.outstanding({ limit })` lists pending
registrations and subscriptions (retry the same request), unsettled and feed-awaiting commands
(`resolveCommands`, or `abandonCommand`), prunable tasks (`cleanup`) and each retained
subscription's owed and pinned counts. Open's `ITaskRecoveryReport` remains the record of what open
found and completed; `rebuildIndexes()` rebuilds every index above from the records.

## Cascade stop — `requestStop`, `reconcileStop`, `releaseStop`

**A stop is not a transaction.** It is a persisted intent, satisfied target by target and reported
honestly: accepted is not completed, applied effects are never rolled back because another target
refuses, and there is no "success with a skipped child". (Design § 10; plan amendment A2.)

- **`writer.requestStop({ taskId, expectedRevision, operationId, mode })`** — `mode` is `pause` or
  `cancel`. The root must be a broker-managed tracked task or list whose `stopPolicy` permits the
  mode (`cascade-pause` permits a pause; `cascade-cancel` both). Inside the writer the **complete
  authoritative subtree** is captured — root first, then breadth-first by id, hidden, archived,
  unresolved and external descendants included, whatever their own `stopPolicy` — and persisted in
  the root's record with a minted command key per target. More than 1,000 targets is refused, never
  truncated. **Nothing is dispatched**: the result is `pending`, every target `unexamined`.
- **`writer.reconcileStop({ taskId, intentId, limit? })`** — the host pump: one pass that revisits
  every target under **current** authority (`stop` on the root, `stop` as `stop-target` on each
  target — a delegated stop reaches targets the principal cannot see), sends each mode's own command
  through the ordinary command path, resolves uncertain ones by their key, confirms, and persists
  the root's summary. `limit` (default 50) bounds its effects — source calls and commands; reading
  records is free. Only a pass that visited every target can make the stop `satisfied`. It starts
  no work and installs no timer; nothing runs it but the host.
- **`writer.releaseStop({ taskId, expectedRevision, operationId, intentId })`** — ends the latch.
  A pause may be released with blockers standing; nothing resumes and nothing sent is retracted. A
  cancel whose root is terminal cannot be released (that would reopen the tree).
- **`view.inspectStop({ taskId, intentId })`** — the current result, no effects.

**Target states.** `confirmed` — the state satisfies the mode and holds (a native task by the
latch; an external one by its source's **declared stable stop**). `pending` — a command is accepted
or on its way: **a receipt is not a stop**. Blockers — `unsupported` (observation-only, no
declaration, or only a *sampled* pause), `denied`, `unavailable`, `refused`, `indeterminate` — keep
the stop `blocked`, never satisfied. A task list has no own work: as a pause target it is confirmed
without a command.

**The result** (`IStopResult`) lists only targets the caller may see; the intent is never filtered.
`restrictedWorkRemains` says, with no counts or ids, that a hidden target is not confirmed. A
presentation never overstates: a confirmed target whose record has since left the stopped set is
shown `indeterminate` with its `violation`, and a satisfied stop resting on external evidence is
shown `pending` after a restart until a pass revalidates the source's declaration.

**The admission freeze** — enforced by the repository on every commit, rebuilt from the records
before a reopened repository accepts a write. While a stop latches: no new child anywhere in the
subtree (create, register, reparent in); no reparent of a latched task; no move to `running` (start,
resume) and no move out of the stopped set (`paused → waiting` under a pause) — decided on states,
so no command spelling bypasses it (a native command answers `rejected: stop-active`); no new
command to a latched external task's source, and a command recorded before the latch is settled
`stop-active` rather than sent; a latched list does not complete; a latched task is not archived.
Source observations are exempt — a source restarting a stopped task degrades the stop instead.

**Sources opt in** with `ITaskSource.capabilities(binding)` (`ExternalTaskSource`: `capabilities`):
`pause: 'stable-until-explicit-resume' | 'sampled' | 'unsupported'`, `cancel: 'terminal-absorbing' |
'unsupported'`, a `contractVersion`, and the kind's command (with parameters) for each mode. It is
asked on every pass. A confirmed external pause records its evidence — source, contract version,
confirming revision — and a later observation that contradicts it records a `violation` and
re-stops under a new attempt. **No library assertion manufactures external fencing.**

**Custom repositories and draft builders.** A replacement of a record must keep its stops — storage
refuses one that drops an intent — so build drafts with `...carriedStops(record)`. A repository
implements `subtree(rootId, limit)` (refused, never truncated, over the limit) and `stopLatches(taskId)`.

**Idempotency.** A target's attempt and key are persisted before anything is sent; a restart finds
the effect in the target's own record under that key. A definitely rejected source revision
conflict gets a new persisted attempt and key, sent against a refreshed revision; an uncertain one
keeps its key until resolved. Released stops' commands are never resent.

**Capacity (A3).** Acceptance reserves, for every target, one attempt bundle — an operation, a
stored operation and a command settlement (**643,625 logical bytes under the default profile**) —
plus the intent's own growth and its release, and refuses the whole stop (`backpressure`, nothing
written) if any of it does not fit: **no target is dispatched to because an earlier one fit**. Every
accepted attempt then lands, and the stop can be released, at a full repository; a *fresh* attempt
is new admission and may be refused with `IStopResult.capacity`. The reservation is derived from the
records, never stored, and shrinks as attempts land and targets are confirmed. It is large: with 400
plain registrations under the default profile, a stop covers at most 210 of them (pinned by test),
bound by `logical-bytes`.

**Settlement.** Archiving the root of a `satisfied` cancel whose targets are all terminal settles
it, keeping the report and the terminal graph. A blocked cancel is never archived as a successful
stop (`retention-blocked`); a latching pause is released first.

## Host runbook — capacity pressure and a full repository

The limits are finite by design (a finite history horizon; see `docs/design/agent-tasks/`
§ 8.6). There is **no supported deletion, identity reset, compaction or cross-root migration** —
out-of-band file deletion is corruption, not maintenance, and open will report it as such.

1. **Watch.** Poll `repository.capacityStatus()`. `pressure` means some dimension's
   `used + reserved` is at or past 80% of its limit; `limitingRecordIds` names what holds it.
   `draining` means a dimension has no headroom: ordinary growth that needs it is refused with
   `backpressure`. `ICapacityFailure.reclaimableByCleanup` says whether draining could release any
   of it: always for a transient dimension; for a lifetime one only while some task still holds part
   of it as a reservation, whose unspent remainder archiving that task gives back.
   `admission-blocked` means an `indeterminate` claim fences all growth — that is recovery, not
   capacity: close and reopen, and read the recovery report.
2. **Stop new admissions** at your own layer before the repository has to refuse them: stop
   creating tasks, subscriptions and new command attempts. Everything already accepted keeps its
   reservation — completing work, settling accepted commands, acknowledging, disposing, cleanup
   and archive stay callable at a full repository.
3. **Drain what is reclaimable**, in order: finish or cancel accepted tasks; settle commands
   (`resolveCommands`), or abandon those whose outcome will never be known (`abandonCommand`);
   have consumers prepare and acknowledge, abandon stale receipts, and dispose of or close
   subscriptions that will never drain (`dispose`, `closeSubscription`); run `cleanup`; archive
   terminal tasks. `outstanding()` lists each of these. Two things that look stuck and are not:
   a receipt prepared by a process that stopped before acknowledging it is held by nobody and pins
   what it names — **expiry alone does not release it**: an expired manifest stops pinning only when
   the next receipt issue or disposition on that subscription evicts it, and `cleanup` does neither,
   while `outstanding()` still counts it as `pinned` — so find it in the subscription's record
   (`issued`, unacknowledged) and `abandon` it; and at the default 8,000-character context budget an older revision of a
   maximum-size task never fits beside its current one, so it stays owed until a delivery prepares
   with a larger budget or the host disposes of it. Neither is ever dropped. This releases non-archived slots, payload
   and receipt capacity — **not** retained identities, exact acknowledgement/disposition ids or
   operation dedup evidence, which never shrink in v1.
4. **At a lifetime ceiling** (retained tasks, subscriptions, sources, acknowledgement ids,
   operations) the choices are: keep the repository available for reads and drain and accept no
   further growth; or, after reviewing host memory and disk, **raise** the stored limits explicitly
   with `raiseCapacityLimits` — which postpones exhaustion, it does not remove it. A drained
   repository can be closed to release its memory; its files remain valid.
   **Sizing the default.** Under `defaultTaskCapacityProfile`, `logical-bytes` fills first: at most
   536 plain tracked registrations of minimal size — each reserves about 976 KiB for its closeout,
   and larger envelopes, details and ids fill it sooner. `non-archived-tasks` (1,000) is not
   reachable there; `resident-payload-bytes` (384 MiB) would admit about 1,530, and `audience-links`
   / `acknowledgement-ids` (200,000, 224 per registration) 892. A host expecting more concurrent work
   raises those three together, at `initialize` for a new repository or with `raiseCapacityLimits`
   for an existing one; a stored limit can be raised, never lowered. **`raiseCapacityLimits` refuses
   a raise that grows what an existing reservation covers** — the envelope, details or stored-operation
   bound, the audience per update, the evidence or receipt size — because claims already minted would
   no longer cover the work they protect; choose those at `initialize`.
5. **Never** delete record files, edit `repository.json`, or rotate to a new root to "free space":
   each is either corruption open will refuse, or a loss of the obligations and history the
   repository exists to keep.

## Model tools — `createTaskTools`

**Two read-only `AiAssist.IAiClientTool`s over one principal-bound view** by default, ready to hand to
`AiAssist.executeClientToolTurn`: `task_query` (a page of the tasks the view may read, narrowed by
responsible party, parent, lifecycle class or status) and `task_inspect` (one task, its currently
available commands, and its details when the host exposes them). The factory takes an
`IBoundTaskView` — never the broker. Without `mutations`, `stops` or `commands` the tools call only its `query` and
`inspect`; a bound writer can be passed as the view (it is one), and must be, to opt mutations in
(below).

```ts
const view = broker.bindView({ principal: 'agent:ada', scopes, authorization }).orThrow();
const tools = createTaskTools({ view }).orThrow();
const turn = AiAssist.executeClientToolTurn({ descriptor, apiKey, messages, clientTools: tools });
```

- **Nothing the model supplies can widen what it sees.** Neither schema has a principal, scope or
  consumer member; both are closed, so a surplus property fails rather than being ignored; and each
  `execute` re-validates its arguments, because a direct call reaches it with no harness in front.
  Filters only narrow, through the view's own strict request converter.
- **Authority is live.** Building the tools calls nothing on the view. Every call asks the view,
  which asks the host's policy then — a read revoked between two calls hides the task on the second.
- **Bounded by default, not by opt-in.** Tasks reach the model only as `TaskContextRenderer` text
  within `budget.context` (default: 20 items, depth 3, 8,000 characters), never as raw envelopes. A
  page is at most `budget.context.maxItems` tasks. A task on the page that the text omitted or
  abbreviated is **named by id** in `omitted` / `abbreviated`, so paging on `nextCursor` never skips
  a task unannounced. Details come back only when their JSON fits `budget.maxDetailsChars` (default
  4,000), otherwise `detailsOmitted: 'too-large'` and none of them.
- **A failing projector fails the call.** The view's `ITaskProjector` and the renderer's projection
  both fail closed; the tool returns the failure and no partial page. Nothing falls back to a less
  projected value.
- **A failure tells the model a code, never host text.** A failure the view or the rendering reports
  reaches the model as `<tool>: <code>: <fixed description>`; a view that rejects or throws, as
  `<tool>: the task view failed`. The underlying message — a projector's error, a storage detail, an
  exception — goes only to the optional `logger`. Only a failure of the model's own arguments is
  described in full, cut at 500 characters.
  **A view's whole answer is converted before anything reads it**, since any `IBoundTaskView` may be
  passed: a page must be exactly a page (projected items and references, at most the `limit` asked for,
  a well-formed cursor, known completeness and freshness, string issues), an inspection exactly a
  resolved or an unresolved one. An answer that does not convert fails the call; a view's `issues`
  reach the model as one fixed line; an unknown failure code is reported as no code at all.
- **What is framed.** Task state is framed and escaped inside the context text. Details are the host
  projector's JSON, returned beside it as structured data and neither framed nor escaped — a host
  that exposes details chooses their content.
- **Supply `renderer`** built with the broker's converters when the host's field bounds are not the
  defaults: its converters also validate the model's arguments, and a task the view returns must
  never be refused by the renderer.

### Mutation tools — opt-in, and opting in authorizes nothing

Without `mutations` the factory builds exactly `task_query` and `task_inspect`. With it, the host
opts groups in over the **same** binding it reads through:

```ts
const writer = broker.bind({ principal: 'agent:ada', scopes, authorization }).orThrow();
const tools = createTaskTools({
  view: writer, // a writer is a view
  mutations: { writer, environment, enable: ['tracked', 'reassign'] } // environment: the host's TaskEnvironment
}).orThrow(); // task_query, task_inspect, task_create, task_update, task_reassign
```

| group | tool | writer method | the model supplies |
|---|---|---|---|
| `tracked` | `task_create` | `createTracked` | title; optional description, parent id, responsible party |
| `tracked` | `task_update` | `updateTracked` | task id, `expectedRevision`; title, description, progress, `clear` |
| `reassign` | `task_reassign` | `reassign` | task id, `expectedRevision`; a party, or `null` to unassign |

- **`writer` must be the very object passed as `view`** (checked at build time): the revision the
  model reads is the revision the writer checks, under one principal, scope set and policy.
- **Opting in authorizes nothing.** Building the tools touches neither the writer nor the
  environment. Every call is authorized by the writer's policy when it runs — including which
  responsible party a model may name (`targetResponsibility`), which is the policy's to decide.
- **The revision is the model's to read.** `task_inspect` returns the `revision` it read; a change
  passes it back as `expectedRevision`, and the writer refuses it (`conflict`) if the task has moved
  since. The tool never reads a revision on the model's behalf — that would turn the precondition
  into last-write-wins.
- **The model never names an id it could misuse.** Every call's `operationId` and a new task's id are
  minted through `environment`, so a model can neither occupy a key a host pump would mint nor probe
  a hidden task by colliding with its id. Schemas are closed: a model-supplied `operationId`,
  `taskId` (on create), scope, stop policy, lifecycle, attention reference or source binding fails.
- **A writer's receipt is checked like a view's answer**: strictly converted, for the task,
  operation and revision asked about, and — for a reassignment — naming the party asked for. The
  model is told `{ taskId, revision, disposition }` only: never update ids (they say whether anyone
  else is subscribed), never the operation id, never the previous party (it comes from the
  unprojected envelope).
- **An unknown outcome is said to be unknown, with a way to find out.** A writer that throws,
  rejects, fails without a known code, answers with a malformed receipt or reports
  `commit-indeterminate` may already have committed, and each call mints fresh ids, so a blind retry
  of a creation could duplicate it. The model is told the change may or may not have been applied —
  and, for `task_create`, the id the task has if it was created, to inspect before creating it again.
  Naming that id discloses nothing: it was minted, not chosen, and `task_inspect` answers a hidden
  task exactly as a missing one. For an update or reassignment a retry is safe either way: it carries
  the same `expectedRevision`, so it is refused if the change moved the task, and changes nothing if
  the change was a no-op (committed `unchanged`, revision unmoved).
- **Refusals disclose nothing a read would not.** A hidden task, a hidden parent, a foreign id and a
  permitted-to-read-but-not-to-change task all produce the same `not-found-or-denied` line.

**Not here:** `createTaskList`, scope changes, reparenting, list completion, archive, external
registration or source binding, the uncertain-command pump, and any acknowledgement
tool — receipts are the host's, never the model's.

### Command tools — one typed tool per registered command the host names

```ts
const tools = createTaskTools({
  view: writer,
  commands: {
    writer, // the very object passed as view
    registry, // the registry the broker's repository was opened with
    environment, // mints each call's operation id
    enable: [{ kind: 'acme.job', detailVersion: 1, command: 'pause' }]
  }
}).orThrow(); // task_query, task_inspect, task_command_pause
```

- **Typed by the registry.** Each named command is looked up in `registry` when the tools are built
  (an unregistered kind, version or command refuses the set), and its tool's wire schema is
  `{ taskId, expectedRevision, parameters }` with `parameters` the command's **registered** schema —
  `ITaskCommandHandle.parameters` — not an arbitrary payload. Closed at every level the registered
  schema is closed: stated on the wire for Anthropic and OpenAI; Gemini's dialect drops
  `additionalProperties`, so there closure is enforced by validation only — the harness's, then
  `execute`'s, which re-validates every call. The tool sends the parameters as the schema accepted
  them; the writer canonicalizes them, once — through the handle's `validate` for an external kind,
  through the broker's own tracked-command converter for `fgv.tracked@1`.
- **Offering is not authorizing.** Building asks the registry, never the writer, the environment or
  the policy. Every call goes through the writer's `execute`, which asks the policy then: command
  authority revoked after build refuses the next call, and nothing is sent.
- **Only its own kind's command.** A command name is per kind, so the tool inspects the task first
  and sends only to a task of exactly its kind and detail version (both immutable for a task);
  anything else is `unsupported`, and nothing is sent.
- **The model names no key and no precondition.** The tool mints the operation id; the schema has no
  `operationId`, command name, principal, scope or source precondition — a conditional command's
  precondition is the one the broker commits when it dispatches.
- **What the model is told.** `{ taskId, state: 'accepted' }` — recorded for the executor, not that
  it has taken effect (in one race, not even that it has been sent yet) — or `{ taskId, state: 'applied', revision }`. A rejection is a fixed code line:
  `denied` reads exactly as a missing or hidden task; `stop-active`, `invalid-transition` and
  `idempotency-conflict` read as `conflict` (whether or not the stop tools are offered — see below);
  `unsupported` as itself. A source's receipt text and an indeterminate or abandoned reason go to
  `logger`, never to the model.
- **An unknown outcome means: do not send it again.** An `indeterminate` receipt, a malformed
  receipt, a writer that throws, and every writer failure except `not-found-or-denied` read as one
  line — the outcome is not known, the host resolves or abandons it, do not send it again. Once a
  command's intent is recorded the broker may still send it (`resolveCommands`), and later failures
  carry ordinary codes (`conflict`, `invalid`), so the tool cannot tell "nothing recorded" from
  "recorded, not yet sent". **A model resend is a new command under a new key**: a `source-key`
  source deduplicates the *same* key, which is what makes the pump's resend safe and a model's
  unsafe; a `none` command the pump never resends at all — it looks it up, or holds it until the
  host abandons it. An `abandoned` receipt reads as the same unknown line.
- **Names.** Default `task_command_<command>`, with any character a provider rejects replaced by `_`;
  or `name` per command. A name may not be a fixed tool's — `task_query`, `task_inspect`,
  `task_create`, `task_update`, `task_reassign`, `task_stop`, `task_stop_inspect` — whether or not
  that tool is offered, and two
  commands under one name (two kinds registering the same command, say) refuse the whole set at
  build time: the host names one. Never last-one-wins.
- **Coverage:** commands come from the registry, so a kind has command tools exactly when it
  registers commands: external kinds through `ExternalTaskSource.commandHandles`, and
  `fgv.tracked@1`, whose `trackedTaskDescriptor()` registers all eleven transitions (below).
  `fgv.task-list@1` registers none.

#### Tracked commands as tools — what a host is enabling

```ts
const enable = (['start', 'wait', 'resume', 'set-progress'] as const).map((command) => ({
  kind: trackedTaskKind,
  detailVersion: trackedTaskDetailVersion,
  command
}));
// task_command_start, task_command_wait, task_command_resume, task_command_set-progress
```

All eleven are registered; **which a model is offered is the host's `enable` list**, one entry per
command — nothing is withheld at registration, because a schema withheld there would be withheld
from every host, including one driving its own trusted actor. A call moves the task through the
same transition table as `execute` (`applied` with the new revision; `task_inspect` reports the new
status and only the commands now available).

- **References are accepted on syntax alone.** `set-attention`'s list, every reason's `attention`
  (`wait`, `pause`, `fail`, `cancel`) and every outcome's `artifacts` (`succeed`, `fail`, `cancel`)
  are `{ namespace, key }` pairs that nothing resolves: the broker checks identifier syntax, length
  and count, never that a reference names something real. A model can assert a reference it made
  up, and a non-empty `attention` makes the task's baseline delivery category `attention`. I1b
  withheld `attention` from `task_update` for this reason; offering any of those six commands
  (`wait`, `pause`, `succeed`, `fail`, `cancel`, `set-attention`) offers the capability back. Enable them only where the host either supplies every reference the
  model may use or treats a model-asserted reference as untrusted. (`defaultTaskProjector` removes
  outcome artifacts from views; it does not remove `attention`.)
- **`succeed`, `fail` and `cancel` assert a final state on the host's behalf.** A terminal state is
  absorbing — no command leaves it. `succeed` always carries an outcome; `fail` and `cancel` carry a
  reason and *may* carry one. Whatever outcome is sent — its summary and artifacts — is stored as the
  task's result. Enable them where the model's word is the host's record of whether the work was
  done.
- **Two validators, one authority.** The broker validates a tracked command with its own converter,
  never through the registered schema, and that converter is authoritative. The schemas agree with
  it on shape (pinned by fixtures in both directions), but the wire subset has no lengths, patterns
  or ranges, so a schema-valid value can still be refused: an empty or multi-line title, a code
  outside identifier syntax, a `notBefore` that is not canonical `YYYY-MM-DDTHH:mm:ss.sssZ`, a
  negative amount, `total` below `completed`, too many references. The broker records nothing for
  such a value, but the tool reads every writer failure other than a refusal of the task as an
  unknown outcome, so the model is told not to resend (`docs/TECH_DEBT.md`).
- **Inert dispatch values.** Each tracked handle registers `idempotency: 'none'` and
  `conditional: false`. Both describe an external source's dispatch and are read on no native
  path; they are the values that authorize nothing.
- **Empty parameters.** `start` and `resume` take `{}` — an empty closed object on the wire.
  Anthropic and OpenAI receive it as `{ type: 'object', properties: {}, additionalProperties: false }`;
  Gemini receives `{ type: 'object', properties: {} }` (its dialect drops `additionalProperties`),
  and whether Gemini's API accepts a nested object with no properties has not been verified live.

### Stop tools — a model may apply the brakes; only the host lifts them

```ts
const tools = createTaskTools({
  view: writer,
  stops: {
    writer, // the very object passed as view
    environment, // mints each stop's operation id — which is its intentId
    enable: ['pause'] // the modes task_stop offers; [] offers no stop tool
  }
}).orThrow(); // task_query, task_inspect, task_stop, task_stop_inspect

// The model's stop is recorded and its tree frozen; the host carries it out:
await writer.reconcileStop({ taskId, intentId }); // the pump — a host call, never a model tool
```

| broker operation | model tool | why |
|---|---|---|
| `requestStop` | `task_stop` (opt-in, per mode) | records the intent and freezes the tree; dispatches nothing. Authorized by the policy's `stop` on the root at every call |
| `inspectStop` | `task_stop_inspect` | a read; needs only the root to be visible |
| `releaseStop` | **none** | un-freezes admission over a whole subtree, including targets this principal cannot see, and accepts a partial stop as the host's decision. The result names no requester, so a tool could not even restrict a model to its own stops |
| `reconcileStop` | **none** | the host's pump: it dispatches stop commands to external sources. Its timing and repetition are the host's scheduling, exactly as for `resolveCommands` |

- **Schemas.** `task_stop`: `{ taskId, expectedRevision, mode }`, `mode` an enum of exactly the
  modes enabled. `task_stop_inspect`: `{ taskId, intentId, after? }`. Both closed; no operation id,
  limit, principal or scope. `execute` re-validates every call.
- **The intent id is disclosed, and grants nothing.** It is the operation id the tool minted for the
  request, returned so the model can name the stop. Every tool still mints its own operation id, so
  the model can never replay or occupy a key with it; inspecting a stop needs only that its root is
  visible, which the model could already learn. Target command keys and attempt numbers are not
  returned.
- **What the model is told.** `{ intentId, taskId, mode, state, counts, targets, remaining,
  nextAfter?, restrictedWorkRemains }`: `counts` over every visible target by state; `targets` one
  page (at most `budget.context.maxItems`) of `{ taskId, state, confirmedRevision?, violation? }` in
  the stop's order; `task_stop_inspect` with `after: nextAfter` continues. A target that cannot be
  found visible on the page boundary — hidden since, or never a target — reads alike, as
  `cursor-stale`. A hidden target that is not confirmed sets `restrictedWorkRemains`, without counts or
  identities. A capacity refusal is never returned: it goes to `logger`, and the target's own state
  (`unavailable`) says it is blocked.
- **Known and unknown outcomes.** Only `unsupported` (the stop policy does not permit the mode),
  which the broker decides before it writes, is a plain code line. Every other failure may follow an
  accepted stop — `not-found-or-denied` included, when the root is hidden between the commit and the
  presentation — so its line ends with the intent id the stop would have, and an instruction to
  inspect it before asking again. A denied, hidden and missing task still read alike: the same line,
  differing only in the would-be id. A retry is harmless — a second stop of a mode already latched on
  the task is refused.
- **`stop-active` is never disclosed.** Every other tool answers a latch as `conflict` whether or not
  the stop tools are offered: a latch can come from a stop on an ancestor this principal cannot see,
  and no tool's answers depend on which other tools the host enabled.
- **A registered command named like a stop** (`pause`, `cancel`) may be offered beside the stop
  tools. It is a different operation — one task, the kind's own command, `command` authority — and
  the latch still refuses whatever it would do that a stop forbids.

## Rendering task context without a broker

**`TaskContextRenderer` is a complete snapshot-only entry point.** A host hands it
already-authorized task values and gets back bounded framed text, a structured view, an omission
report and a pure inclusion receipt — with no repository, no broker, no clock, no ID factory, no
random source, no checkpoint store and no logger. There is nothing for it to write to, and the
test suite establishes that by spying on the clock, random, crypto and every `fs` function
rather than by comparing state afterwards.

```ts
// Optional: decide what may be disclosed. Here, redact every description.
const projection: TaskContextProjection = (s) =>
  succeed({ envelope: { ...s.envelope, description: undefined } });

const renderer = TaskContextRenderer.create({ projection }).orThrow(); // at setup
const rendered = renderer.render({ tasks, updates, unresolved, completeness: 'complete' }, budget);
rendered.onSuccess((context) => {
  // context.text    — framed, escaped; put it in the prompt
  // context.receipt — keep it alongside the prompt, never inside it
  return succeed(context);
});
```

**Input is validated, then reduced, and conflicts are refused rather than resolved.**
`ITaskContextInput.tasks` is current state (`ITaskSummary`; a snapshot is accepted and its details
discarded, never rendered). Duplicates of one revision — overlapping scope selections — collapse,
keeping the newest observation telemetry. Two different revisions of one task in `tasks`, one
revision described two ways, two updates of one category at one revision, an update newer than
current state, or a task both resolved and unresolved each fail `conflict`: the renderer does not
choose freshness without a declared source contract. Malformed input, a failing projection and a
parent cycle fail `invalid`.

**What a receipt claims is exactly what the text holds.** `ITaskInclusionReceipt` has one entry
per rendered `(taskId, revision)` and lists an update ID only where that update's **complete**
payload was rendered. An item that only fits with its descriptive prose abbreviated keeps its
revision and carries no update IDs; one that does not fit is omitted. Either way a required
update stays owed and is counted in `omissions.requiredUpdates` — never truncated and receipted.
Distinct revisions of one task are distinct entries, so including revision 4 never covers an
omitted revision-3 attention change. A snapshot-only render with no `updates` gets a receipt with
no update IDs: nothing invents event history. A supplied `deliveryId` is echoed, never minted,
never authenticated. The receipt is **canonical** — entries ascending by task then revision,
update IDs ascending, nothing repeated — and `converters.context.receipt` enforces that form.
Producing a receipt writes nothing; the bound delivery service that turns one into an
acknowledgement is a later slice.

**Budgets are honest about their own framing.** `ITaskContextBudget` bounds items, visible-tree
depth and UTF-16 characters of the *whole* text (default 20 / 3 / 8,000). The renderer reserves
the fixed framing plus the longest omission report any rendering can produce
(`renderer.framingReserve`) before selecting anything, and rejects a `maxChars` below it — so the
line saying what was dropped can never itself be dropped. No token count is claimed.

**Selection is deterministic and independent of input order.** Priority: outstanding attention,
terminal outcomes, other material changes, current open work, routine progress, unresolved
diagnostics; ties break on task ID then revision, by ordinal comparison. Omission counts cover
only what was supplied — nothing hidden is counted — and `exhaustive` is true only for complete
input with nothing omitted and nothing abbreviated. Depth is depth in the *visible* forest: a parent that was not
supplied ends the chain rather than being guessed at. **Nothing is aggregated from children** — a
parent's own lifecycle is the only completion statement rendered, so a partial visible tree can
never establish parent completion.

**Task prose is data.** Each item is one JSON record under trusted fixed framing that tells the
model its field values are untrusted and carry no authority. Strings are escaped so no field can
close the frame (`<` `>` `&`), form a Mustache tag (`{` `}`), close a Markdown fence (the
backtick), or smuggle DEL, C1 controls, line/paragraph separators, bidirectional overrides, invisible
formatting characters, variation selectors or Unicode tag characters;
every escape is a `\uXXXX`, so each record still parses back to the original text. Details, the
source binding, scopes and observation timestamps are never rendered. Update IDs go in the
receipt, not the text.

**The projection seam is where disclosure is decided.** `TaskContextProjection` runs on every
task revision before rendering — redact a description, drop artifacts, hide a parent. Its output
is **re-validated** against the same bounds, must keep `id`, `revision` and `kind` (a receipt
must not describe something other than what was rendered), and a failing or throwing projection
fails the render with **no fallback to the unprojected value**. `defaultTaskContextProjection`
removes the source binding and nothing else. Unresolved references get their own seam,
`TaskContextUnresolvedProjection`, with the same contract; its projected `parentId` is the one
the visible tree uses, so a host that hides a parent hides it for diagnostics too. The renderer
accepts an unresolved reference with or without its binding (`IContextUnresolvedReference`), so a
bound view's projected reference renders as it is; a *stored* reference still requires one.

**Also here:** `ITaskSummary`, `ITaskUpdate` (one immutable payload per `(task, revision,
category)`, its snapshot pinned to the revision it names) and `IUnresolvedTaskReference` (a
registration awaiting its first observation — rendered as a diagnostic, never receipted, never
with its binding; `context.diagnostics` is `ITaskContextDiagnostic`, the rendered fields only), with converters on `TaskConverters.context`.

**The common envelope.** `ITaskEnvelope` is what every task carries whatever its kind — branded
`TaskId` / `TaskKind` / `TaskRevision`, a `title` and optional `description`, an optional
`parentId`, a `ParentStopPolicy`, an optional `IResponsibility`, `ITaskScope[]`, the
`TaskLifecycle`, optional `ITaskProgress`, `ITaskReference[]` attention, an optional
`ISourceBinding`, a `RecoveryDeclaration`, `ObservationHealth`, and `createdAt` / `changedAt`
instants. `ITaskSnapshot<T>` pairs it with kind-specific details, which are `JsonValue` at the
heterogeneous boundary and become `T` only through a registered handle.

**Four things version independently, and are spelled separately.** `schemaVersion` (the envelope,
always `1` in v1), `detailVersion` (the kind's detail schema), `ISourceBinding.referenceVersion`
(the source's opaque reference), and the repository storage format. Capacity claims and the
capacity profile carry their own `claimVersion` / `profileVersion` for the same reason.

**The lifecycle is seven states, and each carries what makes it meaningful.** `TaskLifecycle` is
discriminated on `status`: `pending` / `running` carry nothing, `waiting` carries an
`IWaitingReason`, `paused` carries an `ITaskReason`, `succeeded` carries an `ITaskOutcome`, and
`failed` / `cancelled` carry a reason plus an optional outcome. `terminalTaskStatuses` /
`openTaskStatuses` / `isTerminalTaskStatus` name the partition. **Observation health is a separate
union** (`ObservationHealth`) precisely so that a source outage cannot move a task through its
lifecycle — an outage makes the observation `stale` or `unavailable` and nothing else.

**Waiting carries only opaque attention references.** `ITaskReference` is a `(namespace, key)`
pair and nothing more: identity, never permission to dereference. There is **no input-request,
answer, expiry, arbitration or continuation protocol** in this library, by decision rather than
by omission — do not add one downstream by putting a request payload in a reason.

**Classified failures.** `TaskResult<T>` is `DetailedResult<T, ITaskFailure>`; `ITaskFailure`
carries one of fourteen `TaskFailureCode`s, a retry disposition (`safe` / `reconcile-first` /
`after-host-action`), an optional `operationId`, and — for `backpressure` and *only* for
`backpressure`, enforced by the converter — an `ICapacityFailure`. `not-found-or-denied` is
deliberately one code so a foreign identity and a hidden one are indistinguishable;
`commit-indeterminate` says the durable effect may or may not exist and names the operation to
resolve it by.

**Commands are four states that do not collapse into each other.** `CommandState` is `rejected`
(with one of six reasons), `accepted` (intent durably recorded — *not* applied), `applied` (with
the revision it reached), or `indeterminate` (with its reason, keeping the operation ID rather
than degrading into a generic retryable failure). `ICommandRequest` always carries an
`operationId` and an `expectedRevision`; no timestamp is a concurrency token.

**The detail converter runs on every path.** `convert`, `decode` *and* `encode` all validate
through the registered `Converter<T>`: TypeScript cannot stop a JS caller or an assertion handing
over a `T` that violates a domain invariant, so an encoder that trusted its argument would turn
that into a successful snapshot. `detailSchema`, where a kind supplies one, is the wire schema a
model is offered; **registration does not check that the two agree** — agreement is a claim about
every value, and it is established by a registration's own fixtures, as the built-ins' are here.

**The registry erases kinds through converter closures, never casts.** `TaskKindRegistry.create`
returns an independent registry — nothing is registered at import. `register<T>(descriptor)`
stores a `Converter<JsonValue>` built with `Converters.generic` that runs the descriptor's own
converter and re-encodes, and returns an `ITaskKindHandle<T>` whose `decode` / `encode` re-check
kind **and** detail version every time. There is no `get<T>(id)` that trusts a caller-selected
type, duplicate `(kind, detailVersion)` registration fails, `convert()` on an unregistered pair
fails with `unknown-kind-version` rather than being treated as a validated current type, and
`freeze()` closes the registry when a broker opens. `createTaskCommandHandle<P>` is the same
erasure for command parameters: it closes over the descriptor's `JsonSchema` and encoder, so for an
externally executed kind the only way to produce canonical parameters is to have passed that schema.
A native kind's handles (`fgv.tracked@1`'s) expose only the wire schema: the broker converts native
commands with its own converter and never calls their `validate`.

**Built-ins.** `fgv.tracked@1` has *empty strict* details — every field a tracked task needs is
already an envelope field, and a second place to put them would be a second authority. Its eleven
commands are `trackedTaskCommandNames` (narrow transitions plus typed metadata updates; no external
`setStatus`), each registered with a `JsonSchema` parameter schema so it can be offered as a command
tool. `fgv.task-list@1` adds `{ completion: 'manual' | 'all-children-succeeded' }` and registers no
commands — an empty command registry is supported.

**Bounds are constructor-lowerable, never raisable.** `TaskConverters.create({ bounds })` builds
the whole converter set against `ITaskFieldBounds` (title 256, description 4096, summaries 2048,
codes 128, 32 references per field, 64 scopes, 128-byte identifiers). A supplied bound above the
default is a `create()` failure, not a silent clamp. Two converter sets share nothing, so two
hosts in one process cannot see each other's limits. Identifiers use one bounded safe syntax
(`[A-Za-z0-9][A-Za-z0-9._:-]*`) that excludes `/`, `\`, whitespace and control characters — an
ID reaches a record filename and an index key, so it is never a caller-supplied path fragment. Every bounded array (`boundedArrayOf`) checks its length **before** converting any element, so
an oversized input is refused without the per-element work it would cost.

**One instant spelling.** `instant` accepts canonical UTC `YYYY-MM-DDTHH:mm:ss.sssZ` only. It is a
shape check, a platform parse, and an ISO round-trip — the round-trip is what rejects a
well-shaped impossible date like `2026-02-30T00:00:00.000Z` that `Date` would otherwise roll
forward. Zone-free and offset-qualified spellings fail; hosts normalize before this boundary.
**Do not add a date parser or a date dependency for this.**

**Finite capacity (A3).** `ITaskCapacityProfile` is versioned and stored, so a host's changed
defaults cannot silently reinterpret a repository on reopen. It names a limit for each of eleven
`CapacityDimension`s, per-owner sub-limits, and the encoded-size maxima every reservation is
computed from — bytes are canonical UTF-8 lengths, never estimated heap sizes.
`defaultTaskCapacityProfile` publishes the default limits (T8, 2026-09-26); **they are engineering
defaults, not measured safe maxima for a host**, and their remarks say what each admits and which
fills first. `maximumClosureCharges(profile)`, `maximumResolutionCharges(profile)` and
`maximumSettlementCharges(profile)` compute the protected completion, first-resolution and
settlement charges from the profile alone, which is what lets admission reserve room to *finish* accepted work before
accepting it — a ceiling without that room could refuse the terminal write that would free
capacity. Both are `Result`-valued and **fail rather than return an inexact figure** when a
profile's bounds push a product or sum past the safe-integer range: a charge is an admission
input, so "approximately the maximum" is not a usable answer. **Each reserves an update payload at
`maximumUpdateBytes(profile)`, not at `maxUpdateBytes`:** an update is one envelope — bounded by
`maxEnvelopeBytes` — plus fixed framing, so it can never exceed 37,417 bytes under the defaults
however large `maxUpdateBytes` is. **Do not reserve `maxUpdateBytes` for a future update**; it bounds
what storage accepts, not what an update can be.

**A capacity status reports every dimension exactly once.** The converter enforces both halves —
a duplicated row is ambiguous, and a missing one would silently read as a dimension under no
pressure, which is the wrong default for something admission consults.

**Capacity claims are repository-generated data, never caller-issued authority.**
`ITaskCapacityClaim` is discriminated on one of six `CapacityClaimPurpose`s (`allCapacityClaimPurposes`), carries the
identities needed to reconstruct its consumption after a crash (an acknowledgement claim joins by
exact subscription *and* update), and tracks `ownership: 'pending' | 'live'` for the
pending-to-live transfer and `disposition: 'reserved' | 'consumed' | 'indeterminate'` for the
reserved-to-used conversion. `indeterminate` is not a state to clear on sight — ambiguity fences
admission and cleanup until recovery resolves it. **Nothing in the library lets a caller mint
one**, and every request converter is strict, so a caller-supplied `capacityClaims` property is a
conversion failure rather than an overspend.

**Recovery is an explicit union, and it never resumes on its own.** `RecoveryDeclaration`
(`reattach` / `host-resume` / `not-recoverable`) is what a host declares on the envelope;
`RecoveryResult` is what a source answers — `reattached` / `completed` (carrying an
`ISourceProjection`), `resumable` (returning work for explicit host approval), `unrecoverable`,
`unavailable`, or `unresolved`. The last two are deliberately different: the source being down is
not the same as the source answering and being unable to say what became of the work.
`ISourceProjection` carries execution fields only — parent, responsibility, scopes, identity and
the binding stay catalog-owned, so an observation can never rewrite them — and orders itself by an
opaque `ISourceRevision`, never by observation time and never by sorting tokens lexically.

**Source-replay must declare a finite envelope.** `SourceHistoryDeclaration` is a union, not a
flag plus an optional field, so a `source-replay` declaration without an
`ISourceReplayEnvelope` — remaining required updates and bytes — is not representable. Finite
storage cannot reserve an unbounded sequence of required external events; reject the stronger
guarantee rather than admitting it. The envelope's counts are non-negative rather than positive —
it is supposed to be able to shrink to zero as accepted work finishes. `observed-state` keeps the
weaker latest-snapshot contract.

**Injected seams.** `TaskEnvironment.create({ logger, clock, newId })` validates the host's
`Logging.ILogger`, `() => number` clock and `() => Result<string>` ID factory. Nothing constructs
a logger or reads a clock at construction time. `now()` canonicalizes the clock into an `Instant`
and fails rather than producing a bad one; `newTaskId()` / `newOperationId()` /
`newSubscriptionId()` mint through the library's converters, so a factory producing a path
fragment is caught at the mint rather than at the filename.

## Not in scope

No prompt integration **yet** — that is a later slice (I2), and its absence from the export surface
is deliberate. No model tool releases a stop or runs the stop pump, by design (see *Stop tools*). Explicit abandonment of a blocked cancel is not built (see
`docs/TECH_DEBT.md`). **Permanently** out of scope: an input-request/answer protocol, a task runner or
scheduler, an executor, a retry policy, cross-repository parenting, execution migration,
multi-process ownership, general event sourcing, and dependency DAGs.

---

## Recent additions

*Newest first. **Generated** — see the repo index; do not hand-edit inside the markers.*

<!-- BEGIN GENERATED: recent-additions -->

*No stream has recorded a `sourceLine` against this package yet.*

<!-- END GENERATED: recent-additions -->
