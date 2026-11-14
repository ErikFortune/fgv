[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-extras](../../../README.md) / [AiAssist](../README.md) / McpTaskSupport

# Type Alias: McpTaskSupport

> **McpTaskSupport** = [`StringOneOf`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<*typeof* [`MCP_TASK_SUPPORT_VALUES`](../variables/MCP_TASK_SUPPORT_VALUES.md)\>

Whether a tool may, must or must not be invoked as an MCP task (task-augmented execution) — the
MCP `Tool.execution.taskSupport` vocabulary.

## Remarks

Per the MCP spec, an **absent** value means `'forbidden'`. That rule is the caller's to apply:
`mcpTaskSupport` converts a present value only, so a caller can still tell a tool
that declared `'forbidden'` from one that declared nothing.
