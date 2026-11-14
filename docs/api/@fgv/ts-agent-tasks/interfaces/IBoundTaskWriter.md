[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-agent-tasks](../README.md) / IBoundTaskWriter

# Interface: IBoundTaskWriter

A writer bound to one principal.

## Remarks

Every method authorizes its own subject (and each affected parent) and re-verifies that
authorization inside the serialized writer before it commits.

## Extends

- [`IBoundTaskView`](IBoundTaskView.md)

## Properties

| Property | Modifier | Type |
| ------ | ------ | ------ |
| <a id="property-principal"></a> `principal` | `readonly` | `string` |

## Methods

### archive()

> **archive**(`request`): `Promise`\<[`TaskResult`](../type-aliases/TaskResult.md)\<[`ITaskMutationResult`](ITaskMutationResult.md)\>\>

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `request` | [`ITaskMutationIdentity`](ITaskMutationIdentity.md) |

#### Returns

`Promise`\<[`TaskResult`](../type-aliases/TaskResult.md)\<[`ITaskMutationResult`](ITaskMutationResult.md)\>\>

***

### changeScopes()

> **changeScopes**(`request`): `Promise`\<[`TaskResult`](../type-aliases/TaskResult.md)\<[`ITaskMutationResult`](ITaskMutationResult.md)\>\>

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `request` | [`IChangeTaskScopes`](IChangeTaskScopes.md) |

#### Returns

`Promise`\<[`TaskResult`](../type-aliases/TaskResult.md)\<[`ITaskMutationResult`](ITaskMutationResult.md)\>\>

***

### completeList()

> **completeList**(`request`): `Promise`\<[`TaskResult`](../type-aliases/TaskResult.md)\<[`ITaskMutationResult`](ITaskMutationResult.md)\>\>

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `request` | [`ICompleteTaskList`](ICompleteTaskList.md) |

#### Returns

`Promise`\<[`TaskResult`](../type-aliases/TaskResult.md)\<[`ITaskMutationResult`](ITaskMutationResult.md)\>\>

***

### createTaskList()

> **createTaskList**(`request`): `Promise`\<[`TaskResult`](../type-aliases/TaskResult.md)\<[`ITaskMutationResult`](ITaskMutationResult.md)\>\>

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `request` | [`ICreateTaskList`](ICreateTaskList.md) |

#### Returns

`Promise`\<[`TaskResult`](../type-aliases/TaskResult.md)\<[`ITaskMutationResult`](ITaskMutationResult.md)\>\>

***

### createTracked()

> **createTracked**(`request`): `Promise`\<[`TaskResult`](../type-aliases/TaskResult.md)\<[`ITaskMutationResult`](ITaskMutationResult.md)\>\>

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `request` | [`ICreateTrackedTask`](ICreateTrackedTask.md) |

#### Returns

`Promise`\<[`TaskResult`](../type-aliases/TaskResult.md)\<[`ITaskMutationResult`](ITaskMutationResult.md)\>\>

***

### execute()

> **execute**(`request`): `Promise`\<[`TaskResult`](../type-aliases/TaskResult.md)\<[`ICommandReceipt`](ICommandReceipt.md)\>\>

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `request` | [`ICommandRequest`](ICommandRequest.md) |

#### Returns

`Promise`\<[`TaskResult`](../type-aliases/TaskResult.md)\<[`ICommandReceipt`](ICommandReceipt.md)\>\>

***

### inspect()

> **inspect**(`id`): `Promise`\<[`TaskResult`](../type-aliases/TaskResult.md)\<[`TaskInspection`](../type-aliases/TaskInspection.md)\>\>

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `id` | [`TaskId`](../type-aliases/TaskId.md) |

#### Returns

`Promise`\<[`TaskResult`](../type-aliases/TaskResult.md)\<[`TaskInspection`](../type-aliases/TaskInspection.md)\>\>

#### Inherited from

