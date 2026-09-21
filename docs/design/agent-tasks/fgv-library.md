# Agent tasks — FGV library design

**Status:** proposal for discussion; not an implementation contract or a shipped capability.
**Date:** 2026-09-21.
**Source baseline:** FGV `9c309985077a201b2bf3c873c23684f7ecabe7af`.
**Proposed package:** `@fgv/ts-agent-tasks` (name subject to approval).

**FGV review incorporated:** the initial delivery excludes the input-request
protocol; inclusion receipts are pure values in both consumption modes; core and
integrations ship in one package. FileTree capability checks and prompt-cache
composition checks are explicit implementation gates below.

**Consumer review incorporated:** indexed scoped queries are a repository contract;
waiting reasons may carry `notBefore`; the ingestion reference adapter is
observation-only. Explicit parent stop policies are proposed with an unresolved
coordination gate, not an implicit cascade or a guarantee that dispatch means stopped.

This is the first of three documents:

1. **This document:** the standalone FGV capability.
2. [Multi-agent chat adoption](multi-agent-chat-adoption.md): a proposed consumer integration, not FGV implementation scope.
3. [Deferred considerations](deferred.md): future possibilities, their boundaries, and revisit triggers.

## 1. Purpose and design stance

Provide a common representation and broker for nested tasks performed by agents,
humans, or external implementations. Make those tasks easy to inspect, control
where authorized, and include proactively in agent context.

The library does not run an agent loop, schedule work, implement downloads, or
decide when a human or agent should speak. An implementation knows how to perform
its work; the broker mediates observations and commands. A task that an agent
updates explicitly and a task that runs independently share the same model.

A multi-agent chat application is the demanding reference consumer, not the
architecture of the library. No core contract requires a room, conversation,
session, principal, memory vault, notification inbox, model provider, or multi-agent deployment.
A single agent or an ordinary workflow must be able to use this directly.

The chocolate-recipe application is context for this portability requirement,
not a second integration to design or implement here.

### Requirements established in discussion

- Nested tasks; a task list is a task containing other tasks.
- Agent-managed and self-managed/external work in one representation.
- Pluggable implementations, predefined useful implementations, and scoped views.
- Consistent FGV Result, converter, schema, and dependency conventions.
- Prompt fragments that keep an agent aware of current work and relevant changes.
- Persistent tasks where required; loss of execution must not silently erase work.
- FileTree is the default persistence abstraction, following established FGV usage.
- Future human answers must be independent of the original conversation or device;
  the input-request protocol itself is deferred from the initial delivery (§7).
- FGV remains generally useful independently of the multi-agent chat adoption.

The concrete shapes and defaults below are recommendations. Section 14 identifies
the decisions that still need to be settled before implementation.

## 2. Layers and consumption modes

| Layer | Responsibility | Must not assume |
|---|---|---|
| Task values | Validated, serializable snapshots, relationships, progress, attention references, outcomes | A running implementation or a backing store |
| Scoped views and presentation | Select authorized tasks; compose bounded context and detail | A chat or automatic model invocation |
| Broker | Resolve identities, bind sources, validate and route commands, reconcile observations | Ownership of execution |
| Task implementations | Execute or track work; own execution truth and supported operations | A particular prompt or delivery channel |
| Storage and observation | Persist configured records and checkpoints; expose updates and gaps | Distributed transactions or exactly-once effects |
| Integrations | ai-assist tools and prompt-assist fragments | Installation of the reference chat application |

Support two entry levels:

**Snapshot-only:** a consumer supplies an already scoped collection of validated
task snapshots. It gets the common renderer and structured view without starting
a broker, registering implementations, or configuring storage. It owns freshness,
authorization, and persistence. Rendering also returns a pure inclusion receipt:
a description of the supplied task revisions actually included, not a stored
checkpoint or proof of delivery. The consumer can ignore it or use it in its own
checkpoint mechanism. The library makes no live-observation or durable-delivery
guarantee for a static collection.

**Broker-backed:** a consumer binds implementations and repositories, obtains an
authorized view, and optionally subscribes to changes. Tools and prompts consume
that view. Persistence, observation, and commands are capabilities, not necessary
conditions for rendering a task list. The broker's acknowledgement service
validates inclusion receipts against a bound consumer/subscription and updates
its configured checkpoint store; the renderer neither owns nor writes that store.

The same snapshot and inclusion-receipt formats cross both modes. Live change
identities are included only when supplied; snapshot-only rendering does not
invent event history. A simple integration should not have to imitate the
broker's infrastructure to use the presentation layer.

## 3. Common task model

Use a serializable task envelope plus validated, kind-specific detail. Runtime
objects, callbacks, abort controllers, credentials, and live connections do not
belong in the envelope.

