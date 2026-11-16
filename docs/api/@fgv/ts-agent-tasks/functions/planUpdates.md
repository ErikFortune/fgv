[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-agent-tasks](../README.md) / planUpdates

# Function: planUpdates()

> **planUpdates**(`before`, `after`, `categories`, `audience`): readonly [`ITaskUpdate`](../interfaces/ITaskUpdate.md)[]

The immutable updates a committed revision owes, one per category, each carrying the
presentation snapshot of that revision.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `before` | [`ITaskEnvelope`](../interfaces/ITaskEnvelope.md) \| `undefined` |
| `after` | [`ITaskEnvelope`](../interfaces/ITaskEnvelope.md) |
| `categories` | readonly [`UpdateCategory`](../type-aliases/UpdateCategory.md)[] |
| `audience` | [`TaskAudienceResolver`](../type-aliases/TaskAudienceResolver.md) |

## Returns

readonly [`ITaskUpdate`](../interfaces/ITaskUpdate.md)[]

## Remarks

An update owed to no one is not retained: nobody could ever acknowledge it, and a subscription
created later starts from a baseline rather than back-history. So the result holds only
updates with a non-empty audience — which, once a repository has subscriptions, is most of them.
