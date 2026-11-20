[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-agent-tasks](../README.md) / FileTreeTaskRepository

# Class: FileTreeTaskRepository

The FileTree task repository: one implementation over any root that offers the FileTree
atomic-write capability.

## Remarks

A single writer per root. Each task's state, owed updates and operation dedup evidence live
in one record and are replaced together through one atomic write; nothing is acknowledged
before that write has crossed the FileTree boundary at the repository's guarantee.
Registration uses the ordered inventory protocol — pending entry, then record, then live
entry — so a missing accepted record is always detectable and a pending one always
recoverable. See the `storage` section of the package's `CAPABILITIES.md` for what each
guarantee rests on.

## Implements

- [`ITaskRepository`](../interfaces/ITaskRepository.md)

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="property-mode"></a> `mode` | `public readonly` | [`TaskRepositoryMode`](../type-aliases/TaskRepositoryMode.md) | ITaskRepository.mode |
| <a id="property-repositoryid"></a> `repositoryId` | `public readonly` | `string` | ITaskRepository.repositoryId |

## Accessors

### profile

#### Get Signature

> **get** **profile**(): [`ITaskCapacityProfile`](../interfaces/ITaskCapacityProfile.md)

The stored capacity profile governing admission.

##### Returns

[`ITaskCapacityProfile`](../interfaces/ITaskCapacityProfile.md)

The stored capacity profile governing admission.

#### Implementation of