| Concept | Proposed meaning |
|---|---|
| Task identity | Stable branded identifier, independent of process and presentation location |
| Kind and schema version | Open registered kind; versioned detail serialization |
| Title and description | Human/agent-readable account of the work, treated as data |
| Lifecycle | Common status plus structured reason where needed |
| Progress | Optional phase, completed amount, total, unit, and detail; unknown total is valid |
| Revision | Stable ordering/deduplication token for the view; not a wall-clock timestamp |
| Parent | Optional task identity; children are queried through the relationship model |
| Responsibility | Optional actor/role reference, distinct from the executing implementation |
| Scopes | Opaque host-defined associations used for selection, not implicit permission grants |
| Execution binding | Implementation/source identity and a serializable reference, when bound |
| Recovery declaration | How the implementation can recover or be reattached |
| Outcome | Optional bounded summary and artifact references, not an unbounded result payload |
| Attention references | Optional opaque references to host-owned input/decision workflows; no FGV request lifecycle in the initial delivery |
| Observation health | Freshness, availability, and last successful observation, separate from lifecycle |

Identifiers and scope references are generic. A host may use agent, user, chat,
project, or job scopes without adding those concepts to FGV's closed type system.
Task identity must remain unchanged when the task appears in multiple scopes.

### Lifecycle and observation are different

Proposed lifecycle vocabulary: `pending`, `running`, `waiting`, `paused`,
`succeeded`, `failed`, and `cancelled`. Not every implementation supports every
transition. `waiting` carries a reason, such as required input or an unavailable
prerequisite. These names are provisional, but the distinctions are important.

A waiting reason may include an optional `notBefore`: a validated absolute instant
with an unambiguous time zone. It is an eligibility constraint, not a deadline,
timer, retry schedule, or promise to run. The host can query waiting tasks whose
instant is at or before a supplied cutoff; other waiting prerequisites may still
prevent execution. Absence does not mean immediately due, and passing the instant
does not change task status automatically. The field and due query belong in the
common model/repository, avoiding a second host store keyed by task identity.

`paused` can likewise carry a structured reason. A host's stuck detector or other
policy can produce that reason and the corresponding lifecycle/attention change;
its classifier, prompt, budget, and decision policy do not belong in FGV. The
authoritative implementation must actually apply/report the pause: storing a
verdict alone must not claim that externally running work has stopped.

A failed status query does not make the task failed. Preserve the last known
snapshot and report that observation is stale or unavailable. A task with no
usable snapshot remains an explicitly unresolved reference, not a fabricated
running task. Missing implementation code is likewise not proof of execution
failure.

An implementation-confirmed unrecoverable interruption becomes a failed task with
an explanation. Terminal tasks are retained until an explicit retention/archive
policy applies. Execution attempts may change while task identity remains stable;
automatic retry is not a broker default.

Progress does not imply success. Reaching a numeric total may still require
verification or finalization. Lease renewal and liveness checks are not necessarily
semantic progress changes.

### Nesting

The initial relationship is a tree: at most one parent per task; cycles and
self-parenting are rejected. A dependency DAG is a separate future capability.
References rather than recursively embedded records avoid duplicate task truth.

A parent may have its own work as well as children. Therefore:

- Child completion does not automatically complete an ordinary parent.
- A failed child does not automatically fail or cancel siblings.
- Pausing/cancelling a parent does not silently cascade; an explicit parent policy
  may request it under the coordination contract below.
- Child counts are not a meaningful percentage for arbitrary work.
- A partial or access-filtered child view cannot establish parent completion.

An explicit task-list preset can offer an all-required-children-succeeded policy
when the list has no independent work. That policy evaluates an authoritative
child set, not the reader's visible subset. Changes to a terminal list require an
explicit supported operation; adding a child does not silently reopen it.

Cross-implementation nesting is required: an agent-managed plan can contain an
external task. Relationship metadata has one declared owner (the broker catalog
for broker-owned associations); it need not be written into the external system.
Such metadata must not become a competing authority for execution status.

### Explicit parent stop policies — coordination gate

Allow a parent implementation/preset to declare `none` (the default),
`cascade-pause`, or `cascade-cancel`, analogous to an explicit task-list completion
policy. These are proposed policy semantics, not capabilities every task acquires
by having children. Evaluate them over the authoritative child set, never the
calling agent's possibly partial display tree. The exact descendant rule and
interaction with nested policies must be settled before exposing these presets.

The policy coordinates supported commands; each implementation still executes
its own work. Parent membership is not authority to control a child. Recheck the
host-supplied authority for every affected command, including resumed dispatch.
A parent stop holder may have host-delegated control distinct from visibility,
but the library does not infer or persist that grant from the relationship.

Before claiming a cascade complete, the contract must account for unsupported
operations, refused or unreachable children, accepted-but-pending commands,
confirmed outcomes, and partial effects. An observation-only child may make the
requested guarantee impossible; it must not be silently skipped or marked paused.
An accepted parent stop request is distinct from achieving the requested stop
across all relevant work, including any work of the parent itself.

