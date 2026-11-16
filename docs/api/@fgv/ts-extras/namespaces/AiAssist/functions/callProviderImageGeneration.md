[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-extras](../../../README.md) / [AiAssist](../README.md) / callProviderImageGeneration

# Function: callProviderImageGeneration()

> **callProviderImageGeneration**(`params`): `Promise`\<[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<[`IAiImageGenerationResponse`](../interfaces/IAiImageGenerationResponse.md)\>\>

Calls the appropriate image-generation API for a given provider. Routes by the
`format` field of the resolved [IAiImageModelCapability](../interfaces/IAiImageModelCapability.md):
`'openai-images'`, `'xai-images'`, `'xai-images-edits'`, or
`'gemini-image-out'`. Rejects up front if `referenceImages` is set but the
capability does not declare `acceptsImageReferenceInput`.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `params` | [`IProviderImageGenerationParams`](../interfaces/IProviderImageGenerationParams.md) | Request parameters including descriptor, API key, and prompt |

## Returns

`Promise`\<[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<[`IAiImageGenerationResponse`](../interfaces/IAiImageGenerationResponse.md)\>\>
