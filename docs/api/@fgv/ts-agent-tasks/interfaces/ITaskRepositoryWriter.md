[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-agent-tasks](../README.md) / ITaskRepositoryWriter

# Interface: ITaskRepositoryWriter

The exclusive, lifetime-bound writer a [ITaskRepository.withWriter](ITaskRepository.md#withwriter) callback receives.

## Remarks

Every method commits through the FileTree atomic boundary before it succeeds. Nothing here
is a transaction: a replacement that succeeded stays committed if a later step fails. Using
a handle after its callback has returned fails.

## Methods

### abandonReceipt()

> **abandonReceipt**(`request`): `Promise`\<[`TaskResult`](../type-aliases/TaskResult.md)\<[`ITaskConsumerRecord`](ITaskConsumerRecord.md)\>\>

Removes one issued manifest. What it named stays owed; history it produced stays.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `request` | [`ITaskReceiptAbandonment`](ITaskReceiptAbandonment.md) |

#### Returns

`Promise`\<[`TaskResult`](../type-aliases/TaskResult.md)\<[`ITaskConsumerRecord`](ITaskConsumerRecord.md)\>\>

***

### acknowledgeReceipt()

> **acknowledgeReceipt**(`request`): `Promise`\<[`TaskResult`](../type-aliases/TaskResult.md)\<[`ITaskAcknowledgementCommit`](ITaskAcknowledgementCommit.md)\>\>

Acknowledges exactly one unexpired issued manifest: its update ids, and no others, join the
subscription's history. A manifest already acknowledged replays without a write.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `request` | [`ITaskReceiptAcknowledgement`](ITaskReceiptAcknowledgement.md) |

#### Returns

`Promise`\<[`TaskResult`](../type-aliases/TaskResult.md)\<[`ITaskAcknowledgementCommit`](ITaskAcknowledgementCommit.md)\>\>

***

### closeSubscription()

> **closeSubscription**(`request`): `Promise`\<[`TaskResult`](../type-aliases/TaskResult.md)\<[`ITaskConsumerRecord`](ITaskConsumerRecord.md)\>\>

Closes a subscription: it joins no audience again and releases its delivery units; `retain`
keeps its owed obligations owed and drainable, `dispose` abandons its unacknowledged manifests and
disposes everything it is owed, in one write. Its record, identity slot and history are retained.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `request` | [`ITaskSubscriptionClosure`](ITaskSubscriptionClosure.md) |

#### Returns

`Promise`\<[`TaskResult`](../type-aliases/TaskResult.md)\<[`ITaskConsumerRecord`](ITaskConsumerRecord.md)\>\>

***

### commit()

> **commit**(`request`): `Promise`\<[`TaskResult`](../type-aliases/TaskResult.md)\<[`ITaskCommitRecord`](../type-aliases/ITaskCommitRecord.md)\>\>

Atomically replaces one task record: state, owed updates and dedup evidence together.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `request` | [`ITaskCommitRequest`](../type-aliases/ITaskCommitRequest.md) |

#### Returns

`Promise`\<[`TaskResult`](../type-aliases/TaskResult.md)\<[`ITaskCommitRecord`](../type-aliases/ITaskCommitRecord.md)\>\>

***

### commitSource()

> **commitSource**(`request`): `Promise`\<[`TaskResult`](../type-aliases/TaskResult.md)\<[`ITaskSourceRecord`](ITaskSourceRecord.md)\>\>

Creates or replaces a source's checkpoint record. Creation charges one `sources` identity,
retained for the repository's lifetime.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `request` | [`ITaskSourceCommitRequest`](ITaskSourceCommitRequest.md) |

#### Returns

`Promise`\<[`TaskResult`](../type-aliases/TaskResult.md)\<[`ITaskSourceRecord`](ITaskSourceRecord.md)\>\>

***

### disposeObligations()

> **disposeObligations**(`request`): `Promise`\<[`TaskResult`](../type-aliases/TaskResult.md)\<[`ITaskDispositionResult`](ITaskDispositionResult.md)\>\>

Ends obligations of one subscription without acknowledging them: each id joins its `disposed`
history with the reason, discharging it for that subscription alone.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `request` | [`ITaskObligationDisposal`](ITaskObligationDisposal.md) |

#### Returns

`Promise`\<[`TaskResult`](../type-aliases/TaskResult.md)\<[`ITaskDispositionResult`](ITaskDispositionResult.md)\>\>

#### Remarks

Every id must be owed to the subscription now, or already in its history (reported in
`alreadyDischarged`). An id an unacknowledged issued manifest names is refused (`conflict`) —
acknowledge or abandon that receipt first. Converts the reservation each obligation already holds;
it needs no new capacity.

***

### extendReplayEnvelope()

> **extendReplayEnvelope**(`taskId`, `add`): `Promise`\<[`TaskResult`](../type-aliases/TaskResult.md)\<[`ISourceReplayEnvelope`](ISourceReplayEnvelope.md)\>\>

Extends a task's `source-replay` envelope. New admission: the added updates and bytes are
charged against ordinary headroom now, before the producer relies on them, and refused with
`backpressure` when they do not fit. Fails for a task that holds no open envelope. Returns the
envelope the task now holds.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `taskId` | [`TaskId`](../type-aliases/TaskId.md) |
| `add` | [`ISourceReplayEnvelope`](ISourceReplayEnvelope.md) |

#### Returns

`Promise`\<[`TaskResult`](../type-aliases/TaskResult.md)\<[`ISourceReplayEnvelope`](ISourceReplayEnvelope.md)\>\>

***

### issueReceipt()

> **issueReceipt**(`request`): `Promise`\<[`TaskResult`](../type-aliases/TaskResult.md)\<[`ITaskConsumerRecord`](ITaskConsumerRecord.md)\>\>

Issues one exact receipt manifest into a subscription's record. Every update id it names must be
owed to the subscription or already acknowledged by it. Expired manifests are evicted in the same
write; at most `maxOutstandingReceiptsPerSubscription` unexpired ones are held.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `request` | [`ITaskReceiptIssue`](ITaskReceiptIssue.md) |

#### Returns

`Promise`\<[`TaskResult`](../type-aliases/TaskResult.md)\<[`ITaskConsumerRecord`](ITaskConsumerRecord.md)\>\>

***

### pruneTask()

> **pruneTask**(`taskId`): `Promise`\<[`TaskResult`](../type-aliases/TaskResult.md)\<[`ITaskCommitRecord`](../type-aliases/ITaskCommitRecord.md)\>\>

Prunes every update of one task whose audience has discharged it, by each audience member's
durable checkpoint, in one maintenance replacement; returns the record unchanged when nothing
qualifies. A checkpoint that cannot be read or verified fences and refuses.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `taskId` | [`TaskId`](../type-aliases/TaskId.md) |

#### Returns

`Promise`\<[`TaskResult`](../type-aliases/TaskResult.md)\<[`ITaskCommitRecord`](../type-aliases/ITaskCommitRecord.md)\>\>

***

### raiseCapacityLimits()

> **raiseCapacityLimits**(`profile`): `Promise`\<[`TaskResult`](../type-aliases/TaskResult.md)\<[`ITaskCapacityProfile`](ITaskCapacityProfile.md)\>\>

Raises the stored capacity limits. Every limit and bound must be at least its stored
value — lowering in place is unsupported. The policy is replaced atomically; no record is
migrated and nothing is reinterpreted.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `profile` | [`ITaskCapacityProfile`](ITaskCapacityProfile.md) |

#### Returns

`Promise`\<[`TaskResult`](../type-aliases/TaskResult.md)\<[`ITaskCapacityProfile`](ITaskCapacityProfile.md)\>\>

***

### readCommit()

> **readCommit**(`id`): `Promise`\<[`TaskResult`](../type-aliases/TaskResult.md)\<[`ITaskCommitRecord`](../type-aliases/ITaskCommitRecord.md) \| `undefined`\>\>

Reads a task's committed record, including one whose kind is not registered.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `id` | [`TaskId`](../type-aliases/TaskId.md) |

#### Returns

`Promise`\<[`TaskResult`](../type-aliases/TaskResult.md)\<[`ITaskCommitRecord`](../type-aliases/ITaskCommitRecord.md) \| `undefined`\>\>

***

### readSource()

> **readSource**(`sourceId`): `Promise`\<[`TaskResult`](../type-aliases/TaskResult.md)\<[`ITaskSourceRecord`](ITaskSourceRecord.md) \| `undefined`\>\>

Reads a source's committed checkpoint record, if it has one.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `sourceId` | `string` |

#### Returns

`Promise`\<[`TaskResult`](../type-aliases/TaskResult.md)\<[`ITaskSourceRecord`](ITaskSourceRecord.md) \| `undefined`\>\>

***

### readSubscription()

> **readSubscription**(`subscriptionId`): `Promise`\<[`TaskResult`](../type-aliases/TaskResult.md)\<[`ITaskConsumerRecord`](ITaskConsumerRecord.md) \| `undefined`\>\>

Reads a live subscription's record through the checkpoint store, checked against what was committed.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `subscriptionId` | [`SubscriptionId`](../type-aliases/SubscriptionId.md) |

#### Returns

`Promise`\<[`TaskResult`](../type-aliases/TaskResult.md)\<[`ITaskConsumerRecord`](ITaskConsumerRecord.md) \| `undefined`\>\>

***

### register()

> **register**(`request`): `Promise`\<[`TaskResult`](../type-aliases/TaskResult.md)\<[`ITaskCommitRecord`](../type-aliases/ITaskCommitRecord.md)\>\>

Registers a task through the ordered inventory protocol.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `request` | [`ITaskRegistrationRequest`](ITaskRegistrationRequest.md) |

#### Returns

`Promise`\<[`TaskResult`](../type-aliases/TaskResult.md)\<[`ITaskCommitRecord`](../type-aliases/ITaskCommitRecord.md)\>\>

***

### registerSubscription()

> **registerSubscription**(`request`): `Promise`\<[`TaskResult`](../type-aliases/TaskResult.md)\<[`ITaskConsumerRecord`](ITaskConsumerRecord.md)\>\>

Registers a subscription through the ordered inventory protocol — pending entry holding its
activation reservation, record through the checkpoint store, live entry — and activates it: from
the next commit, it is in the audience of every update its selection matches. (T7.)

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `request` | [`ITaskSubscriptionRegistration`](ITaskSubscriptionRegistration.md) |

#### Returns

`Promise`\<[`TaskResult`](../type-aliases/TaskResult.md)\<[`ITaskConsumerRecord`](ITaskConsumerRecord.md)\>\>

#### Remarks

Refused before anything is written when it would take any task's potential audience past
`maxAudiencePerUpdate`, when it promises `source-replay` over an external task admitted without a
finite envelope, when its policy is more durable than the repository, or when its baseline is not
the committed state of tasks its selection matches. A retry with the same identity resumes or
replays; anything else under the subscription id conflicts.

***

### setSubscriptionDrain()

> **setSubscriptionDrain**(`request`): `Promise`\<[`TaskResult`](../type-aliases/TaskResult.md)\<[`ITaskConsumerRecord`](ITaskConsumerRecord.md)\>\>

Replaces a subscription's drain principals and policy identity, active or closed. Changes
nothing — and writes nothing — when both already stand as asked.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `request` | [`ITaskSubscriptionDrainChange`](ITaskSubscriptionDrainChange.md) |

#### Returns

`Promise`\<[`TaskResult`](../type-aliases/TaskResult.md)\<[`ITaskConsumerRecord`](ITaskConsumerRecord.md)\>\>
