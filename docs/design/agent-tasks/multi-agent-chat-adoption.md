# Agent tasks — proposed multi-agent chat ingestion adoption

**Status:** consumer proposal only; no authorization to implement in the reference application.
**Date:** 2026-09-21.
**Source basis:** static inspection of a private multi-agent chat application as of 2026-09-21; repository identity and package prefixes are omitted.
**Companions:** [FGV library design](fgv-library.md), [deferred considerations](deferred.md).

This document is retained in FGV as integration evidence and a handoff proposal.
The consuming project remains responsible for reconciling it with its current design,
decision ledger, authorization rules, and implementation workflow before adoption.
The findings below are static source observations, not a runtime verification.

## 1. Objective and boundary

Replace ingestion-specific task representation at consumer boundaries with the
generic model while retaining ingestion's execution authority. Close the actual
awareness gaps: intermediate progress in agent context, significant changes that
can wake the main room, and outcomes that remain discoverable after interruption.

Do not replace the curator, rebuild ingestion execution, introduce a second
independently writable job-status store, or build the chat application's future human inbox
as part of this adoption.

FGV's default persistence implementation uses FileTree, consistent with existing
usage in both repositories. Adoption should reuse the chat application's existing
FileTree-backed storage boundaries where practical, not introduce a competing
filesystem layer or require migration of authoritative ingestion records into a
second store. The adapter/repository contracts allow that existing ownership to
remain intact.

FGV supplies task values, broker contracts, scoped views, typed commands, context
fragments, and observation/acknowledgement primitives. The chat application supplies actor
authorization, conversation membership, source adapters, subscriptions, scheduling,
prompt placement, turn lifecycle, and user-facing delivery.

## 2. Source map: reuse and changes

References below identify components and source-file suffixes in the inspected
consumer. Private repository/package prefixes are omitted; these are navigation
hints for the consumer's maintainers, not paths within FGV.

| Surface | Present behavior | Proposed use/change |
|---|---|---|
| Core: `curate/ingestionJobModel.ts` | Durable identity, running/succeeded/failed, progress, lease, recovery data, completion address | Map to common lifecycle/progress; retain ingestion detail and execution-specific fields |
| Core: `curate/ingestionJobRunner.ts` | Accepts durable jobs, persists progress/checkpoints, runs and resumes ingestion | Keep executor; expose committed observations through the adapter |
| Core: `curate/ingestionJobStore.ts` | Saves authoritative records; indexes open and terminal-unannounced work | Support reliable generic reconciliation, including terminal discovery and delivery obligations |
| Hub: `ingestionJobService.ts` | Per-agent context; boot/periodic recovery; completion announcement sweeps | Bind sources and reconcile broker views without duplicating execution recovery |
| Hub: `pendingWorkRoutes.ts` | Scans participant agents' open jobs addressed to the queried conversation | Replace ingestion-only assembly with an authorized generic task view |
| Hub: `addressedIngestService.ts` | Launches addressed jobs; announces terminal outcomes; carries reports to shared room agents | Preserve transcript semantics; replace task-awareness delivery with generic obligations |
| Hub: `systemReportNotifier.ts` | Delivers transient reports directly to storage, bypassing reactive distributor | Keep other report producers unchanged; do not use directive framing for task events |
| Core: `notifications/inboxMemoryContributor.ts` | Projects notices; reports retire at composition, directives can remain until consumed | Task fragments use explicit inclusion receipts and later acknowledgement |
| Hub: `sessionRoutes.ts` | Composes prompts and runs linked-thread/inbox reactive paths | Add task context and a distinct task-change trigger using shared turn machinery |
| Core: `runtime/orchestrator/turnOrchestrator.ts` | One open turn per conversation; reactive principal override, single contributor | Reuse where appropriate; settle busy-room scheduling and human priority |
| Web app: `sideChat/SideChatManager.tsx` | Polls pending-work for side-chat progress | Preserve usable UI while its data source moves to the common view |

The relevant implementation details are:

- Runner progress writes include block count, total, segmentation, and accumulated
  results. Observability does not require reinventing checkpoint production.
- Pending-work derives phase and liveness, but filters by `announceTo` and open
  jobs. It is not already an agent-plus-chat task scope union.
- Completion reports are best-effort, and the announcement mark records an
  attempt. It is not proof of delivery to every recipient or presentation to an agent.
