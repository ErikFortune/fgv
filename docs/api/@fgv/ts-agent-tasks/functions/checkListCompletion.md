[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-agent-tasks](../README.md) / checkListCompletion

# Function: checkListCompletion()

> **checkListCompletion**(`listId`, `children`, `requireChild`): [`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<`number`\>

Decides whether a task list may succeed, from its **complete authoritative** child set.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `listId` | [`TaskId`](../type-aliases/TaskId.md) |
| `children` | readonly [`ITaskChildState`](../interfaces/ITaskChildState.md)[] |
| `requireChild` | `boolean` |

## Returns

[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<`number`\>

## Remarks

`children` must be every retained child — archived, unresolved, quarantined and hidden ones
included — never a view's filtered tree. Every child must be resolved and succeeded: an
unresolved or unreadable child has no lifecycle to count, and a failed or cancelled child
leaves the list open for host action. With `requireChild`, an empty list is refused (the pump's
rule: automatic completion needs at least one child; an empty list completes only
explicitly). Succeeds with the number of children counted.
