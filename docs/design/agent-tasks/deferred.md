# Agent tasks — explicitly deferred considerations

**Status:** future design space, not current implementation scope.
**Date:** 2026-09-21.
**Companions:** [FGV library design](fgv-library.md), [multi-agent chat adoption](multi-agent-chat-adoption.md).

Deferral does not mean prohibition. The core should leave an appropriate extension
point without implementing speculative infrastructure. Conversely, a correctness
requirement cannot be labelled future work while advertising the guarantee it
would make true.

## Not deferred if the corresponding capability ships

- Honest distinction between task failure and inability to observe a task.
- Stable identities and validated serialization.
- Authorization on views, tools, commands, and subscribed delivery.
- Parent/child integrity and explicit parent-completion semantics.
- Durable acceptance/recovery for any mode advertised as durable.
- FileTree as the default persistence implementation, not a deferred adapter.
- Explicit inclusion receipts and acknowledgement for delivery-aware context.
- Reconciliation of owed outcomes after interruption.
- Correct validation of inclusion receipts and isolation of consumer checkpoints.
- Available prompt-composition analysis and verified cache ordering/breakpoint plans.

The FileTree default is settled. Its commit mechanics, lifecycle names, and
consumer-checkpoint retention are open design gates in the library proposal,
not implementation details to discover after consumers rely on them. FileTree's
existing synchronization probe is useful but does not certify crash-safe commits.
The chat application's human-priority gate likewise cannot be deferred while
enabling uncontrolled main-room task wakeups.

## Input-request and response protocol

**Deferred from the initial delivery after FGV review.** Tasks can report waiting
for input and reference a host-owned interaction. FGV does not initially create
or answer requests, arbitrate concurrent responses, or guarantee recovery between
answer acceptance and continuation. Acknowledging a task-context update never
answers the referenced question.

**Why deferred:** the standalone task broker is useful without this protocol,
and all four ingestion adoption journeys and their acceptance criteria can be
satisfied without it. Request lifecycle plus answer-to-continuation durability
would add a second substantial obligation protocol and crash-test surface. This
is not a restriction that all future FGV capabilities must be justified by ingestion.

The future design should preserve the original intent:

- A stable request ID, task ID, request revision, intended respondent/audience,
  and typed answer contract; approval, choice, and free text are possible kinds.
- A lifecycle distinguishing pending, answered, withdrawn, expired, and superseded
  requests, with no response distinct from refusal.
- Answers accepted from any authorized context; the original chat/device is
  provenance rather than a required live endpoint.
- Validation against the still-applicable request, an atomic/serialized winning
  answer boundary, and idempotent handling of duplicate submissions.
- Explicit durable coordination between accepting an answer and applying the
  task continuation, so a crash between them does not lose owed work.
- Task completion independent of request resolution, and no runtime validators
  serialized as executable functions in stored data.

**Extension preserved now:** stable task IDs, generic responsibility/scope
references, waiting reasons, and opaque host-owned attention references. These
do not freeze the future request schema or advertise typed answer APIs today.

**Trigger:** a concrete consumer needs FGV-owned request/response semantics beyond
host-owned interaction references. At that point validation, stale/concurrent
answers, withdrawal, and continuation crash recovery are required acceptance
criteria, not optional followups. A human inbox is not required to adopt this
future protocol and remains a separate transport/UI concern below.

## Simple FGV showcase agent

**Motivation:** a small agent could be both a proving ground and an understandable
demonstration of the family: dynamic prompt composition, scoped task context,
typed tools, and optionally knowledge/memory. It would validate that the library
is useful outside the reference chat application rather than merely matching its interfaces.

**Proposed separation:** ship deterministic task examples and integration tests
with the library first. Consider a separate, opt-in showcase agent afterward or
as an explicitly approved companion effort. Do not make the library depend on
the showcase or turn the showcase into the library's hidden orchestration layer.

A useful small demonstration could:

1. Let a user ask the agent to create a short nested plan.
2. Attach a simulated background operation through the normal task adapter.
3. Recompose prompt fragments as scope and task status change.
4. Display a waiting task with a host-owned clarification reference. A typed
   answer/continuation demonstration follows only when the deferred request
   protocol is implemented, or is clearly labelled as host-owned behavior.
5. Show the difference between current state, outstanding updates, and acknowledgement.
6. Reopen durable tasks and explain recovery outcomes.

Keep the task source simulated by default so the example is deterministic and
does not need external accounts. A live model mode can demonstrate ai-assist;
its credentials and spend are explicit. Inspect the existing testbed/example
infrastructure before choosing a new CLI/app package.

