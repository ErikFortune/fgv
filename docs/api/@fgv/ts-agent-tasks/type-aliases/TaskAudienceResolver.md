[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-agent-tasks](../README.md) / TaskAudienceResolver

# Type Alias: TaskAudienceResolver

> **TaskAudienceResolver** = (`before`, `after`, `category`) => `ReadonlyArray`\<[`SubscriptionId`](SubscriptionId.md)\>

Who is owed an update: the subscriptions whose selection matched the task before **or** after
the change, so an exit from a selection is still delivered.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `before` | [`ITaskEnvelope`](../interfaces/ITaskEnvelope.md) \| `undefined` |
| `after` | [`ITaskEnvelope`](../interfaces/ITaskEnvelope.md) |
| `category` | [`UpdateCategory`](UpdateCategory.md) |

## Returns

`ReadonlyArray`\<[`SubscriptionId`](SubscriptionId.md)\>

## Remarks

The broker's resolver is its repository's `audience`, which every commit is verified against: an
update naming any other audience is refused (T7).
