[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-agent-tasks](../README.md) / availableTrackedCommands

# Function: availableTrackedCommands()

> **availableTrackedCommands**(`status`, `options`): readonly (`"pause"` \| `"start"` \| `"cancel"` \| `"resume"` \| `"fail"` \| `"wait"` \| `"succeed"` \| `"set-title"` \| `"set-description"` \| `"set-progress"` \| `"set-attention"`)[]

The commands a task in this state could run without being refused by the transition table,
before any authorization.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `status` | [`TaskLifecycleStatus`](../type-aliases/TaskLifecycleStatus.md) |
| `options` | \{ `list`: `boolean`; \} |
| `options.list` | `boolean` |

## Returns

readonly (`"pause"` \| `"start"` \| `"cancel"` \| `"resume"` \| `"fail"` \| `"wait"` \| `"succeed"` \| `"set-title"` \| `"set-description"` \| `"set-progress"` \| `"set-attention"`)[]
