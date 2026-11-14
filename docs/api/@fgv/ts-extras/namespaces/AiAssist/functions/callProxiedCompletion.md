[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-extras](../../../README.md) / [AiAssist](../README.md) / callProxiedCompletion

# Function: callProxiedCompletion()

> **callProxiedCompletion**(`proxyUrl`, `params`): `Promise`\<[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<[`IAiCompletionResponse`](../interfaces/IAiCompletionResponse.md)\>\>

Calls the AI completion endpoint on a proxy server instead of calling the
provider API directly from the browser. The proxy handles provider dispatch,
CORS, and API key forwarding. The request body serializes the unified
[AiAssist.IChatRequest](../interfaces/IChatRequest.md) shape (`system?` + `messages`). Enforces the same
non-empty / trailing-user-turn and image-input invariants as the direct path.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `proxyUrl` | `string` | Base URL of the proxy server |
| `params` | [`IProviderCompletionParams`](../interfaces/IProviderCompletionParams.md) | Same parameters as [callProviderCompletion](callProviderCompletion.md) |

## Returns

`Promise`\<[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<[`IAiCompletionResponse`](../interfaces/IAiCompletionResponse.md)\>\>

## Remarks

Two parameters are handled before the body is composed, rather than forwarded.
`tier` is resolved here and sent as a concrete `modelOverride`, because both
halves of the resolution live on the descriptor the caller already holds — so a
proxy needs no `tier` vocabulary, where a `tier` body field it did not understand
would be ignored and silently serve a frontier request from the base model.
`endpoint` is **refused**: it names where the prompt must go, the proxy is what
makes that call, and the field has never been sent to one — so honoring it is
unverifiable and ignoring it would reach the provider's default upstream instead
of the host the caller pinned. Use `callProviderCompletion`, or point the
proxy itself at the intended upstream.
