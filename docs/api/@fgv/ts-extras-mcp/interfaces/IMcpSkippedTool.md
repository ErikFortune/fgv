[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-extras-mcp](../README.md) / IMcpSkippedTool

# Interface: IMcpSkippedTool

A tool that was discovered but could NOT be adapted into an `AiAssist.IAiClientTool`: its
`inputSchema` is outside the JSON Schema subset supported by `JsonSchema.fromJson`, the target
wire cannot carry it, or it requires task-augmented execution. Surfaced structurally so
callers/the probe can enumerate exactly which subset features a server needs (with the raw schema
in hand to extend `fromJson` later), branching on `kind` rather than parsing `reason`.

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="property-kind"></a> `kind` | `readonly` | [`McpSkipKind`](../type-aliases/McpSkipKind.md) | Why the tool was skipped. See [McpSkipKind](../type-aliases/McpSkipKind.md). |
| <a id="property-name"></a> `name` | `readonly` | `string` | The tool's name. |
| <a id="property-reason"></a> `reason` | `readonly` | `string` | Why the tool was skipped, in words — the JSON-pointer reason from `JsonSchema.fromJson`, or a structural reason. |
| <a id="property-schema"></a> `schema` | `readonly` | [`JsonValue`](../../ts-res-ui-components/type-aliases/JsonValue.md) | The tool's raw input schema, verbatim, in hand for additively widening `JsonSchema.fromJson`. For a `'task-support'` skip it is the schema as declared, whether or not it would have adapted. |
