# Agent tasks — FGV library design

**Status:** proposal for discussion; not an implementation contract or a shipped capability.
**Date:** 2026-09-21.
**Source baseline:** FGV `9c309985077a201b2bf3c873c23684f7ecabe7af`.
**Proposed package:** `@fgv/ts-agent-tasks` (name subject to approval).

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
- Human answers can arrive independently of the original conversation or device.
- FGV remains generally useful independently of the multi-agent chat adoption.

The concrete shapes and defaults below are recommendations. Section 14 identifies
the decisions that still need to be settled before implementation.

## 2. Layers and consumption modes

| Layer | Responsibility | Must not assume |
|---|---|---|
| Task values | Validated, serializable snapshots, relationships, progress, requests, outcomes | A running implementation or a backing store |
| Scoped views and presentation | Select authorized tasks; compose bounded context and detail | A chat or automatic model invocation |
| Broker | Resolve identities, bind sources, validate and route commands, reconcile observations | Ownership of execution |
| Task implementations | Execute or track work; own execution truth and supported operations | A particular prompt or delivery channel |
| Storage and observation | Persist configured records and checkpoints; expose updates and gaps | Distributed transactions or exactly-once effects |
| Integrations | ai-assist tools and prompt-assist fragments | Installation of the reference chat application |

Support two entry levels:

**Snapshot-only:** a consumer supplies an already scoped collection of validated
task snapshots. It gets the common renderer and structured view without starting
a broker, registering implementations, or configuring storage. It owns freshness,
authorization, and persistence. The library makes no live-observation guarantee
for a static collection.

**Broker-backed:** a consumer binds implementations and repositories, obtains an
authorized view, and optionally subscribes to changes. Tools and prompts consume
that view. Persistence, observation, and commands are capabilities, not necessary
conditions for rendering a task list.

The same snapshot format crosses both modes. A simple integration should not have
to imitate the broker's infrastructure to use the presentation layer.

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
| Pending interactions | References to requests for input or decisions |
| Observation health | Freshness, availability, and last successful observation, separate from lifecycle |

Identifiers and scope references are generic. A host may use agent, user, chat,
project, or job scopes without adding those concepts to FGV's closed type system.
Task identity must remain unchanged when the task appears in multiple scopes.

### Lifecycle and observation are different

Proposed lifecycle vocabulary: `pending`, `running`, `waiting`, `paused`,
`succeeded`, `failed`, and `cancelled`. Not every implementation supports every
transition. `waiting` carries a reason, such as required input or an unavailable
prerequisite. These names are provisional, but the distinctions are important.

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
- Cancelling a parent does not silently cascade to children.
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

## 4. Implementations and extension model

Prefer interfaces and composition over a mandatory base class. A consumer can
wrap an existing class, use an object implementing the contract, or implement a
new task kind. Subclassing can be a convenience, not the extensibility mechanism.

Separate three registrations:

1. **Kind descriptor:** detail converter/schema, presentation hooks, and typed
   command/input descriptors.
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
| Submit an interaction response | Receipt identifying the winning response or refusal |

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
No arbitrary `setStatus` operation is offered for externally authoritative tasks.
For tracked tasks, compare-and-update semantics prevent stale agent turns from
overwriting newer changes within the supported writer model. General distributed
claims/leases are not included in that promise.

## 6. Scopes, responsibility, and control

Keep four relationships independent: parentage, responsibility, visibility, and
authority to act. Sharing a task does not establish who owns its next step.

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

## 7. Requests for human or agent input

Represent an input request independently of its delivery channel. It has a stable
request ID, task ID, request revision, intended respondent/audience, typed response
contract, prompt/context, and state such as pending, answered, withdrawn, or expired.
Approval is one possible response type; a choice or free-text clarification is
another. Runtime validators are registered, not serialized as functions.

Any authorized endpoint can submit a response using the request identity. The
originating conversation is optional provenance, never a condition that the
original chat still be alive. Authentication and mobile/inbox delivery are host
responsibilities.

Accept a response only while the request is applicable. Concurrent answers are
resolved by the request owner's atomic/serialized acceptance boundary; a stale
answer cannot overwrite the winner. Withdrawal, expiration, and supersession are
explicit. No response is not equivalent to refusal, and an answered question is
not automatically a completed task.

The task implementation interprets the accepted answer. Its continuation follows
the same durable command rules as other work: recording the answer and later
applying it must not lose the outstanding continuation on restart. This is a
primitive response protocol, not a human inbox or workflow engine.

## 8. Persistence and recovery

### Three separate capabilities

1. **Serializable representation:** every published task snapshot and durable
   request/receipt can be represented as validated data.
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

The repository accepts an injected FileTree directory. The host selects and opens
the adapter at its composition root; repository logic does not branch on runtime,
take native filesystem paths, or bypass FileTree with direct filesystem APIs.
The default does not mean choosing a storage location or writing files implicitly
when a consumer only asks to render task snapshots.

