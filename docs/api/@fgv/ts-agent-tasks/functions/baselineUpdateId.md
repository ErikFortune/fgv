[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-agent-tasks](../README.md) / baselineUpdateId

# Function: baselineUpdateId()

> **baselineUpdateId**(`taskId`, `revision`): [`UpdateId`](../type-aliases/UpdateId.md)

The identity of a subscription's baseline obligation for one task revision (design § 9:
`(subscriptionId, taskId, revision, 'initial')`).

## Parameters

| Parameter | Type |
| ------ | ------ |
| `taskId` | [`TaskId`](../type-aliases/TaskId.md) |
| `revision` | [`TaskRevision`](../type-aliases/TaskRevision.md) |

## Returns

[`UpdateId`](../type-aliases/UpdateId.md)

## Remarks

The encoding is `<taskId>:<revision>:initial`. A baseline obligation lives in, and is acknowledged
through, its own subscription's record, so the subscription is the namespace rather than part of
the string. It can never equal a [taskUpdateId](taskUpdateId.md): that suffix ends in a digit, this one in a
word.
