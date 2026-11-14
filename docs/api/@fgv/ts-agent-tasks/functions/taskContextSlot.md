[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-agent-tasks](../README.md) / taskContextSlot

# Function: taskContextSlot()

> **taskContextSlot**(`params?`): `IPromptSlot`

Declares the trailing task-context slot.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `params?` | [`ITaskContextSlotParams`](../interfaces/ITaskContextSlotParams.md) |

## Returns

`IPromptSlot`

## Remarks

Required, and declared `'per-request'` — task context changes on every request, and saying so is
what lets everything before it cache. It has no default binding: a resolve with no task context
fails rather than rendering an empty slot that looks like "no tasks".
