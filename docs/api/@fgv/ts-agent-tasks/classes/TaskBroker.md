[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-agent-tasks](../README.md) / TaskBroker

# Class: TaskBroker

The task broker: host-bound views and writers over one repository, plus the trusted host
operations that are not a principal's to perform.

## Remarks

Every operation a bound writer performs is authorized on its subject — and on each parent it
affects — against the host policy, then re-verified inside one serialized writer section before
it commits: a policy epoch that moved, or a record that changed, refuses the commit. A bound view
produces only projected data. Parentage, responsibility, scope labels and authority are
independent: none of them grants or implies another. The broker performs no I/O of its own
beyond the repository, starts no work and installs no timer.

## Methods

### abandonCommand()

> **abandonCommand**(`binding`, `request`): `Promise`\<[`TaskResult`](../type-aliases/TaskResult.md)\<[`ICommandReceipt`](../interfaces/ICommandReceipt.md)\>\>

Abandons one external command whose outcome is not known — never sent, sent with an uncertain
outcome and held, or awaiting a feed revision — a trusted host operation. The receipt becomes
`abandoned`, naming what was known; it never claims the command was or was not applied. Its
settlement reservation is released and the task can be archived.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `binding` | [`IBoundTaskViewParams`](../interfaces/IBoundTaskViewParams.md) |
| `request` | `unknown` |

#### Returns

`Promise`\<[`TaskResult`](../type-aliases/TaskResult.md)\<[`ICommandReceipt`](../interfaces/ICommandReceipt.md)\>\>

#### Remarks

`binding`'s policy must allow `dispose-obligation` on the task. A command already abandoned
returns its receipt; any other settled command is `conflict`.

***

### bind()

> **bind**(`params`): [`TaskResult`](../type-aliases/TaskResult.md)\<[`IBoundTaskWriter`](../interfaces/IBoundTaskWriter.md)\>

Binds a writer to one principal.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `params` | [`IBoundTaskViewParams`](../interfaces/IBoundTaskViewParams.md) |

#### Returns

[`TaskResult`](../type-aliases/TaskResult.md)\<[`IBoundTaskWriter`](../interfaces/IBoundTaskWriter.md)\>

***

### bindDelivery()

> **bindDelivery**(`params`): [`TaskResult`](../type-aliases/TaskResult.md)\<[`IBoundTaskDelivery`](../interfaces/IBoundTaskDelivery.md)\>

Binds a subscription's delivery to one principal. The subscription must exist, belong to
`consumerId`, and name `principal` among its drain principals; otherwise the answer is
`not-found-or-denied`, the same for all three, so a refusal says nothing about which failed.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `params` | [`IBoundTaskDeliveryParams`](../interfaces/IBoundTaskDeliveryParams.md) |

#### Returns

[`TaskResult`](../type-aliases/TaskResult.md)\<[`IBoundTaskDelivery`](../interfaces/IBoundTaskDelivery.md)\>

#### Remarks

