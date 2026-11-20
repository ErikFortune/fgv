[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-extras](../../../README.md) / [AiAssist](../README.md) / resolveEmbeddingCapability

# Function: resolveEmbeddingCapability()

> **resolveEmbeddingCapability**(`descriptor`, `modelId`): [`IAiEmbeddingModelCapability`](../interfaces/IAiEmbeddingModelCapability.md) \| `undefined`

Resolve the embedding capability that applies to a given model id for a
provider. Returns the entry from [IAiProviderDescriptor.embedding](../interfaces/IAiProviderDescriptor.md#property-embedding) whose
`modelPrefix` is the longest prefix of `modelId`. Ties are broken by
first-encountered.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `descriptor` | [`IAiProviderDescriptor`](../interfaces/IAiProviderDescriptor.md) | The provider descriptor |
| `modelId` | `string` | The embedding model id — concrete or an fgv alias |

## Returns

[`IAiEmbeddingModelCapability`](../interfaces/IAiEmbeddingModelCapability.md) \| `undefined`

The matching capability, or `undefined` when no rule matches, the
  provider declares no embedding capabilities, or `modelId` is an
  unresolvable alias.

## Remarks

`modelId` may be either a concrete provider model id or an fgv model alias
(`@<provider>:<role>`, see `MODEL_ALIAS_SIGIL`) — it is resolved via
`resolveModelAlias` against `descriptor.aliases` before prefix matching,
so both forms select the same capability. A raw provider id passes through
unchanged. An alias that is not registered on `descriptor` (or is cyclic)
names no model and yields `undefined` rather than falling through to the
`modelPrefix: ''` catch-all.
