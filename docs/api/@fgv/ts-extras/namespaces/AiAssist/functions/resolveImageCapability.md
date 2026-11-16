[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-extras](../../../README.md) / [AiAssist](../README.md) / resolveImageCapability

# Function: resolveImageCapability()

> **resolveImageCapability**(`descriptor`, `modelId`): [`IAiImageModelCapability`](../interfaces/IAiImageModelCapability.md) \| `undefined`

Resolve the image-generation capability that applies to a given model id
for a provider. Returns the entry from
[IAiProviderDescriptor.imageGeneration](../interfaces/IAiProviderDescriptor.md#property-imagegeneration) whose `modelPrefix` is the
longest prefix of `modelId`. Ties are broken by first-encountered, so rule
order does not matter for correctness — only for tie-breaking among rules
with identical-length prefixes (an unusual case).

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `descriptor` | [`IAiProviderDescriptor`](../interfaces/IAiProviderDescriptor.md) | The provider descriptor |
| `modelId` | `string` | The image model id — concrete or an fgv alias |

## Returns

[`IAiImageModelCapability`](../interfaces/IAiImageModelCapability.md) \| `undefined`

The matching capability, or `undefined` when no rule matches, the
  provider declares no image-generation capabilities, or `modelId` is an
  unresolvable alias.

## Remarks

`modelId` may be either a concrete provider model id or an fgv model alias
(`@<provider>:<role>`, see `MODEL_ALIAS_SIGIL`) — it is resolved via
`resolveModelAlias` against `descriptor.aliases` before prefix matching,
so both forms select the same capability. A raw provider id passes through
unchanged. An alias that is not registered on `descriptor` (or is cyclic)
names no model and yields `undefined` rather than falling through to the
`modelPrefix: ''` catch-all.
