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

Six things: the **vocabulary** (the `types` and `converters` packlets), the **snapshot-only
context entry point** (the `context` packlet), **durable task storage** (the `storage` packlet:
`FileTreeTaskRepository`), **indexed selection** over that storage — scope/lifecycle queries,
due candidates and owed updates answered from resident indexes, with keyset paging, a staged
rebuild and a reusable conformance suite for custom repositories — and the **broker**
(`TaskBroker`): principal-bound views and writers, tracked work and task lists, hierarchy and
reassignment, with authorization at every read and mutation — and **external sources**
(`ITaskSource`, `ExternalTaskSource`): observation, paged reconciliation, recovery and command
dispatch for work a source executes, with the source owning execution truth. Delivery, tools and
prompt integration follow in later slices, and are deliberately absent from the export surface
rather than stubbed.

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
inventory now so their absence is detectable; this release validates only their header
(`ITaskRecordHeader`) and never writes them.

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
an `initialObservation`. An update owed to no one is not retained; subscriptions arrive later.

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
(`sourceReplay: { remainingRequiredUpdates, remainingRequiredBytes }`), reserved at admission;
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

**Capacity.** Each in-flight external command holds a settlement reservation (64 KiB of resident
payload at the default profile) until it settles; see `docs/TECH_DEBT.md` for the effective
ceiling this implies.

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
the visible tree uses, so a host that hides a parent hides it for diagnostics too.

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
erasure for command parameters: it closes over the descriptor's `JsonSchema` and encoder, so the
only way to produce canonical parameters is to have passed that schema.

**Built-ins.** `fgv.tracked@1` has *empty strict* details — every field a tracked task needs is
already an envelope field, and a second place to put them would be a second authority. Its eleven
command **names** are `trackedTaskCommandNames` (narrow transitions plus typed metadata updates;
no external `setStatus`); their parameter schemas belong to the slice that implements the
transitions. `fgv.task-list@1` adds `{ completion: 'manual' | 'all-children-succeeded' }`.
An empty command registry is supported.

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
`defaultTaskCapacityProfile` publishes the proposed initial limits; **they are engineering
defaults, not measured safe maxima.** `maximumClosureCharges(profile)` and
`maximumSettlementCharges(profile)` compute the protected completion and settlement charges from
the profile alone, which is what lets admission reserve room to *finish* accepted work before
accepting it — a ceiling without that room could refuse the terminal write that would free
capacity. Both are `Result`-valued and **fail rather than return an inexact figure** when a
profile's bounds push a product or sum past the safe-integer range: a charge is an admission
input, so "approximately the maximum" is not a usable answer.

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

No subscription, delivery service, acknowledgement, retention
or pruning policy, cascade stop, tool factory or prompt integration **yet** — those are later
slices, and their absence from the export surface is deliberate. **Permanently** out of scope: an input-request/answer protocol, a task runner or
scheduler, an executor, a retry policy, cross-repository parenting, execution migration,
multi-process ownership, general event sourcing, and dependency DAGs.

---

## Recent additions

*Newest first. **Generated** — see the repo index; do not hand-edit inside the markers.*

<!-- BEGIN GENERATED: recent-additions -->

*No stream has recorded a `sourceLine` against this package yet.*

<!-- END GENERATED: recent-additions -->