A binding **drains** its subscription: what it acknowledges is no longer owed to `consumerId`,
whoever reads it next. So only the principals the subscription names may bind it — by default its
registering principal alone; a host that subscribes on an agent's behalf names the agent
(`ISubscribeRequest.drainPrincipals`), and may change the list later with
[TaskBroker.setSubscriptionDrain](#setsubscriptiondrain). A subscription recorded before drain principals existed
is drained by its registering principal alone.

The rule is applied again by every operation of the bound delivery, against the subscription as
it stands, so a principal removed after binding is refused from then on with the same answer.
Disclosure and acknowledgement are still decided under the binding's own authority: a drain
principal is shown only what its policy lets it see.

***

### bindView()

> **bindView**(`params`): [`TaskResult`](../type-aliases/TaskResult.md)\<[`IBoundTaskView`](../interfaces/IBoundTaskView.md)\>

Binds a read-only view to one principal. The returned object has no mutation method.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `params` | [`IBoundTaskViewParams`](../interfaces/IBoundTaskViewParams.md) |

#### Returns

[`TaskResult`](../type-aliases/TaskResult.md)\<[`IBoundTaskView`](../interfaces/IBoundTaskView.md)\>

***

### cleanup()

> **cleanup**(`request`): `Promise`\<[`TaskResult`](../type-aliases/TaskResult.md)\<[`ITaskCleanupReport`](../interfaces/ITaskCleanupReport.md)\>\>

One cleanup pass — a trusted host operation: prunes the update payloads every audience member has
acknowledged or disposed, by each one's durable checkpoint, on up to `limit` candidate tasks.
Ends no obligation and needs no authority beyond the evidence already committed.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `request` | `unknown` |

#### Returns

`Promise`\<[`TaskResult`](../type-aliases/TaskResult.md)\<[`ITaskCleanupReport`](../interfaces/ITaskCleanupReport.md)\>\>

***

### closeSubscription()

> **closeSubscription**(`binding`, `request`): `Promise`\<[`TaskResult`](../type-aliases/TaskResult.md)\<[`ITaskSubscription`](../interfaces/ITaskSubscription.md)\>\>

Closes a subscription — a trusted host operation. It joins no audience again; `retain` keeps what
it is owed and drainable through its bound delivery, `dispose` ends all of it with the
reason. The record and its history are retained, and its id is never reused.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `binding` | [`IBoundTaskViewParams`](../interfaces/IBoundTaskViewParams.md) |
| `request` | `unknown` |

#### Returns

`Promise`\<[`TaskResult`](../type-aliases/TaskResult.md)\<[`ITaskSubscription`](../interfaces/ITaskSubscription.md)\>\>

#### Remarks

`binding`'s policy must allow `dispose-obligation` over the subscription's scopes, and — for
`dispose` — on every task it is owed an update of. Its principal must be one of the
subscription's drain principals; a close that `retain`s may also be made by the registering
principal, since it ends nothing owed. Anything else is `not-found-or-denied`, the answer a missing
subscription gets, decided again inside the writing section on the record written. A host that
registered on an agent's behalf and must dispose names itself among the drain principals
([TaskBroker.setSubscriptionDrain](#setsubscriptiondrain)).

***

### dispose()

> **dispose**(`binding`, `request`): `Promise`\<[`TaskResult`](../type-aliases/TaskResult.md)\<[`ITaskDispositionResult`](../interfaces/ITaskDispositionResult.md)\>\>

Ends obligations of one subscription without acknowledgement — a trusted host operation, recorded
with its reason in the subscription's exact history. See [IDisposeObligationsRequest](../interfaces/IDisposeObligationsRequest.md).

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `binding` | [`IBoundTaskViewParams`](../interfaces/IBoundTaskViewParams.md) |
| `request` | `unknown` |

#### Returns

`Promise`\<[`TaskResult`](../type-aliases/TaskResult.md)\<[`ITaskDispositionResult`](../interfaces/ITaskDispositionResult.md)\>\>

#### Remarks

`binding`'s principal must be one of the subscription's drain principals — the consumer the
obligations are owed to, so one consumer's binding cannot end another's — its policy must allow
`dispose-obligation` on every task the ids name, and the subscription's selection must lie within
its selectors; otherwise the answer is `not-found-or-denied`, the answer a missing subscription
gets. The drain rule is decided again inside the writing section, on the record written. Every
id must be owed now or already discharged; an id an unacknowledged issued receipt names is refused until that receipt is acknowledged or abandoned. The obligation
ends for this subscription alone and consumes the evidence slot it already reserved.

***

### extendReplayEnvelope()

> **extendReplayEnvelope**(`taskId`, `add`): `Promise`\<[`TaskResult`](../type-aliases/TaskResult.md)\<[`ISourceReplayEnvelope`](../interfaces/ISourceReplayEnvelope.md)\>\>

Extends a `source-replay` task's finite envelope — new admission, charged now, before the source
relies on it. Completion of work already admitted never depends on this.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `taskId` | [`TaskId`](../type-aliases/TaskId.md) |
| `add` | [`ISourceReplayEnvelope`](../interfaces/ISourceReplayEnvelope.md) |

#### Returns

`Promise`\<[`TaskResult`](../type-aliases/TaskResult.md)\<[`ISourceReplayEnvelope`](../interfaces/ISourceReplayEnvelope.md)\>\>

***

### hint()

> **hint**(`binding`): `Promise`\<[`TaskResult`](../type-aliases/TaskResult.md)\<[`ISourceObservationReport`](../interfaces/ISourceObservationReport.md)\>\>

A push hint from a source: never itself a delivery record. Triggers a fresh read of the binding
(never an overwrite from the push), exactly as [TaskBroker.observe](#observe).

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `binding` | [`ISourceBinding`](../interfaces/ISourceBinding.md) |

#### Returns

`Promise`\<[`TaskResult`](../type-aliases/TaskResult.md)\<[`ISourceObservationReport`](../interfaces/ISourceObservationReport.md)\>\>

***

### observe()

> **observe**(`taskId`): `Promise`\<[`TaskResult`](../type-aliases/TaskResult.md)\<[`ISourceObservationReport`](../interfaces/ISourceObservationReport.md)\>\>

Reads one task's binding from its source and applies it — a trusted host operation. For a
`source-replay` source nothing is read: the outcome is `deferred`, and only
[TaskBroker.reconcile](#reconcile) moves the task.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `taskId` | [`TaskId`](../type-aliases/TaskId.md) |

#### Returns

`Promise`\<[`TaskResult`](../type-aliases/TaskResult.md)\<[`ISourceObservationReport`](../interfaces/ISourceObservationReport.md)\>\>

***

### reconcile()

> **reconcile**(`request`): `Promise`\<[`TaskResult`](../type-aliases/TaskResult.md)\<[`ISourceReconcileReport`](../interfaces/ISourceReconcileReport.md)\>\>

One reconciliation pass over a source, from its committed cursor — a trusted host operation.
The cursor advances only past pages whose every observation committed.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `request` | [`ISourceReconcileRequest`](../interfaces/ISourceReconcileRequest.md) |

#### Returns

`Promise`\<[`TaskResult`](../type-aliases/TaskResult.md)\<[`ISourceReconcileReport`](../interfaces/ISourceReconcileReport.md)\>\>

***

### recover()

> **recover**(`taskId`): `Promise`\<[`TaskResult`](../type-aliases/TaskResult.md)\<[`ITaskRecoveryOutcome`](../interfaces/ITaskRecoveryOutcome.md)\>\>

Explicit recovery of one task after a restart — a trusted host operation. Repository open and
broker creation never do this.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `taskId` | [`TaskId`](../type-aliases/TaskId.md) |

#### Returns

`Promise`\<[`TaskResult`](../type-aliases/TaskResult.md)\<[`ITaskRecoveryOutcome`](../interfaces/ITaskRecoveryOutcome.md)\>\>

***

### registerExternal()

> **registerExternal**(`principal`, `request`): `Promise`\<[`TaskResult`](../type-aliases/TaskResult.md)\<[`TaskRegistrationResult`](../type-aliases/TaskRegistrationResult.md)\>\>

Registers an externally executed task — a trusted host operation with host-supplied scopes,
binding and recovery declaration, recorded under `principal`. See [IRegisterExternalTask](../interfaces/IRegisterExternalTask.md).

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `principal` | `string` |
| `request` | `unknown` |

#### Returns

`Promise`\<[`TaskResult`](../type-aliases/TaskResult.md)\<[`TaskRegistrationResult`](../type-aliases/TaskRegistrationResult.md)\>\>

***

### resumePendingRegistration()

> **resumePendingRegistration**(`taskId`): `Promise`\<[`TaskResult`](../type-aliases/TaskResult.md)\<[`TaskRegistrationResult`](../type-aliases/TaskRegistrationResult.md)\>\>

Resumes an external registration left pending — accepted into the inventory and not yet marked
live; its first record may or may not have landed — from the canonical request the repository
stored with it, under the principal it was accepted for. A trusted host operation, as
[TaskBroker.registerExternal](#registerexternal) is.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `taskId` | [`TaskId`](../type-aliases/TaskId.md) |

#### Returns

`Promise`\<[`TaskResult`](../type-aliases/TaskResult.md)\<[`TaskRegistrationResult`](../type-aliases/TaskRegistrationResult.md)\>\>

#### Remarks

Every check registration makes is made again now: the request is converted, its parent re-read
and re-checked inside the writer, and the source's committed history compared. A native pending
registration resumes through a bound writer (`IBoundTaskWriter.resumePendingRegistration`), which
authorizes it, and is `invalid` here. A live task that an external registration created — a
resume whose response was lost — replays that registration (without its parent checks, which
decided the original); any other id is `not-found-or-denied`.

***

### setSubscriptionDrain()

> **setSubscriptionDrain**(`binding`, `request`): `Promise`\<[`TaskResult`](../type-aliases/TaskResult.md)\<[`ITaskSubscription`](../interfaces/ITaskSubscription.md)\>\>

Replaces a subscription's drain principals and its recorded policy identity — a trusted host
operation. See [ISubscriptionDrainRequest](../interfaces/ISubscriptionDrainRequest.md).

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `binding` | [`IBoundTaskViewParams`](../interfaces/IBoundTaskViewParams.md) |
| `request` | `unknown` |

#### Returns

`Promise`\<[`TaskResult`](../type-aliases/TaskResult.md)\<[`ITaskSubscription`](../interfaces/ITaskSubscription.md)\>\>

#### Remarks

Made through the **registering** principal's binding: its selectors must cover the
subscription's selection and its policy must grant `subscribe` for the selection's scopes — what
registering the subscription required. Anything else is `not-found-or-denied`. Active and closed
subscriptions alike; a request that changes nothing writes nothing.

Takes effect for bindings already made, too: every bound-delivery operation re-applies the drain
rule to the subscription as it stands. A change makes a retry of the original `subscribe`
`conflict`: the retry is compared with the subscription as it now stands (see
[TaskBroker.subscribe](#subscribe)). A receipt a removed principal prepared stays issued until
it is acknowledged by a principal still named, abandoned, or expires.

***

### subscribe()

> **subscribe**(`binding`, `request`): `Promise`\<[`TaskResult`](../type-aliases/TaskResult.md)\<[`ITaskSubscription`](../interfaces/ITaskSubscription.md)\>\>

Creates a subscription — a trusted host operation, recorded under `binding`'s principal, whose
`current` baseline holds only what that principal may see. See [ISubscribeRequest](../interfaces/ISubscribeRequest.md).

The subscription records the principals that may bind its delivery (`drainPrincipals`, default
the registering principal alone) and, optionally, the identity of the consumer's own policy that
`disposeWithheld` requires. A retry must repeat both exactly.

A retry is compared with the subscription **as it stands**: once its drain principals or identity
have been changed through [TaskBroker.setSubscriptionDrain](#setsubscriptiondrain), re-running the original
request is `conflict`. A host that re-runs `subscribe` at boot treats drain changes as made through
`setSubscriptionDrain` alone, and either retries with the current list or reads the subscription
(`repository.subscription`) instead. A subscription recorded before drain principals existed is
the same registration as a retry naming its registrant alone.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `binding` | [`IBoundTaskViewParams`](../interfaces/IBoundTaskViewParams.md) |
| `request` | `unknown` |

#### Returns

`Promise`\<[`TaskResult`](../type-aliases/TaskResult.md)\<[`ITaskSubscription`](../interfaces/ITaskSubscription.md)\>\>

#### Remarks

The baseline is captured and authorized, then one writer section re-proves that no selected task
moved or appeared and that the policy epoch is unchanged before it writes the record and activates
the subscription — so no commit falls between the baseline and the first update owed. A
`current` selection larger than the baseline bound is refused, never truncated.

***

### whenIdle()

> **whenIdle**(`timeoutMs`): `Promise`\<[`TaskResult`](../type-aliases/TaskResult.md)\<`true`\>\>

Resolves once no broker write is waiting for the writer or holding it, or fails — `conflict`,
retry `safe` — when that has not happened within `timeoutMs`.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `timeoutMs` | `number` |

#### Returns

`Promise`\<[`TaskResult`](../type-aliases/TaskResult.md)\<`true`\>\>

#### Remarks

**It describes a moment, not a hold — and a moment between sections, not between operations.**
It observes the broker's writer queue and never takes a turn in it, so it never takes the writer
and never delays a write; a write enqueued the instant after it resolves runs as usual. One
broker operation can be several gated sections with work between them — `acknowledge` and
`prepare` match then commit, a creation authorizes before it queues, source passes and `cleanup`
take one section per step — so it can resolve in the middle of an operation. **To quiesce before
a shutdown or snapshot, pause the `writeGuard` first, then wait for idle**: it resolves once the
sections already past the guard have finished. A write held *at* the guard during the pause is a
queued section and keeps the broker busy until the pause lifts. A host that needs the quiet to last holds its writes first — with
the `writeGuard` it gave [TaskBroker.create](#create) — and a section that guard is holding counts as
busy. It sees only the broker's own queue: a caller using the repository's `withWriter` directly is
invisible to it. The wait is bounded by the `schedule` given to [TaskBroker.create](#create). A
`timeoutMs` that is not a non-negative safe integer is `invalid`.

***

### create()

> `static` **create**(`params`): [`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<`TaskBroker`\>

Creates a broker over a repository. Updates are owed to the repository's subscriptions: every
commit names exactly the audience the repository computes, and the repository verifies it.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `params` | [`ITaskBrokerCreateParams`](../interfaces/ITaskBrokerCreateParams.md) |

#### Returns

[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<`TaskBroker`\>