A durable stop also needs persisted intent/reconciliation and a rule for children
added or reparented while it is pending or after it has taken effect. A true
standing stop requires admission enforcement by the authoritative parent/host;
traversing yesterday's child list is insufficient. This is not an atomic
distributed transaction and does not undo already applied child commands.

Gate #9 closes these semantics and the initial implementation scope. Do not ship
a naive fan-out under the name of a reliable stop switch. A consumer can provide
its own parent implementation meanwhile, but its coordination/recovery guarantees
remain its responsibility, not implied guarantees of the adapter helper.

## 4. Implementations and extension model

Prefer interfaces and composition over a mandatory base class. A consumer can
wrap an existing class, use an object implementing the contract, or implement a
new task kind. Subclassing can be a convenience, not the extensibility mechanism.

Separate three registrations:

1. **Kind descriptor:** detail converter/schema, presentation hooks, and typed
   command descriptors and their parameter schemas.
2. **Source/implementation binding:** read state, execute supported commands,
   optionally observe changes and reconcile/recover existing work.
3. **Task registration/catalog metadata:** stable identity, source reference,
   relationships, and host-approved scope associations.

For a download task, the consumer registers a typed download detail and wraps its
download service. The service owns transfer execution, cancellation, and recovery.
FGV exposes its common task state and advertised commands. Download-specific
fields such as bytes transferred stay typed detail or common progress, not new
fields added to every task.

### Initial supplied implementations

- **Tracked task:** explicitly updated by an authorized agent or host. Suitable
  for plans, checklist items, and work carried out during an agent's own turns.
- **Task-list preset:** the same task infrastructure with explicit list completion
  policy; no separate task-list identity model.
- **External-source adapter helper:** assists projection and command forwarding to
  an existing service; does not implement an external executor.

The external helper must support sources that publish updates and sources the
host polls. A source that can only provide its latest state cannot promise a
complete intermediate-event history.

## 5. Commands, concurrency, and Results

The broker checks current authorization, validates typed input, checks revision
preconditions where applicable, and routes a command to the authoritative owner.
It does not set external status optimistically merely because it forwarded a
request.

Conceptual operations (names are illustrative, not frozen TypeScript APIs):

| Operation | Result value |
|---|---|
| Read/list a scoped view | Snapshots plus explicit completeness/freshness information |
| Register a task or bind an existing source task | Stable task reference and accepted durability |
| Execute a supported command | Receipt identifying acceptance, rejection, or known application |
| Reconcile a source | Observed updates and explicit unresolved items/gaps |
| Prepare task context | Structured context, rendered fragments, inclusion receipt, omissions |
| Acknowledge presented updates | Checkpoint result limited to the supplied receipt |

Fallible operations use `Result<T>`/async Result conventions; classified failures
use the established detailed-result pattern when callers must branch. Return
useful result values rather than new `Result<void>` APIs. Construction that can
fail uses factories. Exceptions at third-party boundaries are captured and
contextualized, not used as business control flow.

Distinguish:

- Transport or validation failure of the command operation.
- A valid request refused by policy, capability, or revision precondition.
- An accepted asynchronous command whose effect is pending.
- A command confirmed applied by its authority.
- An indeterminate outcome after a connection loss.

Cancellation accepted is not cancellation completed. A repeatable command carries
an identity/idempotency key where its implementation supports deduplication.
Neither a Result failure after an ambiguous external submission nor a broker
restart is permission to replay a non-idempotent command blindly.

Capabilities are filtered for the current caller and rechecked at execution.
An empty command set is a valid implementation: an external task can be useful
solely for observation. Internal recovery methods do not automatically become
agent-callable commands.
No arbitrary `setStatus` operation is offered for externally authoritative tasks.
For tracked tasks, compare-and-update semantics prevent stale agent turns from
overwriting newer changes within the supported writer model. General distributed
claims/leases are not included in that promise.

## 6. Scopes, responsibility, and control

Keep four relationships independent: parentage, responsibility, visibility, and
authority to act. Sharing a task does not establish who owns its next step.

Authority-to-act is supplied by host policy and rechecked for each command, not
an FGV-issued stored grant. Persisted responsibility, scope associations, command
receipts, or parent policies do not preserve permission after revocation. Hosts
may persist their own grants or delegation policies behind the authorization
interface; that is not a fifth authorization relationship owned by this library.

A scoped view is a union of host-authorized selections, deduplicated by task
identity. It is not prompt-assist's ordered fallback chain. Scope hierarchies,
membership inheritance, and permissions come from host policy; opaque scope
labels themselves grant nothing.

The consumer supplies a bound access context/view. Tools cannot widen that context
by supplying another actor ID or scope name. Reads, child traversal, commands,
subscriptions, and prompt rendering use the same enforcement boundary. Long-lived
subscriptions must recheck access before delivery; old membership is not an
everlasting grant. Errors and counts must not disclose hidden tasks.

The host chooses whether acknowledgements belong to an actor, an actor in a
particular context, or another consumer identity. There is no global `read` flag
on a shared task. An acknowledgement identifies presentation to that consumer,
not comprehension, human approval, or completion of an obligation.

