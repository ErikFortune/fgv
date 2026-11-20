[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-extras](../../../README.md) / [AiAssist](../README.md) / supportsEmbedding

# Function: supportsEmbedding()

> **supportsEmbedding**(`descriptor`): `boolean`

Whether a provider declares any embedding capability at all.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `descriptor` | [`IAiProviderDescriptor`](../interfaces/IAiProviderDescriptor.md) | The provider descriptor |

## Returns

`boolean`

`true` when [IAiProviderDescriptor.embedding](../interfaces/IAiProviderDescriptor.md#property-embedding) has at least one
  entry; `false` otherwise.
