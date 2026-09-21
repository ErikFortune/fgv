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
- Validation and stale/duplicate-answer handling if the input-request primitive ships.

The FileTree default is settled. Its commit mechanics, lifecycle names, and
consumer-checkpoint retention are open design gates in the library proposal,
not implementation details to discover
after consumers rely on them. The chat application's human-priority gate likewise cannot
be deferred while enabling uncontrolled main-room task wakeups.

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
4. Ask a typed clarification, accept it through the host API, and continue.
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
bindings, scoped views, and input requests.
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

**Extension preserved:** durable task/request identity, generic respondent
references, typed responses, and delivery-independent request ownership.
**Trigger:** the chat application or another host implements a durable human inbox.
An answer from another authorized context is valid without building any of these
transports into FGV.

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
