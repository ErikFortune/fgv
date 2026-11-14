[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-agent-tasks](../README.md) / ITaskCheckpointStore

# Interface: ITaskCheckpointStore

The persistence port under a repository's subscription records (design § 9,
`IConsumerCheckpointStore`).

## Remarks

Injected into the repository, which stays the one coordinator: every call happens under its
single writer, and everything the store returns is validated rather than trusted. A store that
throws, returns a record for another subscription, returns something other than the record last
written, or claims a write it did not make is detected — at the call, or at the next read — and
fails closed: nothing acknowledgeable is produced from it, and the repository fences.

`durability` is the guarantee the store gives a successful `write`. A repository opened
`process-crash` refuses a `session` store: a weak checkpoint cannot be paired with durable task
state.

Synchronous, like the rest of the storage layer. (T7: the design sketch's store is asynchronous;
the repository's open scan and commit path are synchronous throughout, and making them async to
accommodate a store no consumer has asked for would widen every caller.)

## Properties

| Property | Modifier | Type |
| ------ | ------ | ------ |
| <a id="property-durability"></a> `durability` | `readonly` | `"session"` \| `"process-crash"` |

## Methods

### read()

> **read**(`subscriptionId`): [`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<`unknown`\>

The stored record, or `undefined` when there is none. Validated by the repository.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `subscriptionId` | [`SubscriptionId`](../type-aliases/SubscriptionId.md) |

#### Returns

[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<`unknown`\>

***

### write()

> **write**(`subscriptionId`, `expectedRecordRevision`, `record`): [`DetailedResult`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`true`, [`CheckpointWriteVisibility`](../type-aliases/CheckpointWriteVisibility.md)\>

Replaces the record, which must currently be at `expectedRecordRevision` (`0`: absent). A
failure's detail says whether the store is sure nothing changed (`unchanged`) or cannot say
(`unknown`); only `unchanged` leaves the repository usable.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `subscriptionId` | [`SubscriptionId`](../type-aliases/SubscriptionId.md) |
| `expectedRecordRevision` | `number` |
| `record` | [`ITaskConsumerRecord`](ITaskConsumerRecord.md) |

#### Returns

[`DetailedResult`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`true`, [`CheckpointWriteVisibility`](../type-aliases/CheckpointWriteVisibility.md)\>
