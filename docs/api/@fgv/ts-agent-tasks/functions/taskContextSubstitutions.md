[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-agent-tasks](../README.md) / taskContextSubstitutions

# Function: taskContextSubstitutions()

> **taskContextSubstitutions**(`context`, `slot?`): `PromptSubstitutions`

The literal substitution that puts a rendered context's text into the task-context slot.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `context` | `Pick`\<[`ITaskContext`](../interfaces/ITaskContext.md), `"text"`\> |
| `slot?` | `SlotName` |

## Returns

`PromptSubstitutions`

## Remarks

The text only: the context's inclusion receipt never enters a substitution, the body or any
prompt-assist trace. The directive is `'prose'`, the default literal framing; the trust framing
is the renderer's own, inside the text.
