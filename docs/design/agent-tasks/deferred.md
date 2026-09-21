# Agent tasks — explicitly deferred considerations

**Status:** future design space, not current implementation scope.
**Date:** 2026-09-21.
**Companions:** [FGV library design](fgv-library.md), [development design](development-design.md), [multi-agent chat adoption](multi-agent-chat-adoption.md).

Deferral does not mean prohibition. The core should leave an appropriate extension
point without implementing speculative infrastructure. Conversely, a correctness
requirement cannot be labelled future work while advertising the guarantee it
would make true.

## Not deferred if the corresponding capability ships

- Honest distinction between task failure and inability to observe a task.
- Stable identities and validated serialization.
- Authorization on views, tools, commands, and subscribed delivery.
- Parent/child integrity and explicit parent-completion semantics.
- Explicit host-authorized responsibility reassignment without replacing task
  identity or moving its canonical record between assignees' storage.
- Durable acceptance/recovery for any mode advertised as durable.
- FileTree as the default persistence implementation, not a deferred adapter.
- The additive FileTree atomic/durable-write dependency for the initial Node
  filesystem backend; its guarantees and repository commit protocol are gate #3.
- Explicit inclusion receipts and acknowledgement for delivery-aware context.
- Reconciliation of owed outcomes after interruption.
- Correct validation of inclusion receipts and isolation of consumer checkpoints.
- Indexed scope/lifecycle queries and honest query freshness; no full-history
  scan on the broker repository's hot open-work path.
- Available prompt-composition analysis and verified cache ordering/breakpoint plans.

The FileTree default is settled. The [development design](development-design.md)
resolves the proposal's commit, lifecycle, and consumer-checkpoint gates; those
contracts still require implementation and qualification. The approved durability
boundary includes process-crash survival and excludes OS-crash and power-loss
survival. FileTree's existing synchronization probe is useful but does not certify
crash-safe commits.
The chat application's human-priority gate likewise cannot be deferred while
enabling uncontrolled main-room task wakeups.

## Additional persistent backends

The first qualified durable backend is Node `FileTree.FsFileTreeAccessors`;
in-memory trees remain supported for tests/session-only operation. Defer qualifying
browser storage, HTTP-backed trees, archives, and other persistent adapters for
the task repository's durable profile. Their availability through FileTree does
not automatically establish the required commit/recovery guarantees.

**Extension preserved:** injected FileTree roots and existing capability/
synchronization interfaces, plus the additive atomic/durable-write capability
designed for the Node delivery. Keep the contract backend-neutral rather than
making the task library branch on adapter classes.
**Trigger:** a consumer needs another persistent backend. Qualify its acceptance,
sync, atomicity, and recovery semantics against the same declared fault model;
do not treat `isPersistentAccessors` alone as certification.

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

