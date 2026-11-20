[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-extras-mcp](../README.md) / adaptMcpTools

# Function: adaptMcpTools()

> **adaptMcpTools**(`session`, `options?`): `Promise`\<[`DetailedResult`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`IAdaptMcpToolsResult`](../interfaces/IAdaptMcpToolsResult.md), [`McpFailureReason`](../type-aliases/McpFailureReason.md)\>\>

Discovers an MCP server's tools and adapts each into an `AiAssist.IAiClientTool` that drops
directly into `AiAssist.executeClientToolTurn`.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `session` | [`IMcpSession`](../interfaces/IMcpSession.md) | A connected session from `connectMcpSession`. |
| `options?` | [`IAdaptMcpToolsOptions`](../interfaces/IAdaptMcpToolsOptions.md) | Optional logger for the NOISY skip warnings, and the target wire's keyword table. |

## Returns

`Promise`\<[`DetailedResult`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`IAdaptMcpToolsResult`](../interfaces/IAdaptMcpToolsResult.md), [`McpFailureReason`](../type-aliases/McpFailureReason.md)\>\>

`Success` with `{ tools, skipped }`, or `Failure` only if tool discovery fails, with the
discovery failure's [McpFailureReason](../type-aliases/McpFailureReason.md) as its detail.

## Remarks

**Constraint 1 — graceful degradation with NOISY warnings.** A tool whose `inputSchema` is
outside the JSON Schema subset supported by `JsonSchema.fromJson` is NOT adapted (the model
must never be offered a tool whose args we can't validate). Instead it is:
1. excluded from [IAdaptMcpToolsResult.tools](../interfaces/IAdaptMcpToolsResult.md#property-tools);
2. surfaced structurally on [IAdaptMcpToolsResult.skipped](../interfaces/IAdaptMcpToolsResult.md#property-skipped) with the tool name, the
   JSON-pointer reason, and the raw failing schema; and
3. logged as a NOISY `warning` (name + reason + raw schema) when an `options.logger` is
   supplied — so pointing this at a new server immediately reveals every subset feature to
   extend, with the schema in hand.

A tool is also skipped, the same way, when the wire it will be sent on cannot carry its schema
(see [IAdaptMcpToolsOptions.schemaKeywords](../interfaces/IAdaptMcpToolsOptions.md#property-schemakeywords); the default table is conservative and skips
a tool with an untyped `{}` parameter).

A tool whose schema uses `pattern` is skipped unless [IAdaptMcpToolsOptions.patternValidator](../interfaces/IAdaptMcpToolsOptions.md#property-patternvalidator)
is supplied: a server's pattern is never compiled by this package.

A tool that declares `execution.taskSupport: 'required'` is skipped too, whatever its schema: it
must be invoked as an MCP task, which this client cannot drive, so every plain call to it would
fail. One declaring `'optional'` (or nothing, or `'forbidden'`) is adapted and called normally.

Every skip carries a [McpSkipKind](../type-aliases/McpSkipKind.md) — `'schema'`, `'wire'` or `'task-support'` — so a caller
branches on why without parsing the reason.

Discovery runs [listMcpTools](listMcpTools.md) with [IAdaptMcpToolsOptions.discovery](../interfaces/IAdaptMcpToolsOptions.md#property-discovery), so its bounds
(`maxPages`, `maxTotalMs`) and per-page `timeoutMs` and `signal` apply here as well.

The whole catalog never fails on a single bad schema; the only failure mode is an upstream
`listMcpTools` error.
