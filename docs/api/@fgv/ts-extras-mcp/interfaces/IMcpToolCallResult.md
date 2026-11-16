[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-extras-mcp](../README.md) / IMcpToolCallResult

# Interface: IMcpToolCallResult

Successful projection of an MCP `CallToolResult` produced by [callMcpTool](../functions/callMcpTool.md).

## Remarks

`content` is the text projection handed to a model (it is what [adaptMcpTools](../functions/adaptMcpTools.md)' tools
return), one line or passage per block, joined by newlines:

| block | projects to |
|---|---|
| `text` | its text |
| `resource_link` | `[resource_link: <uri> (<name>)]`, or `[resource_link: <uri>]` without a name |
| embedded text `resource` | its text |
| embedded blob `resource`, `image`, `audio` | `[resource block]`, `[image block]`, `[audio block]` |
| unknown | `[<blockType> block]`, or `[unknown block]` without a usable `blockType` |

Every server string interpolated into a generated placeholder (a link's URI or name, a
`blockType`) is validated first (one with a line break, U+2028/U+2029 or a control character is
not echoed), so a block cannot forge a placeholder line. Text and embedded-text bodies are free
text, projected verbatim, and may span lines. It is still
untrusted server text — a single line can say anything — exactly as a `text` block always was. A result with `isError: true`
is mapped to `Result.fail(content)` rather than returned here, so it is never silently swallowed.

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="property-blocks"></a> `blocks` | `readonly` | readonly [`McpContentBlock`](../type-aliases/McpContentBlock.md)[] | Every content block, in order, converter-validated. See [McpContentBlock](../type-aliases/McpContentBlock.md). |
| <a id="property-content"></a> `content` | `readonly` | `string` | The text projection of the tool result. |
| <a id="property-structuredcontent"></a> `structuredContent?` | `readonly` | [`JsonValue`](../../ts-res-ui-components/type-aliases/JsonValue.md) | The result's `structuredContent`, when present and JSON. Omitted when it is not JSON, or when it holds an own `__proto__` key at any depth: refused whole rather than returned with the key silently dropped. A refusal is logged at `info` to the session's logger. |
