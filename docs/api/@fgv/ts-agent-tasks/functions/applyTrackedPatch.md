[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-agent-tasks](../README.md) / applyTrackedPatch

# Function: applyTrackedPatch()

> **applyTrackedPatch**(`envelope`, `patch`): [`TrackedTransition`](../type-aliases/TrackedTransition.md)

Applies a patch of presentable fields. Permitted in open states only: a terminal task's
execution presentation is immutable. Fields equal to their current value do not count.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `envelope` | [`ITaskEnvelope`](../interfaces/ITaskEnvelope.md) |
| `patch` | [`ITrackedTaskPatch`](../interfaces/ITrackedTaskPatch.md) |

## Returns

[`TrackedTransition`](../type-aliases/TrackedTransition.md)
