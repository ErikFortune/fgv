# Agent tasks — proposed multi-agent chat ingestion adoption

**Status:** consumer proposal only; no authorization to implement in the reference application.
**Date:** 2026-09-21.
**Source basis:** static inspection of a private multi-agent chat application as of 2026-09-21; repository identity and package prefixes are omitted.
**Companions:** [FGV library design](fgv-library.md), [deferred considerations](deferred.md).

**FGV review incorporated:** the initial library excludes its own input-request
protocol. This adoption uses waiting/attention references where needed, pure
inclusion receipts with broker-managed acknowledgement, and explicit prompt-cache
composition validation. The ingestion journeys do not depend on answer arbitration
or durable answer-to-continuation machinery.

**Consumer review incorporated:** recipient selection is new host mechanism;
ingestion is an observation-only adapter; existing transient notices do not meet
required-delivery retention. Indexed repository queries are a library contract,
while the choice of adopting its FileTree default remains with the consumer.

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

Use existing FileTree capability checks and synchronization interfaces when
binding storage. `isPersistentAccessors` identifies an explicit sync interface,
not a transaction/crash-safety certificate; write-through adapters can persist
without implementing it. Validate the chosen source/repository commit boundary
and recovery behavior rather than inferring durability from that probe alone.

FGV's first durable backend is Node `FileTree.FsFileTreeAccessors`. The library
design explicitly scopes an additive atomic/durable-write FileTree capability
as an upstream dependency; current write-through saves do not protect records
against interrupted overwrite. Adoption must check which writes in its existing
authoritative ingestion store actually use the stronger primitive and commit
protocol. Upgrading the package alone does not strengthen old call sites, and
atomic writes of individual files do not make separate job/update writes atomic.

Using that implementation is optional. The consumer may adapt its per-actor vault
or adopt the generic catalog after evaluating the repository contract, especially
indexed scope/lifecycle queries. Either choice must preserve one execution
authority and the hot-path behavior below.

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
- Inbox-triggered turns run as the notification's already-addressed target, using
  a principal override. They do not choose a responsible agent among a room's
  participants. Task-update recipient selection is new host mechanism, not an
  existing selection policy to reuse. Opening a busy room also fails; that is
  not a pending-trigger scheduler.
- Existing system report notices are transient and carry a TTL. They can expire
  before presentation; that path does not meet the task contract's required-delivery
  retention rule and must change during adoption.
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
their required semantics. For the reference adoption the advertised command set
is **empty**: there is no pause/cancel operation, and capped recovery sweeps are
host lifecycle work, not caller-invocable retry commands. This integration validates
observation, not FGV's command surface; tracked/simulated tasks must prove commands.

Connect all entry paths: addressed ingestion, direct knowledge ingestion/edit
paths, agent handoffs, packaged seed acceptance, and recovery. Installing the
adapter only on the chat initiation route would miss background and resumed jobs.
Preserve current deferred-start behavior around turn completion where applicable.

### Hot open-work queries

The consumer reports that its open-work listing participates in every knowledge
write's admission check, document delete/move/rekey, ingestion acceptance, and
per-agent recovery sweeps. Records are retained, so a full-history scan would
regress foreground work as the catalog grows. The inspected source confirms the
write arbiter, acceptance, and recovery routes call the tagged open-job listing.

Preserve indexed selection through the repository's `(scope, lifecycle-class)`
contract. The existing store derives an index from kind/tag metadata; whether
adoption uses it or the FGV catalog is the consumer's choice. Measure hot-query
record reads/candidate work with increasing terminal history during adoption.
Do not replace an authoritative write-admission check with a potentially stale
broker projection merely because that projection has a fast index. Coordination
with the source's actual write authority remains necessary.

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

That selection policy must be built on the host side. Existing recipient-bound
reactivity supplies execution as a chosen recipient, not the choice itself.
Command authority is likewise host-supplied and rechecked per command; a stored
task association or delegated-stop label is not a durable FGV grant.

## 6. Proactive context

Build task context for ordinary principal turns, participant contributions, and
task-triggered turns using the same scoped view. Inject reusable prompt resources
with dynamic slots through prompt-assist; keep inclusion receipts outside the
model-visible text.

Provide current tasks, material outstanding changes, and waiting reasons or
host-owned attention references. An existing host decision mechanism remains
host-owned; adoption does not require a new FGV request/answer service.
Read tools use the same access boundary and let an agent inspect omitted detail.
Capabilities, not prompt prose alone, constrain what the agent may command.

Inclusion receipts are pure values returned by context preparation. The host passes
them to the broker's acknowledgement service under the same bound consumer/
subscription context; that service validates them and updates its configured
checkpoint store. Neither rendering nor a model's claim that it read something
advances a checkpoint. Foreign receipts cannot consume another participant's work.

The host acknowledges only included updates after the chosen successful turn
boundary. Provider failures, prompt-build failures, and failed commits do not
consume them. An intentional abstention must have an explicit policy distinct
from failure; otherwise a harmless event can cause endless wakeups.

Place volatile task context after the intended stable prompt prefix. Verify the
final composition with `analyzePromptCacheStability`/`cacheFindings` and the
`toCacheRequest` breakpoint plan, including any post-composition changes made by
the host. Assert composition availability: empty findings with unavailable
analysis do not prove good cache ordering. Progress-only changes should preserve
the intended stable prefix and its breakpoints. This verifies the integration's
composition, not a guarantee of provider cache hits.

Replace ingestion's old agent report projection when the new task path takes
ownership, or suppress it by stable source identity. Do not show the same completion
twice because both the old inbox and new task context include it. Existing
human-visible transcript completion entries can remain separate presentation.

Required task-derived notices cannot retain the old transient-TTL semantics as
their only delivery record. Keep an obligation durable until acknowledgement or
explicit disposition; an optional expiring notification can be a delivery hint,
not the only recoverable representation of what is owed. Test expiry before
presentation and recovery while the main room is inactive.

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
- Retain terminal outcomes and outstanding attention requirements across coalescing;
  any referenced interaction's request lifecycle remains host-owned.
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
background cancellation/yield, bounded background work, and stale context. The
consumer identifies its model-provider seam as the home of its priority fix;
this proposal does not prescribe a turn scheduler or introduce a priority knob
in FGV tasks. Verify the resulting room-occupancy/human-experience behavior end to
end rather than assuming provider priority alone resolves every open-turn conflict.

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
- Forged scope/actor tool arguments, foreign task IDs, child traversal, and foreign
  receipt replay cannot widen access or advance another participant's checkpoint.
- Routine progress does not create an unbounded stream of model calls.
- Old and new completion paths do not duplicate announcements.
- Available composition analysis establishes appropriate cache ordering, and
  progress-only changes preserve the intended stable prefix/breakpoint plan.
- All journeys work without the deferred FGV input-request protocol.
- Increasing retained terminal history does not turn hot open-work queries into
  full-history scans or per-query reads of every job.
- Required task updates remain owed after transient notice expiry, until valid
  acknowledgement or an explicit disposition.

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
7. Final placement of task fragments and verification of composition availability,
   cache diagnostics, and derived breakpoint offsets against the actual prompt.
8. Whether to adopt FGV's supplied repository or implement its indexed contract
   over host storage, preserving authoritative admission checks and query performance.
9. Replacement of transient-TTL-only task delivery with recoverable obligations.

No calendar estimate is asserted. These choices, especially room scheduling,
determine the adoption cost. They do not block independent design and validation
of the FGV contracts.
