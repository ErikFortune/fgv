[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-extras](../../../README.md) / [AiAssist](../README.md) / structuredOutputSchemaKeywords

# Function: structuredOutputSchemaKeywords()

> **structuredOutputSchemaKeywords**(`descriptor`, `options`): [`SchemaKeywordCapabilities`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs) \| `undefined`

The keyword-capability table a structured-output schema is adapted with when it is sent to
`descriptor` for `model` — the structured-output sibling of `clientToolSchemaKeywords`.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `descriptor` | [`IAiProviderDescriptor`](../interfaces/IAiProviderDescriptor.md) | The provider the schema will be sent to. |
| `options` | \{ `endpoint?`: `string`; `model`: `string`; `verifiedEndpoint?`: [`IAiVerifiedEndpoint`](../interfaces/IAiVerifiedEndpoint.md); \} | The `model` (a concrete id or an `@provider:role` alias; an OpenAI fine-tuned `ft:` model gets the conservative table), any caller-supplied `endpoint`, and any `verifiedEndpoint` assertion about it. |
| `options.endpoint?` | `string` | - |
| `options.model` | `string` | - |
| `options.verifiedEndpoint?` | [`IAiVerifiedEndpoint`](../interfaces/IAiVerifiedEndpoint.md) | - |

## Returns

[`SchemaKeywordCapabilities`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs) \| `undefined`

The keyword-capability table, or `undefined` when the model declares no structured-output
capability and the request would send no schema at all.

## Remarks

The same table the request path uses. The wire follows the model's declared structured-output
format, so it can differ by model within one provider: an Anthropic model that takes JSON
outputs (`output_config.format`) gets that wire's table, and one that takes the forced-tool
mechanism gets the Anthropic tools table. The provider's own table applies only when the request
goes to its own endpoint — pass `endpoint` when the descriptor is pointed at a caller-supplied
one, and every keyword is then treated as unverified, as the request path does, unless
`verifiedEndpoint` asserts the endpoint is the provider itself (see
`IAiVerifiedEndpoint`).
