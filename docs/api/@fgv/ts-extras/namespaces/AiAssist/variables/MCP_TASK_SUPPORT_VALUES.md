[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-extras](../../../README.md) / [AiAssist](../README.md) / MCP\_TASK\_SUPPORT\_VALUES

# Variable: MCP\_TASK\_SUPPORT\_VALUES

> `const` **MCP\_TASK\_SUPPORT\_VALUES**: readonly \[`"forbidden"`, `"optional"`, `"required"`\]

Every MCP `Tool.execution.taskSupport` value, as a runtime list, in the order the MCP spec
declares them. `McpTaskSupport` is derived from it, so the two cannot diverge.

## Remarks

Declared here, beside `IAiToolAnnotations`, because the vocabulary is MCP-spec-level
rather than SDK- or transport-level, and this packlet ships in both the Node and browser builds.
Use `mcpTaskSupport` to convert an untrusted value into it.
