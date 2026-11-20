[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-extras](../../../README.md) / [AiAssist](../README.md) / clientToolSchemaKeywords

# Function: clientToolSchemaKeywords()

> **clientToolSchemaKeywords**(`descriptor`, `options?`): [`SchemaKeywordCapabilities`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs)

The keyword-capability table a client tool's parameter schema is adapted with when it is sent to
`descriptor` — the table to hand to `@fgv/ts-extras-mcp`'s `adaptMcpTools` (its
`schemaKeywords` option) so it admits exactly the MCP tools that wire can carry.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `descriptor` | [`IAiProviderDescriptor`](../interfaces/IAiProviderDescriptor.md) | The provider the tools will be sent to. |
| `options?` | \{ `endpoint?`: `string`; `model?`: `string`; `verifiedEndpoint?`: [`IAiVerifiedEndpoint`](../interfaces/IAiVerifiedEndpoint.md); \} | The concrete `model` (an OpenAI fine-tuned `ft:` model gets the conservative table), any caller-supplied `endpoint`, and any `verifiedEndpoint` assertion about it. |
| `options.endpoint?` | `string` | - |
| `options.model?` | `string` | - |
| `options.verifiedEndpoint?` | [`IAiVerifiedEndpoint`](../interfaces/IAiVerifiedEndpoint.md) | - |

## Returns

[`SchemaKeywordCapabilities`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs)

The keyword-capability table.

## Remarks

The same table the request path uses, chosen by the same helpers: the wire follows
`descriptor.apiFormat` (OpenAI-format Responses tools, Anthropic tools, or Gemini function
declarations), and the provider's own table applies only when the request goes to its own
endpoint — pass `endpoint` when the descriptor is pointed at a caller-supplied one, and every
keyword is then treated as unverified, as the request path does, unless `verifiedEndpoint`
asserts the endpoint is the provider itself (see `IAiVerifiedEndpoint`). Pass
exactly the `model`, `endpoint` and `verifiedEndpoint` the turn will be sent with.