- System reports bypass the distributor for a trust reason, not merely because
  somebody forgot a callback. The inbox reactive path builds a synthetic turn
  attributed to a sender; feeding task prose through it unchanged is inappropriate.
- Inbox-triggered turns already select a recipient principal in a multi-agent
  room. Opening a busy room fails; that is not a pending-trigger scheduler.
- Reactive turns hold the conversation open through their model/tool loop, so
  increased wakeups would amplify existing contention with human messages.

## 3. Source adapter and identity

Bind an ingestion source for each authorized agent store, or a hub source that
internally routes to those stores. The public task ID must resolve stably to the
original agent/job identity across restarts and overlapping views. Do not mint a
different task for the main room and the ingestion side chat.

The adapter projects:

- Common status from the authoritative job lifecycle.
- Segmentation/curation phase and completed/total blocks where known.
- Liveness and observation availability separately from success/failure.
- Result references and a bounded outcome summary.
- Recovery capability implemented by the existing runner.

Source text, private content, credentials, and full extracted knowledge are not
default task-context payloads. Task visibility does not automatically grant access
to every resulting knowledge artifact.

Keep ingestion status writes inside the existing runner/store. Broker-owned scope
and parent associations can live separately, but cached observations must be
labelled as such. Commands route to supported ingestion operations only: do not
advertise pause, cancellation, or retry unless the executor actually implements
their required semantics.

Connect all entry paths: addressed ingestion, direct knowledge ingestion/edit
paths, agent handoffs, packaged seed acceptance, and recovery. Installing the
adapter only on the chat initiation route would miss background and resumed jobs.
Preserve current deferred-start behavior around turn completion where applicable.

## 4. Progress publication and recovery

Publish an observation after a successful authoritative write. Classify semantic
progress separately from lease-only renewals. Do not report a checkpoint as
durable because the worker computed it or logged it before the save succeeded.

Live publication accelerates awareness; it is not the recovery mechanism. Extend
the source's durable representation/index or provide complete reconciliation so
a save followed by process failure before publication is recoverable.

The existing open/unannounced indexes are useful starting points, but the current
announcement-attempt marker cannot discharge generic per-recipient obligations.
The adoption design must choose where source revisions and outstanding delivery
information are committed. Avoid a dual-write scheme that can permanently lose
updates between the job save and a separate notification save.

On restart:

1. Restore durable task registrations, scope associations, and consumer checkpoints.
2. Query authoritative jobs, including completed jobs with outstanding obligations.
3. Let the existing recovery mechanism determine whether work is live, resumable,
   deferred for prerequisites, or failed.
4. Reconcile task views and recover pending updates without rerunning live work.
5. Schedule eligible delivery to currently authorized recipients.

A missing curator prerequisite is not automatically failed execution. A source
read failure is not an empty room. Preserve the existing partial/unresolved
pending-work reporting discipline in generic queries.

## 5. Agent and conversation scopes

Construct a view from host-approved agent-specific and conversation-shared task
associations. A long-lived job scope can be added later without changing task
identity or requiring a live conversation.

`announceTo` remains useful provenance and a completion-transcript address, but
must not be the only definition of visibility. Define deliberately which tasks
the main room can see while work runs in a side chat. Existing participant
intersection is evidence for a policy, not an automatic authorization rule for
all future tasks.

Recheck current access before querying, rendering, and delivering queued updates.
The durable-roster staleness concerns in the existing carry-back path need to be
resolved or bounded explicitly; copying that path is not proof of authorization.

Shared visibility does not automatically assign every participant to react.
The host selects who is responsible for surfacing an update and which others
receive it in their next context. Avoid one model invocation per visible agent
per progress write. One participant's acknowledgement does not clear another's.

## 6. Proactive context

Build task context for ordinary principal turns, participant contributions, and
task-triggered turns using the same scoped view. Inject reusable prompt resources
with dynamic slots through prompt-assist; keep inclusion receipts outside the
model-visible text.

Provide current tasks, material outstanding changes, and requests needing attention.
Read tools use the same access boundary and let an agent inspect omitted detail.
Capabilities, not prompt prose alone, constrain what the agent may command.

The host acknowledges only included updates after the chosen successful turn
boundary. Provider failures, prompt-build failures, and failed commits do not
consume them. An intentional abstention must have an explicit policy distinct
from failure; otherwise a harmless event can cause endless wakeups.

Replace ingestion's old agent report projection when the new task path takes
ownership, or suppress it by stable source identity. Do not show the same completion
twice because both the old inbox and new task context include it. Existing
human-visible transcript completion entries can remain separate presentation.