[`ITaskRepository`](../interfaces/ITaskRepository.md).[`profile`](../interfaces/ITaskRepository.md#property-profile)

***

### registry

#### Get Signature

> **get** **registry**(): [`ITaskKindRegistry`](../interfaces/ITaskKindRegistry.md)

The frozen kind registry the repository validates details and command schemas with.

##### Returns

[`ITaskKindRegistry`](../interfaces/ITaskKindRegistry.md)

The frozen kind registry the repository validates details and command schemas with.

#### Implementation of

[`ITaskRepository`](../interfaces/ITaskRepository.md).[`registry`](../interfaces/ITaskRepository.md#property-registry)

***

### report

#### Get Signature

> **get** **report**(): [`ITaskRecoveryReport`](../interfaces/ITaskRecoveryReport.md)

What open found and did.

##### Returns

[`ITaskRecoveryReport`](../interfaces/ITaskRecoveryReport.md)

What open found and did.

#### Implementation of

[`ITaskRepository`](../interfaces/ITaskRepository.md).[`report`](../interfaces/ITaskRepository.md#property-report)

## Methods

### audience()

> **audience**(`before`, `after`, `category`): readonly [`SubscriptionId`](../type-aliases/SubscriptionId.md)[]

The subscriptions an update of `category` is owed to at a commit from `before` to `after`: every
active subscription taking the category whose selection matches either. Every commit's new
updates must name exactly this audience. (T7.)

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `before` | [`ITaskEnvelope`](../interfaces/ITaskEnvelope.md) \| `undefined` |
| `after` | [`ITaskEnvelope`](../interfaces/ITaskEnvelope.md) |
| `category` | [`UpdateCategory`](../type-aliases/UpdateCategory.md) |

#### Returns

readonly [`SubscriptionId`](../type-aliases/SubscriptionId.md)[]

#### Implementation of

[`ITaskRepository`](../interfaces/ITaskRepository.md).[`audience`](../interfaces/ITaskRepository.md#audience)

***

### capacityStatus()

> **capacityStatus**(): [`TaskResult`](../type-aliases/TaskResult.md)\<[`ITaskCapacityStatus`](../interfaces/ITaskCapacityStatus.md)\>

Trusted host capacity status. Never for a model-facing tool.

#### Returns

[`TaskResult`](../type-aliases/TaskResult.md)\<[`ITaskCapacityStatus`](../interfaces/ITaskCapacityStatus.md)\>

#### Implementation of

[`ITaskRepository`](../interfaces/ITaskRepository.md).[`capacityStatus`](../interfaces/ITaskRepository.md#capacitystatus)

***

### childStates()

> **childStates**(`parentId`): `Promise`\<[`TaskResult`](../type-aliases/TaskResult.md)\<readonly [`ITaskChildState`](../interfaces/ITaskChildState.md)[]\>\>

Every retained child of a live task, from the resident graph: archived, unresolved and
quarantined children included, ordered by id. Reads no record.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `parentId` | [`TaskId`](../type-aliases/TaskId.md) |

#### Returns

`Promise`\<[`TaskResult`](../type-aliases/TaskResult.md)\<readonly [`ITaskChildState`](../interfaces/ITaskChildState.md)[]\>\>

#### Remarks

The authoritative child set, never a filtered tree — list completion and relationship rules
are decided from it. Fails `not-found-or-denied` when `parentId` is not a live task. A trusted
host API: it is not an authorization boundary and says nothing about who may see a child.

#### Implementation of

[`ITaskRepository`](../interfaces/ITaskRepository.md).[`childStates`](../interfaces/ITaskRepository.md#childstates)

***

### close()

> **close**(): [`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<`boolean`\>

Releases the root. Every later call fails. Refused (`conflict`, `retry: 'safe'`) while a
`withWriter` callback is active: the root is not released under a writer.

#### Returns

[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<`boolean`\>

#### Implementation of

[`ITaskRepository`](../interfaces/ITaskRepository.md).[`close`](../interfaces/ITaskRepository.md#close)

***

### health()

> **health**(): [`ITaskRepositoryHealth`](../interfaces/ITaskRepositoryHealth.md)

ITaskRepository.health

#### Returns

[`ITaskRepositoryHealth`](../interfaces/ITaskRepositoryHealth.md)

#### Implementation of

[`ITaskRepository`](../interfaces/ITaskRepository.md).[`health`](../interfaces/ITaskRepository.md#health)

***

### listCompletionCandidates()

> **listCompletionCandidates**(`request`): `Promise`\<[`TaskResult`](../type-aliases/TaskResult.md)\<readonly [`TaskId`](../type-aliases/TaskId.md)[]\>\>

List-completion candidates, ordered by id: open task lists that complete automatically, have
at least one child, and whose every child — archived ones included — has succeeded.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `request` | [`IListCompletionCandidateQuery`](../interfaces/IListCompletionCandidateQuery.md) |

#### Returns

`Promise`\<[`TaskResult`](../type-aliases/TaskResult.md)\<readonly [`TaskId`](../type-aliases/TaskId.md)[]\>\>

#### Remarks

Maintained by every commit and rebuilt from the records at open and by
[ITaskRepository.rebuildIndexes](../interfaces/ITaskRepository.md#rebuildindexes), so a crash between a last child's success and its
list's completion leaves a discoverable candidate. A candidate is a hint, not a decision: the
completing writer rechecks it.

#### Implementation of

[`ITaskRepository`](../interfaces/ITaskRepository.md).[`listCompletionCandidates`](../interfaces/ITaskRepository.md#listcompletioncandidates)

***

### listOwed()

> **listOwed**(`request`): `Promise`\<[`TaskResult`](../type-aliases/TaskResult.md)\<[`IOwedUpdatePage`](../interfaces/IOwedUpdatePage.md)\>\>

One page of the updates a subscription is owed, including terminal and archived tasks'
obligations. Reads no task record and no lifecycle index.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `request` | [`IOwedUpdateQuery`](../interfaces/IOwedUpdateQuery.md) |

#### Returns

`Promise`\<[`TaskResult`](../type-aliases/TaskResult.md)\<[`IOwedUpdatePage`](../interfaces/IOwedUpdatePage.md)\>\>

#### Implementation of

[`ITaskRepository`](../interfaces/ITaskRepository.md).[`listOwed`](../interfaces/ITaskRepository.md#listowed)

***

### lookupSource()

> **lookupSource**(`binding`): `Promise`\<[`TaskResult`](../type-aliases/TaskResult.md)\<[`TaskId`](../type-aliases/TaskId.md) \| `undefined`\>\>

The retained task — archived included — bound to a source binding, if any. A binding is
bound to at most one retained task.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `binding` | [`ISourceBinding`](../interfaces/ISourceBinding.md) |

#### Returns

`Promise`\<[`TaskResult`](../type-aliases/TaskResult.md)\<[`TaskId`](../type-aliases/TaskId.md) \| `undefined`\>\>

#### Implementation of

[`ITaskRepository`](../interfaces/ITaskRepository.md).[`lookupSource`](../interfaces/ITaskRepository.md#lookupsource)

***

### outstanding()

> **outstanding**(`request?`): [`TaskResult`](../type-aliases/TaskResult.md)\<[`ITaskOutstandingReport`](../interfaces/ITaskOutstandingReport.md)\>

Every incomplete operation the repository holds, each list bounded by `limit` (default and maximum
200): pending registrations and subscriptions, unsettled and feed-awaiting commands, prunable
tasks, and what each retained subscription is still owed. Answered from resident state. Trusted
host API.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `request?` | \{ `limit?`: `number`; \} |
| `request.limit?` | `number` |

#### Returns

[`TaskResult`](../type-aliases/TaskResult.md)\<[`ITaskOutstandingReport`](../interfaces/ITaskOutstandingReport.md)\>

#### Implementation of

[`ITaskRepository`](../interfaces/ITaskRepository.md).[`outstanding`](../interfaces/ITaskRepository.md#outstanding)

***

### pendingRegistration()

> **pendingRegistration**(`taskId`): [`TaskResult`](../type-aliases/TaskResult.md)\<[`ITaskPendingRegistration`](../interfaces/ITaskPendingRegistration.md) \| `undefined`\>

A registration that is still pending — accepted into the inventory and not yet marked live; its
first record may have landed (`landedScopes`) or not — with the identity and canonical creation
request it was accepted with, so it can be resumed.
`undefined` when `taskId` names no pending registration, including a task that is already live.
Answered from resident state. Trusted host API: a request may name tasks a principal cannot see.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `taskId` | [`TaskId`](../type-aliases/TaskId.md) |

#### Returns

[`TaskResult`](../type-aliases/TaskResult.md)\<[`ITaskPendingRegistration`](../interfaces/ITaskPendingRegistration.md) \| `undefined`\>

#### Implementation of

[`ITaskRepository`](../interfaces/ITaskRepository.md).[`pendingRegistration`](../interfaces/ITaskRepository.md#pendingregistration)

***

### prunableTasks()

> **prunableTasks**(`request`): `Promise`\<[`TaskResult`](../type-aliases/TaskResult.md)\<readonly [`TaskId`](../type-aliases/TaskId.md)[]\>\>

Tasks retaining an update every audience member has discharged, by the committed checkpoints —
the cleanup candidates — ordered by id. A hint: pruning re-verifies the durable evidence, and
leaves an update an unacknowledged receipt still names.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `request` | [`IListCompletionCandidateQuery`](../interfaces/IListCompletionCandidateQuery.md) |

#### Returns

`Promise`\<[`TaskResult`](../type-aliases/TaskResult.md)\<readonly [`TaskId`](../type-aliases/TaskId.md)[]\>\>

#### Implementation of

[`ITaskRepository`](../interfaces/ITaskRepository.md).[`prunableTasks`](../interfaces/ITaskRepository.md#prunabletasks)

***

### query()

> **query**(`request`): `Promise`\<[`TaskResult`](../type-aliases/TaskResult.md)\<[`ITaskPage`](../interfaces/ITaskPage.md)\>\>

One page of non-archived tasks matching a selection, ordered by task id.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `request` | [`ITaskQuery`](../interfaces/ITaskQuery.md) |

#### Returns

`Promise`\<[`TaskResult`](../type-aliases/TaskResult.md)\<[`ITaskPage`](../interfaces/ITaskPage.md)\>\>

#### Remarks

Answered from resident indexes: a warm query reads no task record. Scopes are a union,
deduplicated before paging; unresolved references that match are returned separately and
make the page `partial`. The cursor is valid only at the page's generation — any committed
change restarts paging (`cursor-stale`), and a cursor presented with a different query is
`invalid`. This is a trusted host API, not an authorization boundary.

#### Implementation of

[`ITaskRepository`](../interfaces/ITaskRepository.md).[`query`](../interfaces/ITaskRepository.md#query)

***

### queryDue()

> **queryDue**(`request`): `Promise`\<[`TaskResult`](../type-aliases/TaskResult.md)\<[`ITaskPage`](../interfaces/ITaskPage.md)\>\>

One page of due candidates: waiting tasks whose `notBefore` is present and at or before the
cutoff, ordered by `(notBefore, taskId)`. Never starts or changes a task.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `request` | [`IDueTaskQuery`](../interfaces/IDueTaskQuery.md) |

#### Returns

`Promise`\<[`TaskResult`](../type-aliases/TaskResult.md)\<[`ITaskPage`](../interfaces/ITaskPage.md)\>\>

#### Implementation of

[`ITaskRepository`](../interfaces/ITaskRepository.md).[`queryDue`](../interfaces/ITaskRepository.md#querydue)

***

### read()

> **read**(`id`): `Promise`\<[`TaskResult`](../type-aliases/TaskResult.md)\<[`TaskRegistrationResult`](../type-aliases/TaskRegistrationResult.md) \| `undefined`\>\>

Reads a live task. `undefined` when the inventory does not name it as live — including a
registration still pending. Fails `unknown-kind-version` for a quarantined record.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `id` | [`TaskId`](../type-aliases/TaskId.md) |

#### Returns

`Promise`\<[`TaskResult`](../type-aliases/TaskResult.md)\<[`TaskRegistrationResult`](../type-aliases/TaskRegistrationResult.md) \| `undefined`\>\>

#### Implementation of

[`ITaskRepository`](../interfaces/ITaskRepository.md).[`read`](../interfaces/ITaskRepository.md#read)

***

### readCommit()

> **readCommit**(`id`): `Promise`\<[`TaskResult`](../type-aliases/TaskResult.md)\<[`ITaskCommitRecord`](../type-aliases/ITaskCommitRecord.md) \| `undefined`\>\>

Reads a live task's committed record.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `id` | [`TaskId`](../type-aliases/TaskId.md) |

#### Returns

`Promise`\<[`TaskResult`](../type-aliases/TaskResult.md)\<[`ITaskCommitRecord`](../type-aliases/ITaskCommitRecord.md) \| `undefined`\>\>

#### Implementation of

[`ITaskRepository`](../interfaces/ITaskRepository.md).[`readCommit`](../interfaces/ITaskRepository.md#readcommit)

***

### readSource()

> **readSource**(`sourceId`): `Promise`\<[`TaskResult`](../type-aliases/TaskResult.md)\<[`ITaskSourceRecord`](../interfaces/ITaskSourceRecord.md) \| `undefined`\>\>

A source's committed checkpoint record, if it has one. Reads no task record.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `sourceId` | `string` |

#### Returns

`Promise`\<[`TaskResult`](../type-aliases/TaskResult.md)\<[`ITaskSourceRecord`](../interfaces/ITaskSourceRecord.md) \| `undefined`\>\>

#### Implementation of

[`ITaskRepository`](../interfaces/ITaskRepository.md).[`readSource`](../interfaces/ITaskRepository.md#readsource)

***

### rebuildIndexes()

> **rebuildIndexes**(): `Promise`\<[`TaskResult`](../type-aliases/TaskResult.md)\<[`ITaskRepositoryHealth`](../interfaces/ITaskRepositoryHealth.md)\>\>

Discards the resident indexes and rebuilds them from the committed records, in bounded
sequential passes.

#### Returns

`Promise`\<[`TaskResult`](../type-aliases/TaskResult.md)\<[`ITaskRepositoryHealth`](../interfaces/ITaskRepositoryHealth.md)\>\>

#### Remarks

The way out of a fence. The old index and every cursor are released before the new
generation is built; queries are fenced while it runs. A root that no longer validates leaves
the repository `unavailable` with the problems listed — it never becomes healthy and empty.
Refused (`conflict`, `retry: 'safe'`) while a writer is active.

#### Implementation of

[`ITaskRepository`](../interfaces/ITaskRepository.md).[`rebuildIndexes`](../interfaces/ITaskRepository.md#rebuildindexes)

***

### stopLatches()

> **stopLatches**(`taskId`): readonly [`IStopLatch`](../interfaces/IStopLatch.md)[]

The stop latches a task is under, from the resident stop book — rebuilt from the records before a
reopened repository accepts a write. Every commit is also checked against them. None while the
index is being rebuilt, when no write is accepted either. (T9.)

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `taskId` | [`TaskId`](../type-aliases/TaskId.md) |

#### Returns

readonly [`IStopLatch`](../interfaces/IStopLatch.md)[]

#### Implementation of

[`ITaskRepository`](../interfaces/ITaskRepository.md).[`stopLatches`](../interfaces/ITaskRepository.md#stoplatches)

***

### subscription()

> **subscription**(`subscriptionId`): [`TaskResult`](../type-aliases/TaskResult.md)\<[`ITaskSubscription`](../interfaces/ITaskSubscription.md) \| `undefined`\>

A retained subscription's resident descriptor — active or closed, never its history.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `subscriptionId` | [`SubscriptionId`](../type-aliases/SubscriptionId.md) |

#### Returns

[`TaskResult`](../type-aliases/TaskResult.md)\<[`ITaskSubscription`](../interfaces/ITaskSubscription.md) \| `undefined`\>

#### Implementation of

[`ITaskRepository`](../interfaces/ITaskRepository.md).[`subscription`](../interfaces/ITaskRepository.md#subscription)

***

### subtree()

> **subtree**(`rootId`, `limit`): [`TaskResult`](../type-aliases/TaskResult.md)\<readonly [`TaskId`](../type-aliases/TaskId.md)[]\>

The authoritative subtree of a live task — itself first, then breadth-first with task-id tie
breaks — over every retained descendant, archived, unresolved and quarantined ones included, from
the resident graph. Fails `invalid` when it holds more than `limit` tasks: never truncated. (T9.)

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `rootId` | [`TaskId`](../type-aliases/TaskId.md) |
| `limit` | `number` |

#### Returns

[`TaskResult`](../type-aliases/TaskResult.md)\<readonly [`TaskId`](../type-aliases/TaskId.md)[]\>

#### Implementation of

[`ITaskRepository`](../interfaces/ITaskRepository.md).[`subtree`](../interfaces/ITaskRepository.md#subtree)

***

### supersedable()

> **supersedable**(`update`, `audience`): `boolean`

Whether a newer routine update of the same category, owed to `audience`, may supersede `update`
(design § 9, coalescing): its category is not required (a required update is never superseded),
and every member still owed it is active, takes coalescing, is in `audience`, and has no
unacknowledged receipt naming it. Answered from resident state for planning; the commit re-decides
from durable evidence.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `update` | [`ITaskUpdate`](../interfaces/ITaskUpdate.md) |
| `audience` | readonly [`SubscriptionId`](../type-aliases/SubscriptionId.md)[] |

#### Returns

`boolean`

#### Implementation of

[`ITaskRepository`](../interfaces/ITaskRepository.md).[`supersedable`](../interfaces/ITaskRepository.md#supersedable)

***

### unsettledCommands()

> **unsettledCommands**(`request`): `Promise`\<[`TaskResult`](../type-aliases/TaskResult.md)\<readonly [`TaskId`](../type-aliases/TaskId.md)[]\>\>

Tasks holding an external command whose dispatch is not settled — an intent never sent, or a
send whose outcome is unknown — ordered by id. Answered from the resident index, rebuilt from
the records at open, so a crash between marker and result leaves a discoverable command.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `request` | [`IListCompletionCandidateQuery`](../interfaces/IListCompletionCandidateQuery.md) |

#### Returns

`Promise`\<[`TaskResult`](../type-aliases/TaskResult.md)\<readonly [`TaskId`](../type-aliases/TaskId.md)[]\>\>

#### Implementation of

[`ITaskRepository`](../interfaces/ITaskRepository.md).[`unsettledCommands`](../interfaces/ITaskRepository.md#unsettledcommands)

***

### withWriter()

> **withWriter**\<`T`\>(`action`): `Promise`\<[`TaskResult`](../type-aliases/TaskResult.md)\<`T`\>\>

Runs `action` with the exclusive writer. Fails without calling `action` when a writer is
already active — nesting is rejected, and a concurrent caller retries.

#### Type Parameters

| Type Parameter |
| ------ |
| <a id="type-parameter-t"></a> `T` |

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `action` | (`writer`) => `Promise`\<[`TaskResult`](../type-aliases/TaskResult.md)\<`T`\>\> |

#### Returns

`Promise`\<[`TaskResult`](../type-aliases/TaskResult.md)\<`T`\>\>

#### Implementation of

[`ITaskRepository`](../interfaces/ITaskRepository.md).[`withWriter`](../interfaces/ITaskRepository.md#withwriter)

***

### initialize()

> `static` **initialize**(`params`): `Promise`\<[`TaskResult`](../type-aliases/TaskResult.md)\<[`ITaskRepository`](../interfaces/ITaskRepository.md)\>\>

Creates a new repository in an empty root.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `params` | [`ITaskRepositoryOpenParams`](../interfaces/ITaskRepositoryOpenParams.md) |

#### Returns

`Promise`\<[`TaskResult`](../type-aliases/TaskResult.md)\<[`ITaskRepository`](../interfaces/ITaskRepository.md)\>\>

#### Remarks

The root must be empty apart from working files an interrupted atomic write left behind,
which are reclaimed first. A root holding anything else is refused: initialization never
adopts existing content. The capacity profile defaults to `defaultTaskCapacityProfile` and
is stored, so later host defaults cannot reinterpret it.

***

### open()

> `static` **open**(`params`): `Promise`\<[`TaskResult`](../type-aliases/TaskResult.md)\<[`TaskRepositoryOpenResult`](../type-aliases/TaskRepositoryOpenResult.md)\>\>

Opens an existing repository.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `params` | [`ITaskRepositoryOpenParams`](../interfaces/ITaskRepositoryOpenParams.md) |

#### Returns

`Promise`\<[`TaskResult`](../type-aliases/TaskResult.md)\<[`TaskRepositoryOpenResult`](../type-aliases/TaskRepositoryOpenResult.md)\>\>

#### Remarks

Succeeds with `state: 'ready'` and a writable repository, or with
`state: 'recovery-required'` and a read-only diagnostic handle when validation finds a
blocking problem. Fails outright — writing nothing — when the root holds no repository,
cannot honor the requested mode, is already open in this process, or when the requested
capacity profile differs from the stored one. Never starts or reattaches external work.

***

### openOrInitialize()

> `static` **openOrInitialize**(`params`): `Promise`\<[`TaskResult`](../type-aliases/TaskResult.md)\<[`TaskRepositoryOpenOrInitializeResult`](../type-aliases/TaskRepositoryOpenOrInitializeResult.md)\>\>

Opens the repository a root holds, or initializes one when the root is empty.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `params` | [`ITaskRepositoryOpenParams`](../interfaces/ITaskRepositoryOpenParams.md) |

#### Returns

`Promise`\<[`TaskResult`](../type-aliases/TaskResult.md)\<[`TaskRepositoryOpenOrInitializeResult`](../type-aliases/TaskRepositoryOpenOrInitializeResult.md)\>\>

#### Remarks

The choice is made under the exclusive ownership `open` and `initialize` both take, after
interrupted writes' working files are reclaimed, by `initialize`'s own emptiness test: a root
that holds nothing else — no files and no directories — is initialized; anything else is opened,
exactly as [FileTreeTaskRepository.open](#open) would, including `recovery-required` for a root
whose repository is damaged or whose manifest is missing. Nothing is repaired, and nothing can
land in the root between the decision and the operation it chooses.
