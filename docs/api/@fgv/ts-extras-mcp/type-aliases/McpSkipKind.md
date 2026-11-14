[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-extras-mcp](../README.md) / McpSkipKind

# Type Alias: McpSkipKind

> **McpSkipKind** = `"schema"` \| `"wire"` \| `"task-support"`

Why [adaptMcpTools](../functions/adaptMcpTools.md) skipped a tool — the `kind` of an [IMcpSkippedTool](../interfaces/IMcpSkippedTool.md).

## Remarks

| kind | skipped because |
|---|---|
| `'schema'` | Its `inputSchema` is not a JSON object, or is outside the subset `JsonSchema.fromJson` supports (including a `pattern` with no [IAdaptMcpToolsOptions.patternValidator](../interfaces/IAdaptMcpToolsOptions.md#property-patternvalidator)). |
| `'wire'` | Its schema parsed, but the target wire cannot carry it (see [IAdaptMcpToolsOptions.schemaKeywords](../interfaces/IAdaptMcpToolsOptions.md#property-schemakeywords)). |
| `'task-support'` | It declares `execution.taskSupport: 'required'`: it must be invoked as an MCP task, which this client cannot drive, so every plain call to it would fail. Checked first, whatever its schema. |