**Why deferred:** the user has raised the idea for consideration, not requested
another agent product. UI, conversation history, provider setup, budgets, and
long-running execution could readily exceed the task-library scope.

**Trigger:** explicit agreement on the smallest demonstration and its home.
It should exercise exported APIs only; a need for private hooks is feedback on
the library design. Knowledge retrieval is an optional later scenario, not a
prerequisite for showcasing tasks.

## Autonomous planning and collective execution

Defer plan generation, automatic decomposition, scheduling, agent selection,
delegation policies, multi-agent negotiation, and automatic follow-through.
The broker supports representations and commands; a host/agent decides to use them.

**Extension preserved:** nested tasks, responsibility references, implementation
bindings, scoped views, and waiting/attention references. FGV-owned input requests
remain subject to the separate deferral above.
**Trigger:** a real workflow requiring a specific policy, tested independently
of task storage/presentation.

## Distributed claims, leases, and transactional workflows

Do not generalize the chat application's ingestion lease into a universal distributed
execution protocol. Defer multi-process claiming, fencing, cross-task atomic
transactions, compensating transactions, and exactly-once external effects.

**Extension preserved:** revision preconditions, command identities/receipts,
source capability declarations, and explicit authoritative ownership.
**Trigger:** competing writers or external operations whose safety requires those
guarantees. Single-writer implementations must state their limits now.

## Dependency graphs and sophisticated aggregation

The first task structure is a tree, not a general workflow DAG. Defer dependencies,
multiple parents, conditional branches, optional-child policy languages, weighted
progress across arbitrary work, and cascading cancellation/retry orchestration.

**Extension preserved:** stable task references and explicit list-policy semantics.
**Trigger:** concrete workflows that cannot be represented by nested tasks plus
implementation-owned behavior. A display tree does not claim execution ordering.

## Durable human inbox and multiple delivery channels

Defer inbox UI, phone/push/email delivery, reminders, escalation schedules,
multi-human quorum decisions, and cross-device authentication plumbing.

**Extension preserved:** stable task identity and host-owned attention references
now; channel-independent request identity, respondent references, and typed
responses are requirements for the separately deferred request protocol.
**Trigger:** the chat application or another host implements a durable human inbox.
The eventual protocol must allow an answer from another authorized context without
building any of these transports into FGV. Deferring the inbox does not implicitly
include the request protocol in the initial task library.

## Long-lived jobs independent of chats

The generic model already permits a job/project scope and requires no conversation
ID. Defer a concrete long-lived-job service, lifecycle UI, retention administration,
and routing between old and new conversations.

**Extension preserved:** opaque scopes, durable identities, reattachment, and
audience-specific presentation checkpoints.
**Trigger:** a host adopts work that outlives its current interactive session.

## Application-wide migration and broader reactive autonomy

The adoption proposal is ingestion-focused. Defer migrating all background
subsystems of the reference chat application, replacing its notification
architecture, and allowing task reactive turns to initiate arbitrary cross-room exchanges.

**Extension preserved:** reusable adapters and task-change provenance.
**Trigger:** ingestion adoption proves the contracts and a subsequent subsystem
has a concrete need. Broader autonomy needs deliberate authority and runaway-loop
controls; the current reactive restrictions are not a permanent FGV limitation.

## Task UI and additional transports

Defer a generic dashboard, React components, MCP task server, HTTP task service,
distributed event bus, and remote-control protocol.

**Extension preserved:** serializable values, direct APIs, typed command schemas,
and presentation helpers. FGV must remain usable without a server.
**Trigger:** a consumer needs a specific transport or reusable UI, rather than
adding them to make the package feel complete.

## Complete event history, audit, and retention products

Durable current state and required outstanding updates do not imply an immutable
audit log of every progress tick. Defer full event sourcing, history compaction
tooling, compliance-grade audit, and cross-source global ordering.

**Extension preserved:** source revisions, stable update identities, explicit
observation guarantees, gaps, and checkpoints.
**Trigger:** a consumer needs historical reconstruction or audit beyond operational
recovery. Required delivery cannot silently expire under a best-effort ring-buffer
policy while this work remains deferred.

## Domain-specific task implementations

Defer production download managers, deployment tasks, recipe workflows, knowledge
curators, and other executors. A simulated external task is enough to prove the
adapter contract; the chat application's ingestion adapter remains consumer-owned.

The chocolate application is explicitly out of scope. It provides a portability
test for the design: a single recipe assistant should not need room principals,
multiple agents, ingestion leases, or the chat application's vault to use FGV tasks.

**Trigger:** a reusable implementation is demonstrated by actual demand. Promote
shared behavior only when it is genuinely domain-independent.
