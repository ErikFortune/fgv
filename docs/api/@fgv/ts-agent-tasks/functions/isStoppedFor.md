[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-agent-tasks](../README.md) / isStoppedFor

# Function: isStoppedFor()

> **isStoppedFor**(`mode`, `status`): `boolean`

Whether a lifecycle status is in the stopped set a mode requires: paused or terminal for `pause`,
terminal for `cancel` (which may have succeeded or failed before cancellation won).

## Parameters

| Parameter | Type |
| ------ | ------ |
| `mode` | [`StopMode`](../type-aliases/StopMode.md) |
| `status` | [`TaskLifecycleStatus`](../type-aliases/TaskLifecycleStatus.md) |

## Returns

`boolean`