Use in-memory FileTree adapters for tests and explicit session-only operation,
exercising the same repository implementation as persistent adapters. Memory-only
storage still cannot promise survival across process restart. Alternative host
repositories implement the same contracts and declare their supported guarantees.

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
archive, and explicit removal must not erase owed responses or undelivered
required outcomes without an explicit disposition policy.

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
input requested/resolved, result available, or recovery/observation issue. A raw
storage timestamp is insufficient because maintenance writes need not be salient.
The host owns wakeup urgency and may coalesce intermediate progress. It must not
silently coalesce away a pending question or required terminal outcome.

Durable delivery is opt-in per consumer/subscription and at-least-once, not
exactly-once. Stable identities allow duplicate suppression. Persisted consumer
checkpoints are distinct from task data and are reauthorized when used. A newly
created subscription establishes its starting snapshot/checkpoint explicitly;
it does not imply delivery of every historical event to every future reader.

Diagnostic observers can be best-effort. An obligation-bearing subscription
cannot use observer exceptions as a reason to discard owed delivery. Explicit
gaps, backpressure, and retention failures are part of its Result surface.

## 10. Prompt composition

Provide a structured context builder and default text fragments for:

- Current tasks and relevant child summaries.
- Material changes since the consumer's acknowledged view.
- Pending input requests and other attention requirements.

Selection is deterministic and bounded by configurable item/depth/text budgets.
Unknown totals stay unknown. Omitted visible items are reported, not treated as
absent; omitted items are not acknowledged. Restricted tasks and children are
not included in omission counts. Required attention takes precedence over routine
progress, with tools/direct APIs available for further inspection.

Context preparation returns fragments plus an inclusion receipt identifying the
actual task revisions, update IDs, and request revisions included. It has no
acknowledgement side effect. A later acknowledgement advances only those entries;
an update arriving during the model call remains pending. A maximum revision
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

## 11. ai-assist tools and package boundaries

Provide a factory over a bound scoped view/broker, following the existing
[memory-tool factory](../../../libraries/ts-agent-memory/src/packlets/tools/memoryTools.ts)
pattern. The initial useful surface is list, inspect, create/update tracked work,
invoke an advertised command, and respond to an input request. Mutating tools are
explicit opt-ins; read-only tools should be usable independently.

Use [ai-assist client-tool contracts](../../../libraries/ts-extras/src/packlets/ai-assist/toolTypes.ts)
and typed `JsonSchema` validators. Kind-specific commands have registered schemas;
do not expose an unvalidated arbitrary command payload. Prefer statically
described tools from the registry, with live authorization/capability checks at
execution. Bound outputs use the same projection policy as prompt fragments.

The host still owns multi-round tool execution, provider selection, budgets,
continuations, and whether a reactive turn may use mutation tools. This proposal
requires no provider protocol changes and no new ai-assist agent loop.

Proposed packlets: types/converters, implementations, broker/views, storage,
context, tools, and prompt integration. These names are organizational suggestions.
Core logic uses ts-utils and ts-json-base; integration packlets can depend on
ts-extras and ts-prompt-assist in the existing family pattern. No dependency on
the reference chat application, native storage, React, or agent-memory is necessary.
Keep runtime initialization out of module imports. A separate adapter package is warranted
only if concrete dependency/runtime costs require it.

Converters validate persisted records, source observations, registered detail,
commands, and responses at boundaries. Reuse published primitives for identifiers,
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
6. Create an input request; answer through a different authorized host context.
7. Reopen durable state and reconcile recoverable, completed, and unrecoverable work.

This is a small executable example plus contract/journey tests, not a resident
agent product. A fuller showcase agent is discussed in [deferred considerations](deferred.md#simple-fgv-showcase-agent).

Acceptance includes invalid/cyclic nesting, cross-source children, partial views,
unauthorized reads/commands, revoked subscription access, stale revisions,
duplicate responses, unsupported commands, ambiguous external submission,
truncated prompt receipts, model/host failure before acknowledgement, source
outage, terminal recovery, corrupt records, and crash windows around durable
acceptance and update delivery. Meaningful tests must meet repository coverage
requirements; live model output is supplementary, not the correctness oracle.

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
- **Only snapshots:** cannot by itself preserve required outcomes/requests through
  gaps, especially when tasks leave the active set.
- **Copy ingestion into a generic runner first:** creates avoidable migration risk;
  adapt its authoritative implementation instead.
- **Require every task to restart:** impossible for some work; require honest
  recovery reporting rather than fictional resumability.

## 14. Decisions to close before implementation

These are gates, not silently approved defaults:

1. Approve package placement/name and the initial built-in implementation set.
2. Finalize the public lifecycle, command receipt, and recovery-result unions.
3. Specify commit/recovery mechanics for the default FileTree repository and the
   first supported backend's durability guarantees; prove the crash windows before
   advertising them. The choice of FileTree as the default is already settled.
4. Specify source revisions and reconciliation completeness, including terminal
   discovery, relationship metadata, and catalog/projection migration on reopen.
5. Finalize the smallest durable consumer-checkpoint/retention protocol that meets
   the observation contract without building a general message broker.
6. Confirm the input-request primitive belongs in the initial library delivery
   rather than only a reserved extension; this draft recommends including it.

The chat application's room scheduling, human-priority policy, and rollout are separately
gated in its adoption proposal. They must not become prerequisites for using or
testing the FGV library on its own.