[`IBoundTaskView`](IBoundTaskView.md).[`inspect`](IBoundTaskView.md#inspect)

***

### inspectStop()

> **inspectStop**(`request`): `Promise`\<[`TaskResult`](../type-aliases/TaskResult.md)\<[`IStopResult`](IStopResult.md)\>\>

One cascade stop's current result, as this principal may see it: the root must be visible, and
only visible targets are listed. Reading it performs no effect. (T9.)

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `request` | [`IStopInspectRequest`](IStopInspectRequest.md) |

#### Returns

`Promise`\<[`TaskResult`](../type-aliases/TaskResult.md)\<[`IStopResult`](IStopResult.md)\>\>

#### Inherited from

[`IBoundTaskView`](IBoundTaskView.md).[`inspectStop`](IBoundTaskView.md#inspectstop)

***

### query()

> **query**(`request`): `Promise`\<[`TaskResult`](../type-aliases/TaskResult.md)\<[`IBoundTaskPage`](IBoundTaskPage.md)\>\>

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `request` | [`IBoundTaskQuery`](IBoundTaskQuery.md) |

#### Returns

`Promise`\<[`TaskResult`](../type-aliases/TaskResult.md)\<[`IBoundTaskPage`](IBoundTaskPage.md)\>\>

#### Inherited from

[`IBoundTaskView`](IBoundTaskView.md).[`query`](IBoundTaskView.md#query)

***

### queryDue()

> **queryDue**(`request`): `Promise`\<[`TaskResult`](../type-aliases/TaskResult.md)\<[`IBoundTaskPage`](IBoundTaskPage.md)\>\>

The waiting tasks within this view that are due at `cutoff`, from the repository's due index,
authorized and projected exactly as [IBoundTaskView.query](IBoundTaskView.md#query) answers: denied candidates are
dropped, and the cursor is bound to this view and policy epoch. Querying never starts or
changes a task.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `request` | [`IBoundTaskDueQuery`](IBoundTaskDueQuery.md) |

#### Returns

`Promise`\<[`TaskResult`](../type-aliases/TaskResult.md)\<[`IBoundTaskPage`](IBoundTaskPage.md)\>\>

#### Inherited from

[`IBoundTaskView`](IBoundTaskView.md).[`queryDue`](IBoundTaskView.md#querydue)

***

### reassign()

> **reassign**(`request`): `Promise`\<[`TaskResult`](../type-aliases/TaskResult.md)\<[`IReassignmentResult`](IReassignmentResult.md)\>\>

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `request` | [`IReassignTask`](IReassignTask.md) |

#### Returns

`Promise`\<[`TaskResult`](../type-aliases/TaskResult.md)\<[`IReassignmentResult`](IReassignmentResult.md)\>\>

***

### reconcileListCompletions()

> **reconcileListCompletions**(`request`): `Promise`\<[`TaskResult`](../type-aliases/TaskResult.md)\<[`IListCompletionReport`](IListCompletionReport.md)\>\>

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `request` | [`IListCompletionRequest`](IListCompletionRequest.md) |

#### Returns

`Promise`\<[`TaskResult`](../type-aliases/TaskResult.md)\<[`IListCompletionReport`](IListCompletionReport.md)\>\>

***

### reconcileStop()

> **reconcileStop**(`request`): `Promise`\<[`TaskResult`](../type-aliases/TaskResult.md)\<[`IStopResult`](IStopResult.md)\>\>

The host's stop pump: one bounded pass over one intent under current authority — dispatching,
resolving and confirming — then the latest result. Installs no timer and starts no work. (T9.)

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `request` | [`IStopReconcileRequest`](IStopReconcileRequest.md) |

#### Returns

`Promise`\<[`TaskResult`](../type-aliases/TaskResult.md)\<[`IStopResult`](IStopResult.md)\>\>

***

### releaseStop()

> **releaseStop**(`request`): `Promise`\<[`TaskResult`](../type-aliases/TaskResult.md)\<[`IStopResult`](IStopResult.md)\>\>

Releases a stop's latch. Applied stops are not undone and commands already sent are not
retracted; nothing resumes. A cancel whose root is terminal cannot be released. (T9.)

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `request` | [`IReleaseStop`](IReleaseStop.md) |

#### Returns

`Promise`\<[`TaskResult`](../type-aliases/TaskResult.md)\<[`IStopResult`](IStopResult.md)\>\>

***

### reparent()

> **reparent**(`request`): `Promise`\<[`TaskResult`](../type-aliases/TaskResult.md)\<[`ITaskMutationResult`](ITaskMutationResult.md)\>\>

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `request` | [`IReparentTask`](IReparentTask.md) |

#### Returns

`Promise`\<[`TaskResult`](../type-aliases/TaskResult.md)\<[`ITaskMutationResult`](ITaskMutationResult.md)\>\>

***

### requestStop()

> **requestStop**(`request`): `Promise`\<[`TaskResult`](../type-aliases/TaskResult.md)\<[`IStopResult`](IStopResult.md)\>\>

Accepts a cascade stop of a task and its whole authoritative subtree (design § 10). The intent,
its complete target set and each target's command key are persisted — and the subtree frozen —
before anything is dispatched; nothing is dispatched here. **Acceptance is not completion**: the
result is `pending` until [IBoundTaskWriter.reconcileStop](#reconcilestop) confirms every target. (T9.)

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `request` | [`IStopRequest`](IStopRequest.md) |

#### Returns

`Promise`\<[`TaskResult`](../type-aliases/TaskResult.md)\<[`IStopResult`](IStopResult.md)\>\>

***

### resolveCommands()

> **resolveCommands**(`request`): `Promise`\<[`TaskResult`](../type-aliases/TaskResult.md)\<[`ICommandResolutionReport`](ICommandResolutionReport.md)\>\>

The uncertain-command pump: settles external commands left unsent or uncertain — by a lookup, a
deduplicated resend, or a first dispatch of an intent that was never sent — each re-authorized
for this principal at the dispatch boundary. Never re-sends a command its source cannot
deduplicate. Repository open never runs it.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `request` | [`ICommandResolutionRequest`](ICommandResolutionRequest.md) |

#### Returns

`Promise`\<[`TaskResult`](../type-aliases/TaskResult.md)\<[`ICommandResolutionReport`](ICommandResolutionReport.md)\>\>

***

### resumePendingRegistration()

> **resumePendingRegistration**(`taskId`): `Promise`\<[`TaskResult`](../type-aliases/TaskResult.md)\<[`ITaskMutationResult`](ITaskMutationResult.md)\>\>

Resumes a native registration left pending — accepted into the inventory and not yet marked
live; its first record may or may not have landed — from the canonical request the repository
stored with it, so a host that lost the original request can still finish it.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `taskId` | [`TaskId`](../type-aliases/TaskId.md) |

#### Returns

`Promise`\<[`TaskResult`](../type-aliases/TaskResult.md)\<[`ITaskMutationResult`](ITaskMutationResult.md)\>\>

#### Remarks

Nothing about authority is stored with the intent: `create` is authorized again now, against
this view's current policy, and the epoch it was authorized under is re-checked inside the
writer immediately before anything is committed. **It is authorized for the scopes that will be
committed.** When the first record already landed (its write succeeded, marking it live did
not), that record is committed as it is, so `create` is asked of the landed record's scopes,
which this view must select. Otherwise the record is written now with this view's creation
scopes (the stored request carries none). Storage independently refuses to adopt a landed
record whose scopes differ from the ones a registration was authorized for — which also covers
an identical `createTracked` retry from a view with other creation scopes.

The registration must have been accepted for this view's principal; another principal's is
`not-found-or-denied`, like an id with none. A registration an earlier resume committed — its
response lost — replays its stored receipt, re-authorized for the live task's scopes, as an
identical `createTracked` retry does.

A pending `register-external` registration is a trusted host operation with no authorization to
repeat; it resumes through `TaskBroker.resumePendingRegistration`, and is `invalid` here.
Withdrawing a pending identity, or recycling its slot, is not offered.

***

### updateTracked()

> **updateTracked**(`request`): `Promise`\<[`TaskResult`](../type-aliases/TaskResult.md)\<[`ITaskMutationResult`](ITaskMutationResult.md)\>\>

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `request` | [`IUpdateTrackedTask`](IUpdateTrackedTask.md) |

#### Returns

`Promise`\<[`TaskResult`](../type-aliases/TaskResult.md)\<[`ITaskMutationResult`](ITaskMutationResult.md)\>\>
