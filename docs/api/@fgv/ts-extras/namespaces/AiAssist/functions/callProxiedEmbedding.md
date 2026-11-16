[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-extras](../../../README.md) / [AiAssist](../README.md) / callProxiedEmbedding

# Function: callProxiedEmbedding()

> **callProxiedEmbedding**(`proxyUrl`, `params`): `Promise`\<[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<[`IAiEmbeddingResult`](../interfaces/IAiEmbeddingResult.md)\>\>

Calls the embedding endpoint on a proxy server instead of calling the provider
API directly from the browser. Endpoint: `POST ${proxyUrl}/api/ai/embedding`.
Request body: `{ providerId, apiKey, params, modelOverride? }`. The proxy
handles descriptor lookup, model/capability resolution, and provider dispatch.
Error body `{ error: string }` is surfaced as `proxy: ${error}`.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `proxyUrl` | `string` | Base URL of the proxy server (e.g. `http://localhost:3001`). |
| `params` | [`IProviderEmbeddingParams`](../interfaces/IProviderEmbeddingParams.md) | Same parameters as [AiAssist.callProviderEmbedding](callProviderEmbedding.md). |

## Returns

`Promise`\<[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<[`IAiEmbeddingResult`](../interfaces/IAiEmbeddingResult.md)\>\>

The embedding result, or a failure.

## Remarks

`endpoint` is **refused** on this path rather than forwarded or dropped, on the
same terms as `callProxiedCompletion`. It matters more here than
anywhere else: pointing `endpoint` at `http://localhost:11434/v1` is the
documented way to reach a local Ollama, so dropping it does not degrade the
answer — it sends the text to OpenAI's public API instead of the machine the
caller named. Use `callProviderEmbedding`, or point the proxy
itself at the intended upstream.
