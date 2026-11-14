[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-extras](../../../README.md) / [AiAssist](../README.md) / callProxiedImageGeneration

# Function: callProxiedImageGeneration()

> **callProxiedImageGeneration**(`proxyUrl`, `params`): `Promise`\<[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<[`IAiImageGenerationResponse`](../interfaces/IAiImageGenerationResponse.md)\>\>

Calls the image-generation endpoint on a proxy server instead of calling
the provider API directly from the browser.
Endpoint: `POST ${proxyUrl}/api/ai/image-generation`. Request body:
`{providerId, apiKey, params, modelOverride?}`. The proxy handles descriptor
lookup, model resolution, provider dispatch, and response normalization
(including repackaging `referenceImages` for the upstream wire format).
Error body `{error: string}` is surfaced as `proxy: ${error}`.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `proxyUrl` | `string` | Base URL of the proxy server |
| `params` | [`IProviderImageGenerationParams`](../interfaces/IProviderImageGenerationParams.md) | Same parameters as [callProviderImageGeneration](callProviderImageGeneration.md) |

## Returns

`Promise`\<[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<[`IAiImageGenerationResponse`](../interfaces/IAiImageGenerationResponse.md)\>\>

## Remarks

`endpoint` is **refused** on this path rather than forwarded or dropped, on the
same terms as `callProxiedCompletion`: a proxy cannot confirm it honored
it, the field has never been sent to one, and reaching the provider's default
upstream instead would send the prompt somewhere the caller excluded. Use
`callProviderImageGeneration`, or point the proxy itself at the intended
upstream.