## 7. Task-change reactivity

Introduce a task-change trigger, rather than disguising a task change as a message
from an agent or human. Reuse turn opening, principal selection, composition,
commit/drop, and abort cleanup where their contracts fit.

The trigger carries task/change provenance. Existing linked-thread turn indices
are not sufficient provenance for background work. Adapt re-entry guards so the
new trigger does not accidentally cause recursive fan-out; do not invent a human
turn as its origin.

The hub owns a pending-trigger policy:

- Persist or reconstruct owed triggers from task subscription checkpoints.
- Coalesce routine progress and exclude lease-only maintenance.
- Retain terminal outcomes and unresolved requests across coalescing.
- When a room is busy, keep the trigger pending and reconsider on an appropriate
  turn-close/reconciliation opportunity.
- Choose the recipient, recheck membership, and honor the hub's reactivity controls.
- Use an explicit task-reactivity policy rather than silently inheriting the
  semantics of linked-thread relevance or self-sent inbox directives.

No arbitrary fixed progress percentage needs to trigger an LLM call. Policy may
surface phase changes and notable milestones while refreshing finer progress on
ordinary turns. Exact thresholds are host configuration/design, not FGV contracts.

### Adoption gate: human priority and room occupancy

The current inbox path opens the main-room turn before model/tool execution. A
task wakeup implemented identically can block a human's next message for a long
time. This is a real adoption cost, even with the generic library already built.

Before enabling task wakeups, choose and test a policy for pending human input,
background cancellation/yield, bounded background work, and stale context. Possible
mechanisms include preparing outside the room's exclusive turn and revalidating
before commit, or a turn scheduler that explicitly prioritizes human work. Neither
is assumed to be a trivial extraction from today's code.

The initial task-triggered turn need not initiate arbitrary cross-room effects.
Preserve current tool authority limits until the host explicitly designs broader
autonomy and loop controls. Task awareness is not permission to remove those guards.

## 8. Bounded adoption journeys

1. **One task view:** existing ingestion and pending-work UI read through the
   adapter; stable IDs, current phase/progress, partial reads, and scope checks work.
2. **Agent awareness:** ordinary turns receive current tasks and outstanding changes;
   list/detail tools agree; failed calls do not consume updates.
3. **Proactive room response:** meaningful changes can trigger an authorized agent
   without a human prompt, with busy-room retry and tested human-priority behavior.
4. **Recovery and cutover:** restart recovers execution state and delivery obligations;
   old task-specific agent notices are retired without duplicate or missing outcomes.

Each journey remains reachable through the existing app UI; a backend-only route
that nobody can exercise is not an adoption milestone. A generic task dashboard
is not required. Any newly configurable control must have the necessary UI in the
same journey.

### End-to-end acceptance

- An ingestion shows intermediate progress to an agent before it completes.
- Significant updates surface in an eligible main room without a new human message.
- Updates arriving while a room is busy remain pending and later become actionable.
- A person can continue using the main room under the chosen priority policy.
- A completion leaving the active-work list remains available until its required
  presentation is acknowledged.
- Model failure, process restart, and publication failure do not silently drop outcomes.
- Unreachable state is reported as uncertain, not successful/failed by inference.
- Multiple participants see only authorized work; one does not consume another's updates.
- Routine progress does not create an unbounded stream of model calls.
- Old and new completion paths do not duplicate announcements.

## 9. Remaining adoption decisions and cost

The reusable executor and progress records make this an adaptation rather than an
ingestion rewrite. The substantial work remains durable observation/checkpoints,
scope mapping, prompt/commit integration, and room scheduling. These are largely
required for a reliable ingestion-only fix as well.

Before implementation, the consuming project must settle:

1. The task-source registration and durable reconciliation/terminal-discovery protocol.
2. Agent-specific versus chat-shared visibility and the responsible wakeup recipient.
3. Human-priority/room-occupancy behavior and abstention acknowledgement policy.
4. Generic trigger provenance and interaction with existing re-entry guards.
5. Migration/backfill of existing jobs and announcement-attempt markers, without
   falsely treating attempted delivery as acknowledged presentation.
6. UI/wire changes required for the chosen initial journeys and their rollout order.

No calendar estimate is asserted. These choices, especially room scheduling,
determine the adoption cost. They do not block independent design and validation
of the FGV contracts.
