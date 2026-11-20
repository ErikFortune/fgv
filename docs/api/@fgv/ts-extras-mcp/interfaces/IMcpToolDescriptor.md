[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-extras-mcp](../README.md) / IMcpToolDescriptor

# Interface: IMcpToolDescriptor

A tool descriptor discovered from an MCP server via [listMcpTools](../functions/listMcpTools.md).

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="property-annotations"></a> `annotations?` | `readonly` | [`IMcpToolAnnotations`](IMcpToolAnnotations.md) | The tool's normalized behavior annotations, when the server provided any usable ones. Absent when the server declared no annotations (or only malformed/unknown fields). See [IMcpToolAnnotations](IMcpToolAnnotations.md). |
| <a id="property-description"></a> `description` | `readonly` | `string` \| `undefined` | Human-readable description, when the server provided one. |
| <a id="property-execution"></a> `execution?` | `readonly` | [`IMcpToolExecution`](IMcpToolExecution.md) | The tool's normalized execution metadata, when the server declared any usable field. Absent when it declared none, or only unknown or malformed ones. See [IMcpToolExecution](IMcpToolExecution.md). **Remarks** The SDK parses the tool list against its own schema first, and that schema rejects a `taskSupport` outside [McpTaskSupport](../type-aliases/McpTaskSupport.md): through the SDK such a value fails the whole page as `'protocol'` before it reaches this package. The drop-and-log path covers any value that does reach it. |
| <a id="property-inputschema"></a> `inputSchema` | `readonly` | [`JsonValue`](../../ts-res-ui-components/type-aliases/JsonValue.md) | The tool's declared input schema as raw JSON. Per the MCP spec this is normally a JSON Schema object; carried verbatim so [adaptMcpTools](../functions/adaptMcpTools.md) can run it through `JsonSchema.fromJson` (and surface it on [IMcpSkippedTool](IMcpSkippedTool.md) when it is outside the supported subset). |
| <a id="property-name"></a> `name` | `readonly` | `string` | Tool name (unique within a server). |
| <a id="property-outputschema"></a> `outputSchema?` | `readonly` | [`JsonValue`](../../ts-res-ui-components/type-aliases/JsonValue.md) | The tool's declared output schema as raw JSON, when the server declared one: the shape of the `structuredContent` its results carry. Carried verbatim, like `inputSchema`, and not parsed. **Remarks** Absent when the server declared none, or when the value is not JSON. It is also absent — refused whole, never returned with a key missing — when it holds an own `__proto__` key, which `@fgv/ts-json-base`'s JSON converters would otherwise drop silently. Note that the SDK parses the tool list against its own schema first, and that parse already drops a `__proto__` key at the schema's top level or among its `properties` names; only one nested deeper reaches this package to be refused. |
| <a id="property-title"></a> `title?` | `readonly` | `string` | Human-readable display title: the tool's own `title`, or else its `annotations.title`. Absent when neither is a non-empty single line of text without control characters or U+2028/U+2029; a title that is not is dropped, never altered. |
