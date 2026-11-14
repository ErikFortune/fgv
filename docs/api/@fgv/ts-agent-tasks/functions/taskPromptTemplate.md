[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-agent-tasks](../README.md) / taskPromptTemplate

# Function: taskPromptTemplate()

> **taskPromptTemplate**(`params`): [`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<`string`\>

Builds a body template in the one order that lets a prompt's stable prefix cache: fixed
instructions, fixed data-interpretation rules, the host's stable slots, then the task-context
slot — last, with nothing after it.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `params` | [`ITaskPromptTemplateParams`](../interfaces/ITaskPromptTemplateParams.md) |

## Returns

[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<`string`\>

## Remarks

Parts are separated by a blank line. Fails if the literal text could form a Mustache tag (`{{` or
`}}`), if a slot name is not a Mustache name, or if a host slot reuses the task slot's name — two interpolations of one name would put
task context in the body twice.