The first version does not arbitrate which agent claims a shared task. It supports
explicit responsibility metadata and host-authorized changes. That leaves the
collective-work policy open without making the representation unusable.

## 7. Input requests — deferred protocol, supported waiting state

The initial delivery can represent a task waiting for input, with a structured
reason and an optional opaque reference to a host-owned interaction. It can expose
that attention requirement in scoped views and context. The host owns answering
and continuation; the task implementation reports any resulting state change.
Neither displaying nor acknowledging the reference resolves the interaction.

FGV does not initially provide request creation/answer tools, a request lifecycle,
typed answer registration, concurrent-answer arbitration, expiry/supersession, or
durable answer-to-continuation coordination. A host may integrate its own workflow,
but that does not acquire FGV recovery guarantees merely by being referenced.

This deferral closes the original §14 gate #6. The standalone tracked/external
task capability is useful without a second durable response protocol, and none
of the initial ingestion adoption journeys requires one. The reason is bounded
scope and correctness cost, not a rule that ingestion determines every FGV feature.

The future protocol must support answers from any authorized context, independent
of the originating conversation/device. Its proposed semantics and revisit trigger
are retained in [deferred considerations](deferred.md#input-request-and-response-protocol).

## 8. Persistence and recovery

### Three separate capabilities

1. **Serializable representation:** every published task snapshot, command
   receipt, inclusion receipt, and checkpoint can be represented as validated data.
2. **Durable registration:** the task's identity, binding, latest recoverable
   representation, and outstanding obligations survive the owning process.
3. **Execution recovery:** the implementation can reattach, resume, retry under
   policy, or establish that continuation is impossible.

Serialization is universal; durable storage is a declared mode; restartability is
an implementation capability. Persisting an object does not make its execution
restartable.

Support explicit session-only use for lightweight consumers. It must be labelled
as such at construction/registration and cannot claim crash survival. A durable
registration returns success only after its promised durable acceptance boundary.
Within the durable profile, accepted tasks never disappear silently. A task whose
execution is unrecoverable retains a failed record rather than being dropped.

### Repositories and authority

**FileTree is the default persistence implementation, confirmed in discussion.**
Use the abstraction from `@fgv/ts-json-base`, with a repository interface for
consumers that need to adapt an existing store. This is the normal supported path,
not an optional persistence backend postponed until after an in-memory-only release.
FGV persistence must not require installing agent-memory, a vector store, or
the reference chat application.

The repository contract is the primary integration surface; the FileTree
implementation is a supplied default, not a mandatory storage migration. A host
repository must meet the same query, consistency, and recovery contracts.

The repository accepts an injected FileTree directory. The host selects and opens
the adapter at its composition root; repository logic does not branch on runtime,
take native filesystem paths, or bypass FileTree with direct filesystem APIs.
The default does not mean choosing a storage location or writing files implicitly
when a consumer only asks to render task snapshots.

Use in-memory FileTree adapters for tests and explicit session-only operation,
exercising the same repository implementation as persistent adapters. Memory-only
storage still cannot promise survival across process restart. Alternative host
repositories implement the same contracts and declare their supported guarantees.

Use the existing FileTree capability vocabulary at construction and commit
boundaries rather than inventing a parallel task-specific accessor taxonomy:

- `isMutableAccessors` checks the mutation interface; also check the configured
  root/items are writable. Implementing mutation methods does not by itself mean
  a particular instance or item allows writing.
- `isPersistentAccessors` checks for the explicit `syncToDisk`, `isDirty`, and
  `getDirtyPaths` interface. For buffered adapters using that interface, await
  successful synchronization at the promised acceptance boundary; an in-memory
  mutation alone is not durable acceptance.
- Binary and strict-text probes apply when the chosen format requires those
  capabilities, not as blanket prerequisites for every task repository.

**The persistence probe is not a generic survival or transaction guarantee.**
The [filesystem adapter](../../../libraries/ts-json-base/src/packlets/file-tree/fsTree.ts)
writes through without implementing the explicit synchronization interface;
rejecting it solely because `isPersistentAccessors` returns false would be wrong.
Conversely, the [localStorage adapter](../../../libraries/ts-web-extras/src/packlets/file-tree/localStorageTreeAccessors.ts)
implements synchronization by writing files individually; passing the probe does
not promise atomic multi-file commits or crash recovery. A failed probe is not
proof that an adapter is memory-only, and a successful probe is not enough to
establish the repository's durability contract.

The composition root binds supported commit behavior using these existing
interfaces and documented backend guarantees. If a missing guarantee needs a new
capability, resolve it in FileTree rather than bypassing it with filesystem calls
or silently assuming stronger semantics in the task repository.

### Initial backend and scoped FileTree dependency

The first supported durable backend is the Node filesystem adapter,
`FileTree.FsFileTreeAccessors` in `ts-json-base`'s `fsTree.ts`. In-memory FileTree
adapters remain the session-only/test option. Supporting other persistent adapters
is a later qualification effort, not an implicit initial-delivery promise.
The Node path writes through, so the `isPersistentAccessors` synchronization
interface is not exercised by its production commit path; it cannot close the
initial crash-safety gate.

At the inspected baseline, `saveFileContents` and `saveFileBytes` call bare
`fs.writeFileSync`, with no temporary-file replacement or explicit filesystem
flush. An interrupted overwrite can leave a truncated record. Reporting that
record as unreadable is honest recovery reporting, but is not a substitute for
protecting a previously accepted task from a torn update.

**Scope an additive atomic/durable-write capability in FileTree as an upstream
dependency of the task repository's durable delivery.** Do not discover this as
an unplanned task-library workaround during crash testing. `ts-json-base` is a
stable surface: design the extension additively, preserve existing callers, and
avoid silently strengthening/changing every ordinary save operation's semantics.
The concrete API and capability probe are to be designed in FileTree; task code
uses the abstraction, never its own filesystem calls.

Specify two guarantees separately:

- **Atomic replacement:** a reader/recovery path sees a complete previous or new
  committed record, not a partially overwritten one. The expected Node mechanism
  is a same-filesystem temporary write followed by atomic replacement, with an
  explicit orphan-temporary recovery policy.
- **Durable acknowledgement:** define the supported fault model, including whether
  success promises survival of process failure only or also OS/power failure.
  Atomic replacement alone does not establish the latter. The Node design must
  address flushing file contents and the containing directory entry, ordering
  those steps before acknowledgement, supported platform/filesystem behavior,
  and explicit failure when the requested guarantee cannot be provided.

This primitive does not create a multi-file transaction. The task repository
must still arrange task state and its owed-update metadata into a recoverable
commit unit, using one atomic record or an explicitly designed commit protocol.
Gate #3 must specify creation as well as replacement, failure before/after
replacement and before acknowledgement, restart handling, and retention of the
last accepted state. Process-crash tests alone must not be presented as proof
of power-loss durability.

### Task authority and repository commit protocol

Native tracked tasks have one repository authority. External tasks retain their
source authority; the broker may durably keep catalog metadata and a derived
last-known projection. A projection is explicitly a cache, not another place to
change external lifecycle state.

Each durable integration must close the save/notify gap by one of:

- Atomically retaining an update obligation with the authoritative task change.
- A durable source cursor/change feed that can be replayed.
- A complete reconciliation query, including terminal tasks, that reconstructs
  every obligation the integration promises to preserve.

Listing only active work cannot recover a completion that happened during an
outage. Latest-snapshot reconciliation can recover current status, but cannot
promise intermediate milestones the source discarded. The advertised observation
contract must state that distinction.

The default abstraction is settled; its commit protocol remains an implementation
gate. FileTree spans backends with different guarantees, not a blanket promise of
atomic multi-file writes, compare-and-swap, or multi-process safety. The initial
writer model should be single-writer, with validated recoverable commits and
explicit backend requirements. Do not advertise a durable adapter before crash
tests prove those requirements. A store that cannot meet them fails configuration
rather than silently degrading to memory-only behavior.

### Indexed queries are a repository contract

Every repository implementation must support indexed selection by
`(scope, lifecycle-class)`, not merely provide a list operation whose default
implementation scans all retained records. Initially `open` means non-terminal
(pending/running/waiting/paused) and `terminal` means succeeded/failed/cancelled;
exact-status filtering refines those classes. Open does not mean actively executing.

Provide authorized multi-scope union queries, deduplication by task ID, and
bounded/paged results. Index waiting eligibility by `notBefore` as well, so a host
can query due candidates at a supplied instant without scanning task history or
maintaining a separate scheduler-owned task catalog. This query schedules nothing
and does not imply all other prerequisites are met.

The contract is behavioral, not an exposed in-memory map implementation:

- Warm indexed selection must not enumerate/read historical task records. Its
  work must not grow linearly with unrelated retained terminal history.
- The FileTree default maintains derived query metadata in memory, sufficient
  to answer hot open-work summary queries without per-query record-file reads.
  Detailed bodies may be loaded separately for selected tasks. A custom indexed
  database or host store can satisfy the same query contract differently.
- Successful native mutations update query-visible scope/lifecycle/due membership
  before returning success. Removal and scope changes cannot leave stale entries.
- Indexes are derived, rebuildable state, not competing task authority. Initial
  open/recovery may rebuild them; a rebuilding or failed index is explicitly
  unavailable/degraded, never a healthy empty list. Persisting an index is optional;
  correctness after an interrupted record/index update is not.
- Queries report the revision/freshness/completeness they actually know. An
  external-source projection can lag its source; an index does not make that
  projection an authoritative lock or write-admission decision.

Terminal delivery obligations remain independently discoverable; an open-work
index cannot replace the owed-update/checkpoint machinery. Access checks still
apply after indexed candidate selection, including traversal, counts, and paging.
Snapshot-only collection rendering may scan its supplied collection; it is not
advertised as an indexed repository.

### Recovery outcomes

| Finding | Required behavior |
|---|---|
| External work is still running | Reattach/observe; do not start another copy |
| Checkpoint and recovery capability are available | Host-authorized resume through the implementation |
| Work already finished | Reconcile the outcome and outstanding updates |
| Implementation establishes execution cannot resume | Record failure with a recovery reason |
| Source temporarily unreachable | Retain last-known status and report uncertainty |
| Kind/implementation unavailable | Retain identity/raw durable data; expose an unresolved recovery issue |
| Durable data invalid or unreadable | Surface a storage/recovery error, never an empty healthy task list |

Opening a repository does not automatically authorize external side effects.
The host invokes recovery/reconciliation under its execution policy. Retention,
archive, and explicit removal must not erase undelivered required outcomes or
outstanding attention records without an explicit disposition policy. Host-owned
interactions retain their own lifecycle and retention authority.

## 9. Observation, attention, and acknowledgement

Maintain three independent concepts:

- **Task state:** what is happening or happened.
- **Attention/obligation:** what someone needs to decide or do.
- **Presentation checkpoint:** which updates were successfully presented to a
  particular consumer under the host's acknowledgement policy.

Expose both current snapshots and structured changes. Subscriptions notify the
host; they never invoke a model or open a conversation themselves. A host without
subscriptions can query/reconcile on its own schedule.

Changes identify task/source revision and semantic category: progress, lifecycle,
attention changed, result available, or recovery/observation issue. A raw
storage timestamp is insufficient because maintenance writes need not be salient.
The host owns wakeup urgency and may coalesce intermediate progress. It must not
silently coalesce away an outstanding attention requirement or required terminal
outcome. Reporting a host-owned interaction's attention state is not implementing
its request/response protocol.

Durable delivery is opt-in per consumer/subscription and at-least-once, not
exactly-once. Stable identities allow duplicate suppression. Persisted consumer
checkpoints are distinct from task data and are reauthorized when used. A newly
created subscription establishes its starting snapshot/checkpoint explicitly;
it does not imply delivery of every historical event to every future reader.

Checkpoint ownership belongs to the acknowledgement service, not the renderer.
In broker-backed mode the service owns updates through an injected checkpoint
store. In snapshot-only mode the host owns any checkpoint policy and storage;
the library only returns inclusion data. No hidden broker store is required to
render or use that data.

Diagnostic observers can be best-effort. An obligation-bearing subscription
cannot use observer exceptions as a reason to discard owed delivery. Explicit
gaps, backpressure, and retention failures are part of its Result surface.

## 10. Prompt composition

Provide a structured context builder and default text fragments for:

- Current tasks and relevant child summaries.
- Material changes since the consumer's acknowledged view, when supplied by a
  broker or host-owned comparison mechanism.
- Waiting reasons and references to host-owned attention requirements.

Selection is deterministic and bounded by configurable item/depth/text budgets.
Unknown totals stay unknown. Omitted visible items are reported, not treated as
absent; omitted items are not acknowledged. Restricted tasks and children are
not included in omission counts. Required attention takes precedence over routine
progress, with tools/direct APIs available for further inspection.

Context preparation in both modes returns fragments plus a pure, immutable
inclusion receipt identifying the actual task revisions and any supplied update
IDs included. Attention references are covered by the containing task revision;
the initial library does not issue request revisions. The receipt records
inclusion, not delivery, authorization, or permission to mutate a checkpoint.

Snapshot-only hosts may ignore the receipt or apply their own checkpoint policy.
The broker acknowledgement service accepts it only through the bound consumer/
subscription context, validates its provenance and included identities/revisions,
and advances only those entries in the configured checkpoint store. A foreign or
fabricated receipt must not acknowledge work outside that context. Replaying a
valid receipt is idempotent and cannot consume newer revisions. This is a
host-facing operation, not an agent tool for declaring arbitrary updates read.

Rendering has no acknowledgement side effect. An update arriving during the model
call remains pending; omitted items remain unacknowledged. A maximum revision
across a truncated result set is not an adequate receipt.

The host decides its successful-processing boundary. A committed turn is one
choice, not a library requirement. Deliberate abstention can have its own
explicit policy; an aborted call cannot count as delivery. This avoids endless
retries of an intentional non-contribution without equating it to a failed call.

Render task titles, descriptions, results, and external text as data. Trusted
framing is supplied separately; quoted task content is not elevated into system
instructions. Host-approved attention policy can ask the agent to inspect or
respond without adopting arbitrary instructions embedded in a result.

For prompt-assist, use existing resource/literal bindings and substitutions.
Provide reusable fragment descriptors/templates and a small integration helper,
with status slots declared per-request for cache stability. Do not add a task
query engine or execution callbacks to `PromptLibrary.resolve`. Resolve dynamic
task data before prompt composition; keep receipts alongside, not inside, text.

### Prompt-cache ordering and verification

Task context is highly volatile. Declaring its slots per-request is necessary but
does not protect stable content placed after it. Put dynamic task context after
the intended stable prefix; do not interleave routine progress into that prefix.
The default templates/example must demonstrate this ordering. Hosts own final
placement and must preserve trust framing as well as cache behavior.

Request composition metadata and use the existing `analyzePromptCacheStability` /
`IPromptComposition.cacheFindings` diagnostics. Verify the plan produced by
`toCacheRequest` against the actual system body sent to ai-assist; appending or
reordering content after analysis must not invalidate its offset assumptions.
These APIs inspect declared composition stability, not actual provider cache hits.

An empty findings array is not sufficient evidence: it is also returned when
composition is unavailable. Acceptance requires an available composition, no
unexplained `cache-hostile-ordering` or task-slot stability-refutation findings,
and the expected stable-prefix breakpoints. Other findings, such as an unknown
token threshold, are evaluated separately rather than demanding an indiscriminately
empty diagnostics array. Progress-only changes must preserve the intended stable
prefix and its breakpoint plan in the tested integration.

## 11. ai-assist tools and package boundaries

Provide a factory over a bound scoped view/broker, following the existing
[memory-tool factory](../../../libraries/ts-agent-memory/src/packlets/tools/memoryTools.ts)
pattern. The initial useful surface is list, inspect, create/update tracked work,
and invoke an advertised command. Input-request/answer tools are deferred.
Mutating tools are explicit opt-ins; read-only tools should be usable independently.

Use [ai-assist client-tool contracts](../../../libraries/ts-extras/src/packlets/ai-assist/toolTypes.ts)
and typed `JsonSchema` validators. Kind-specific commands have registered schemas;
do not expose an unvalidated arbitrary command payload. Prefer statically
described tools from the registry, with live authorization/capability checks at
execution. Bound outputs use the same projection policy as prompt fragments.

The host still owns multi-round tool execution, provider selection, budgets,
continuations, and whether a reactive turn may use mutation tools. This proposal
requires no provider protocol changes and no new ai-assist agent loop.

**One package is the chosen initial topology**, including tools and prompt
integration packlets. The closest sibling, `ts-agent-memory`, already ships its
tools packlet in-package; use that precedent rather than opening a speculative
adapter-package split. The exact package name remains subject to approval.

Proposed packlets: types/converters, implementations, broker/views, storage,
context, tools, and prompt integration. These names are organizational suggestions.
Core logic uses ts-utils and ts-json-base; integration packlets can depend on
ts-extras and ts-prompt-assist in the existing family pattern. No dependency on
the reference chat application, native storage, React, or agent-memory is necessary.
Keep runtime initialization out of module imports. A future package split would
require new concrete evidence, not remain an initial implementation gate.

Converters validate persisted records, source observations, registered detail,
commands, and receipts at boundaries. Reuse published primitives for identifiers,
FileTree access, logging, schemas, and collections; no custom copies. Inject
logging, clocks, and ID generation where needed for testability.

## 12. Standalone proving ground and acceptance

The initial proof should be deterministic and usable without API credentials:

1. Create a tracked plan with children through the ordinary public API.
2. Attach a simulated self-managed task as one child through the external adapter.
3. Compose two overlapping scoped views without duplicating shared task identity.
4. Feed those views through default fragments and ai-assist tool definitions.
5. Advance external progress while one view is in flight; acknowledge only the
   included revisions and show that the newer update remains pending.
6. Show a waiting task with a host-owned attention reference without requiring
   an FGV request/response service.
7. Reopen durable state and reconcile recoverable, completed, and unrecoverable work.
8. Render the same snapshots without a broker; verify that inclusion receipts
   require no store and that rendering changes no checkpoint.
9. Resolve a prompt-assist composition, verify its cache diagnostics and
   `toCacheRequest` plan, then change only progress and verify the stable prefix.
10. Exercise actual commands on the tracked and simulated external implementations:
    accepted versus applied, refusal, unsupported operation, duplicate submission,
    revoked authority, and ambiguous outcome. The ingestion reference adapter
    advertises no commands and therefore cannot validate this surface for FGV.

This is a small executable example plus contract/journey tests, not a resident
agent product. A fuller showcase agent is discussed in [deferred considerations](deferred.md#simple-fgv-showcase-agent).

Acceptance includes invalid/cyclic nesting, cross-source children, partial views,
unauthorized reads/commands, revoked subscription access, stale revisions,
duplicate command submissions, unsupported commands, ambiguous external submission,
truncated prompt receipts, model/host failure before acknowledgement, source
outage, terminal recovery, corrupt records, and crash windows around durable
acceptance and update delivery. Meaningful tests must meet repository coverage
requirements; live model output is supplementary, not the correctness oracle.

Durability acceptance includes the real Node FileTree path, not only in-memory
fixtures: interrupt creation/replacement at the defined commit boundaries,
recover orphan temporary state, preserve the last accepted record, and reconcile
owed updates after restart. Test flush/replace failures against the declared
fault model without claiming stronger hardware/power-loss guarantees than proved.

Explicit adversarial scope-widening tests are required, beyond ordinary denial
tests: model-generated actor/scope overrides, foreign task IDs, hidden child
traversal, and changed membership must not widen the bound view or reveal hidden
counts. Foreign/fabricated inclusion receipts must not advance another consumer's
checkpoint, and replaying one's own receipt must not consume a later update.
Exercise both tool schemas and execution-time enforcement; prompt instructions
alone are not the security boundary.

Cache acceptance must positively establish composition availability, test the
relevant ordering/refutation findings, and inspect breakpoint offsets. Also test
that an unavailable composition with empty `cacheFindings` cannot pass that gate.

Index acceptance grows retained terminal history while holding the open set fixed
and counts record reads/candidate visits, not just wall-clock timings. Verify
scope/status/due changes, paging, deduplication, rebuild after interrupted writes,
and explicit degraded queries. Test `notBefore` at either side of the cutoff,
absence, and remaining non-time prerequisites; querying never starts a task.

Any supplied cascading-stop preset additionally needs authoritative-child-set,
unsupported-child, revoked-authority, partial-effect, restart, and child-admission
tests under the semantics settled by gate #9. An observation-only adapter does
not become controllable because it is placed under such a parent.

## 13. Alternatives and rationale

- **Mandatory task subclasses:** rejected as the primary extension model because
  existing executors should not be rewritten to inherit an FGV base class.
- **A universal workflow runner:** outside this capability; execution and scheduling
  remain with the host or implementation.
- **Agent-owned versus external task as incompatible record hierarchies:** not
  necessary; responsibility and execution binding capture the distinction without
  making the reading agent's perspective part of task identity.
- **One global task-read flag:** cannot represent independent participants or views.
- **Only events:** cannot reconstruct current context for a new consumer.
- **Only snapshots:** cannot by itself preserve required outcomes/attention changes through
  gaps, especially when tasks leave the active set.
- **Copy ingestion into a generic runner first:** creates avoidable migration risk;
  adapt its authoritative implementation instead.
- **Require every task to restart:** impossible for some work; require honest
  recovery reporting rather than fictional resumability.

## 14. Decisions to close before implementation

These are the remaining implementation gates, with the original gate #6 retained
to record its explicit deferral rather than leave it appearing unresolved:

1. Approve the package name/location and initial built-in implementation set. One
   package with integration packlets is settled.
2. Finalize the public lifecycle, command receipt, and recovery-result unions.
3. **First durable backend: Node `FileTree.FsFileTreeAccessors` (`fsTree.ts`).**
   Scope and design an additive atomic/durable-write FileTree capability before
   implementing the task repository's durable commit path (§8). Existing bare
   `writeFileSync` saves are insufficient protection against interrupted overwrite;
   `isPersistentAccessors` does not participate in this backend's commit path.
   Specify atomic replacement, the acknowledged durability/fault model, required
   flush ordering and platform support, and recovery across creation/replacement
   and acknowledgement boundaries. Define the task-state/owed-update commit unit;
   single-file atomicity does not imply a multi-file transaction. Prove the
   declared crash windows before advertising the guarantee. FileTree and the
   initial backend choice are settled; the additive API/protocol remains the gate.
4. Specify source revisions and reconciliation completeness, including terminal
   discovery, relationship metadata, and catalog/projection migration on reopen.
5. Finalize the smallest durable consumer-checkpoint/retention protocol that meets
   the observation contract without building a general message broker.
6. **Closed — defer the input-request protocol.** Initial scope includes waiting
   reasons and host-owned attention references, not answer arbitration or durable
   continuation. See §7 and the deferred document.
7. Fix task-context placement in the default composition and verify availability,
   cache findings, and the `toCacheRequest` breakpoint plan. Preserve the stable
   prefix under progress-only updates; §12 makes this an acceptance gate.
8. Specify the indexed repository query API, lifecycle-class/status filters, due
   selection, pagination, consistency/freshness results, and rebuild behavior.
   Indexed scoped selection and no history-scan hot path are requirements for all
   repositories, not optional FileTree optimizations (§8).
9. Settle the proposed `cascade-pause`/`cascade-cancel` parent policies and their
   initial implementation scope: authoritative descendants, per-command authority,
   unsupported/refused children, partial outcomes, durable stop intent, and
   admission/reparenting during or after a stop. Do not imply universal support
   or a completed stop from command dispatch alone (§3).

The receipt ownership choice is also settled: inclusion receipts are pure values
in both modes; a broker acknowledgement service owns checkpoint mutation when
wired, and snapshot-only hosts own any equivalent mechanism. Gate #5 concerns
the detailed storage/validation/retention protocol, not that ownership split.

The chat application's room scheduling, human-priority policy, and rollout are separately
gated in its adoption proposal. They must not become prerequisites for using or
testing the FGV library on its own.
