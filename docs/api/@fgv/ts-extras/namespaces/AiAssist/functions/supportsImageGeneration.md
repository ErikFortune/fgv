[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-extras](../../../README.md) / [AiAssist](../README.md) / supportsImageGeneration

# Function: supportsImageGeneration()

> **supportsImageGeneration**(`descriptor`): `boolean`

Whether a provider declares any image-generation capability at all.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `descriptor` | [`IAiProviderDescriptor`](../interfaces/IAiProviderDescriptor.md) | The provider descriptor |

## Returns

`boolean`

`true` when [IAiProviderDescriptor.imageGeneration](../interfaces/IAiProviderDescriptor.md#property-imagegeneration) has at
  least one entry; `false` otherwise.
