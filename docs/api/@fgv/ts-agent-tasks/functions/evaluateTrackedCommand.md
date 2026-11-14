[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-agent-tasks](../README.md) / evaluateTrackedCommand

# Function: evaluateTrackedCommand()

> **evaluateTrackedCommand**(`envelope`, `command`, `options`): [`TrackedTransition`](../type-aliases/TrackedTransition.md)

Evaluates one `fgv.tracked@1` command against a task's current envelope.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `envelope` | [`ITaskEnvelope`](../interfaces/ITaskEnvelope.md) |
| `command` | [`TrackedCommand`](../type-aliases/TrackedCommand.md) |
| `options` | \{ `list`: `boolean`; \} |
| `options.list` | `boolean` |

## Returns

[`TrackedTransition`](../type-aliases/TrackedTransition.md)

## Remarks

The table (design §5):

| command | from | to |
|---|---|---|
| `start` | pending | running |
| `wait` | pending, running, paused (or waiting, with a different reason) | waiting |
| `pause` | pending, running, waiting (or paused, with a different reason) | paused |
| `resume` | waiting, paused | running |
| `succeed` / `fail` / `cancel` | any open state | the terminal state |
| `set-*` | any open state | the same state, field changed |

Restating the current state exactly is a no-op; terminal states are absorbing. A task list
(`list: true`) refuses [listRefusedCommands](../variables/listRefusedCommands.md) as `unsupported`.
