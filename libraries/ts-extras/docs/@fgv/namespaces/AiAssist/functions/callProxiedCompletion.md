[**@fgv/ts-extras**](../../../../README.md)

***

[@fgv/ts-extras](../../../../README.md) / [AiAssist](../README.md) / callProxiedCompletion

# Function: callProxiedCompletion()

> **callProxiedCompletion**(`proxyUrl`, `params`): `Promise`\<[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`IAiCompletionResponse`](../interfaces/IAiCompletionResponse.md)\>\>

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

`Promise`\<[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`IAiCompletionResponse`](../interfaces/IAiCompletionResponse.md)\>\>

The completion response, or a failure
