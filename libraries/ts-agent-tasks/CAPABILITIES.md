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

Three things: the **vocabulary** (the `types` and `converters` packlets), the **snapshot-only
context entry point** (the `context` packlet), and **durable task storage** (the `storage`
packlet: `FileTreeTaskRepository`). The broker, indexed queries, delivery, tools and prompt
integration follow in later slices, and are deliberately absent from the export surface rather
than stubbed.

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
// Afterwards:
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

Every replacement keeps all operation evidence with its request unchanged, keeps every retained
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
its callback returns fails. A replacement that succeeded stays committed if the callback later
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
`register-external`), that its first operation is its creation evidence, that a pending entry with
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

No broker, indexed query or paging, due discovery, subscription, delivery service,
acknowledgement, retention or pruning policy, cascade stop, tool factory or prompt integration
**yet** — those are later slices, and their absence from the export surface is deliberate. The
repository reads records on demand; resident query indexes are the next slice's. **Permanently** out of scope: an input-request/answer protocol, a task runner or
scheduler, an executor, a retry policy, cross-repository parenting, execution migration,
multi-process ownership, general event sourcing, and dependency DAGs.

---

## Recent additions

*Newest first. **Generated** — see the repo index; do not hand-edit inside the markers.*

<!-- BEGIN GENERATED: recent-additions -->

*No stream has recorded a `sourceLine` against this package yet.*

<!-- END GENERATED: recent-additions -->
