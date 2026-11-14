[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-extras](../../../README.md) / [AiAssist](../README.md) / mcpTaskSupport

# Variable: mcpTaskSupport

> `const` **mcpTaskSupport**: [`Converter`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`McpTaskSupport`](../type-aliases/McpTaskSupport.md)\>

Converter for `McpTaskSupport` — accepts exactly one of
`MCP_TASK_SUPPORT_VALUES` and refuses anything else.

## Remarks

Converts a **present** value only. An absent `taskSupport` means `'forbidden'` per the MCP spec,
but whether to apply that default is the caller's decision, so `undefined` fails here like any
other value outside the vocabulary.
