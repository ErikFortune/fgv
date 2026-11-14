[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-agent-tasks](../README.md) / taskUpdateId

# Function: taskUpdateId()

> **taskUpdateId**(`taskId`, `revision`, `category`): [`UpdateId`](../type-aliases/UpdateId.md)

The canonical identity of the update a task owes for one `(revision, category)`.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `taskId` | [`TaskId`](../type-aliases/TaskId.md) |
| `revision` | [`TaskRevision`](../type-aliases/TaskRevision.md) |
| `category` | [`UpdateCategory`](../type-aliases/UpdateCategory.md) |

## Returns

[`UpdateId`](../type-aliases/UpdateId.md)

## Remarks

Design §8.3: "a collision-free tuple encoding of task ID, task revision and category
ordinal; never a timestamp or CRC". The encoding is `<taskId>:<revision>:<ordinal>`. A task
id may itself contain `:`, but the revision and ordinal are digit-only and are read from
the right, so two distinct tuples can never produce the same string.

Storage checks every stored update against this encoding, so an update id that disagrees
with the task, revision or category it names is an integrity failure rather than a second,
silently different identity. (T3: the update-id bound grew by
[maxUpdateIdSuffixLength](../variables/maxUpdateIdSuffixLength.md) so a maximum-length task id still has one.)