The [execution-helper follow-up](#optional-execution-helpers-and-bounded-agent-runners)
can use this showcase as its second host after exploring the reference app's
foreground and background paths. Sharing that proving ground does not make
either follow-up a prerequisite for the broker.

**Why deferred:** the user has raised the idea for consideration, not requested
another agent product. UI, conversation history, provider setup, budgets, and
long-running execution could readily exceed the task-library scope.

**Trigger:** explicit agreement on the smallest demonstration and its home.
It should exercise exported APIs only; a need for private hooks is feedback on
the library design. Knowledge retrieval is an optional later scenario, not a
prerequisite for showcasing tasks.

## Optional execution helpers and bounded agent runners

**Intent:** explore reusable helpers for task invocation, progress reporting,
scheduling, recovery, and bounded model/tool execution after the broker. These
are plausible FGV capabilities, not responsibilities that every application must
forever implement itself. This entry records a direction for later design, not
new broker scope, a settled runtime API, or authorization to change the consumer.

**Source basis:** static inspection of the reference application's clean working
checkout at commit `7a984af39ed51f6391075bf6a3537d48571f5cbe` on 2026-09-21.
The following are source suffixes in that consumer, not files in FGV. No runtime
verification is claimed.

| Existing surface | Observation shaping the follow-up |
|---|---|
| Core `runtime/llm/aiAssistProvider.ts`, `callWithTools` | Already drives bounded provider/tool rounds, drains events, carries continuation, and handles cancellation, timing, and partial output. This is a concrete extraction candidate. |
| Core `runtime/orchestrator/turnOrchestrator.ts`; hub `sessionRoutes.ts` | One pending turn per session/conversation; foreground participant/principal orchestration and reactive turns have host-owned admission and commit/abort boundaries. Reactive model/tool work runs while its conversation turn is open. |
| Core `curate/ingestionJobRunner.ts`; hub `knowledgeIngestHandoff.ts` | Acceptance and execution are separate; the runner owns progress, checkpoints, and execution recovery. A tool can hand off work whose execution outlives the initiating invocation. |
| Hub `scheduling.ts`, `ingestionJobService.ts`, `state.ts` | Injectable timers, bounded periodic recovery sweeps, and deferred work drained after turn resolution provide existing examples. Process-local callback queues and timers are not themselves durable obligations. |

### Relationship to the application

The working direction is a **runner invoked by the host**, usable inside an
interactive turn or inside a background executor. A small standalone application
could use a helper to drive most of its work; the chat application can retain its
own turn orchestration. Neither arrangement should be mandatory.

Distinguish three responsibilities before choosing an abstraction:

1. **Host admission and publication:** decide what may run, in which context,
   with which authority and budget, and when its output can become a conversation
   turn. Human priority, room membership, participant/principal selection, and
   notification policy remain host choices.
2. **One bounded invocation:** compose authorized context, run model/tool rounds,
   and return a structured outcome and observed usage. Ordinary tool calls are
   nested work in that invocation. A tool does not automatically get a separate
   autonomous loop; a long-running handoff can return an accepted task reference.
3. **Background execution and supervision:** execute accepted work independently
   of the initiating turn, publish task progress/outcomes, and request later host
   attention. An executor may use the same bounded runner or no model at all.

Multiple invocations can run concurrently where the host permits it. The future
contract must identify the serialization key and shared resources: the current
app's conversation boundary does not imply one global loop, or one lock per agent
across every context. Background results should re-enter through task observations
and the host's admission/publication path. They must not bypass a busy room or
hold its turn open merely to await a long-running job. Starting another loop does
not grant additional tool authority or bypass the broker's single-writer boundary.

### Candidate shared helpers

| Helper | Useful shared mechanics and boundary |
|---|---|
| Invocation/handoff | Stable invocation and task references, explicit acceptance versus start, typed executor binding, caller cancellation, and observable disposition. Preserve an existing executor's ownership of its work. |
| Progress reporting | Publish structured phase/count/result references and distinguish observed progress from liveness. Coalesce optional progress hints without discarding required outcomes; report committed facts rather than promises in model prose. |
| Bounded model/tool runner | Continuation handling, stream consumption, round limits, cancellation/deadline propagation, usage reporting, and explicit completion/yield/limit/failure outcomes. Keep model response completion separate from task success. |
| Scheduling | Caller-driven bounded passes, wakeup coalescing, concurrency limits, injectable clocks/timers, and shutdown/drain results. Hosts supply eligibility, priority, fairness, budget, and serialization policy; a due candidate is not permission to start. |
| Recovery | Reconcile accepted work with executor state/checkpoints, rediscover owed starts and outcomes, and classify resumable, retryable, blocked, or uncertain work. Retry only when the implementation's capabilities and operation identity make it safe. |

Start with explicit dependencies and small operations that a host can drive.
Optional timer-driven presets can wrap them later. Importing a helper must not
start a service. Low-level model-round machinery may belong in ai-assist;
task-aware orchestration would sit above the broker and provider primitives.
Package placement and public signatures remain decisions for that later design.

### Correctness questions for the follow-up

- **Admission and context:** when is context captured, what may change between
  rounds, and how are authority and invocation identity checked before effects or
  publication? Define what happens when a human arrives during background/reactive
  work, including cooperative yield and stale results. Do not assume cancellation
  can undo an external tool effect.
- **Acceptance and recovery:** identify which store owns a promised start, how it
  is rediscovered after a crash, and which checkpoints are actually resumable.
  Broker process-crash survival does not imply durable model continuations,
  persisted callback closures, exactly-once tools, or executor migration. An
  uncertain external effect cannot be blindly replayed. Execution-specific leases
  remain with their executor; generic distributed ownership is separately deferred.
- **Completion and delivery:** an invocation ending, a task completing, and an
  outcome being presented are distinct boundaries. Integrate exact broker receipts
  with the host's chosen durable processing/commit boundary; prompt composition or
  a model response alone must not acknowledge an outcome. Waiting may use current
  host-owned attention references without pulling in the deferred input protocol.
- **Liveness and stop:** specify queue bounds, coalescing without lost wakeups,
  fairness, hung-work behavior, and shutdown with observable unfinished work.
  Stopping future scheduling, requesting cancellation, and confirming execution
  stopped are different results. Preserve the approved bounded-stop semantics.
- **Provider compatibility:** verify continuation semantics against the consumed
  ai-assist version before extracting the app's loop. The inspected app accumulates
  returned tails, while FGV's current [continuation contract](../../../libraries/ts-extras/src/packlets/ai-assist/toolTypes.ts)
  is cumulative and requires replacement. This is an integration check, not a
  claim about the consumer's installed version; copying the loop unchanged is
  not a sound extraction strategy.

**Trigger and first experiment:** after explicit follow-up agreement, explore two
journeys in the current app: an interactive invocation using several tool rounds,
and an accepted background task that reports progress, survives an interrupted
host according to its executor contract, and later requests attention while a
human turn has priority. Use scripted providers, simulated tasks, injected clocks,
and deterministic scheduling. Prove safe commit/abort cleanup, bounded concurrency,
no lost owed work on restart, and no automatic replay of uncertain effects.

Extract the smallest common helper set, then exercise its exported APIs in the
simple showcase without conversation-specific types. That second host tests
portability; the reference app supplies realistic integration pressure. Decide
loop placement, context/checkpoint ownership, and scheduling presets from those
experiments before committing to a general runtime. Autonomous planning, agent
selection, and negotiation remain the separate policy work below.

## Autonomous planning and collective execution

Defer plan generation, automatic decomposition, scheduling, agent selection,
delegation policies, multi-agent negotiation, and automatic follow-through.
The broker supports representations and commands; a host/agent decides to use them.

The optional `notBefore` field and a due-candidate query are model/query data in
initial scope, not scheduling. FGV does not wake a task, clear other prerequisites,
or change lifecycle state when time passes. Stuck detectors, budgets, cost
attribution, recipient selection, and provider/foreground priority remain host policy.

The [execution-helper follow-up](#optional-execution-helpers-and-bounded-agent-runners)
may share scheduling and runner mechanics without committing to these autonomous
policies. Both remain outside the initial broker implementation.

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

## Execution migration and negotiated handover

Responsibility reassignment is in initial scope; automatic assignee selection,
negotiated acceptance, competing claims, and live execution migration are not.
Changing an actor reference does not stop an executor, transfer its lease or
checkpoint, move artifacts, or atomically hand execution to another process.

Likewise defer a generic physical repository-migration operation. The initial
catalog's stable task IDs and actor-independent canonical addressing ensure a
normal reassignment does not need such a migration. Actor-local external records
remain reachable through their original source binding, independently of assignee.

**Extension preserved:** separate responsibility, source binding, scopes, and
host-supplied authority; revisioned assignment changes and consumer checkpoints.
**Trigger:** a consumer requires coordinated handover of actual running work or
storage ownership, beyond explicit reassignment and implementation-owned execution.
At that point quiescence/fencing, transfer failure, recovery, and actor-removal
semantics need their own contract; do not imply them from today's assignment API.

## Dependency graphs and sophisticated aggregation

The first task structure is a tree, not a general workflow DAG. Defer dependencies,
multiple parents, conditional branches, optional-child policy languages, weighted
progress across arbitrary work, and generalized retry/compensation orchestration.
Explicit `cascade-pause`/`cascade-cancel` parent policies are included in the approved
initial scope: the [development design](development-design.md#10-exact-initial-cascade-stop-semantics)
resolves gate #9 as bounded best attempts with persisted intent, explicit partial
effects/blockers, and observable results. Acceptance is distinct from completion;
approval does not claim the stop mechanism is already implemented or qualified.

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

**Scoped A3 acceptance (2026-09-21):** the reference consumer accepts the finite,
non-recycling history budget for its disposable V1 ingestion hubs only. This is
not approval for its future always-on autonomous collective. Safe operational
compaction/deletion is a prerequisite before that collective adopts the model,
not a prerequisite for F1/F2 or the V1 ingestion port. Its later design must cover
inventory and graph/source identity, exact acknowledgement history, operation
replay horizons, outstanding obligations, and crash-safe reclamation. This is
distinct from an optional complete event-history or compliance-audit product;
raising finite limits postpones exhaustion but does not satisfy indefinite
fixed-resource operation.

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
