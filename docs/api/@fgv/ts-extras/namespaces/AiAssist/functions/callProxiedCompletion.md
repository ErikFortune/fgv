[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-extras](../../../README.md) / [AiAssist](../README.md) / callProxiedCompletion

# Function: callProxiedCompletion()

> **callProxiedCompletion**(`proxyUrl`, `params`): `Promise`\<[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<[`IAiCompletionResponse`](../interfaces/IAiCompletionResponse.md)\>\>

Calls the AI completion endpoint on a proxy server instead of calling
the provider API directly from the browser.

The proxy server handles provider dispatch, CORS, and API key forwarding.
The request shape mirrors [IProviderCompletionParams](../interfaces/IProviderCompletionParams.md) but is serialized
as JSON for the proxy endpoint.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `proxyUrl` | `string` | Base URL of the proxy server (e.g. `http://localhost:3001`) |
| `params` | [`IProviderCompletionParams`](../interfaces/IProviderCompletionParams.md) | Same parameters as [callProviderCompletion](callProviderCompletion.md) |

## Returns

`Promise`\<[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<[`IAiCompletionResponse`](../interfaces/IAiCompletionResponse.md)\>\>

The completion response, or a failure
