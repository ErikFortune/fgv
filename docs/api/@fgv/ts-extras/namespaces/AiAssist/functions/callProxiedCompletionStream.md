[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-extras](../../../README.md) / [AiAssist](../README.md) / callProxiedCompletionStream

# Function: callProxiedCompletionStream()

> **callProxiedCompletionStream**(`proxyUrl`, `params`): `Promise`\<[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<`AsyncIterable`\<[`IAiStreamEvent`](../type-aliases/IAiStreamEvent.md), `any`, `any`\>\>\>

Calls the streaming chat endpoint on a proxy server instead of calling
the provider directly from the browser.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `proxyUrl` | `string` |
| `params` | [`IProviderCompletionStreamParams`](../interfaces/IProviderCompletionStreamParams.md) |

## Returns

`Promise`\<[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<`AsyncIterable`\<[`IAiStreamEvent`](../type-aliases/IAiStreamEvent.md), `any`, `any`\>\>\>

## Remarks

Proxy contract:
- Endpoint: `POST ${proxyUrl}/api/ai/completion-stream`
- Request body: same JSON as `/api/ai/completion` plus `"stream": true`
- Response: `Content-Type: text/event-stream`; body is the unified
  [AiAssist.IAiStreamEvent](../type-aliases/IAiStreamEvent.md) JSON-serialized one event per SSE `data:` line
  (no `event:` line needed since the type discriminator is in the JSON).
  **Only `text-delta`, `tool-event`, `done` and `error` are carried** — an event
  of any other type, including the three `client-tool-*` variants, is discarded
  without error. Client-tool turns are not proxiable; `executeClientToolTurn`
  has no proxied entry point.
- Error response (when the proxy can't even start): JSON `{error: string}`
  with a non-2xx status, surfaced as `proxy: ${error}`.

Two request parameters are handled before the body is composed, identically to
`callProxiedCompletion`: `tier` is resolved here and sent as a concrete
`modelOverride`, so a proxy needs no `tier` vocabulary; `endpoint` is refused,
because a proxy cannot confirm it honored it and reaching the provider's default
upstream instead would send the request somewhere the caller excluded. `cache`,
by contrast, is forwarded as a plain `body.cache` field exactly as
`callProxiedCompletion` forwards it — a proxy that ignores it degrades to the
request it would have sent anyway, never a misdirected one, so there is no
`endpoint`-style reason to refuse it.

The proxy server is responsible for opening the upstream SSE connection,
translating provider-native events to the unified vocabulary, and
forwarding events as they arrive (no buffering). The library does not
ship a proxy implementation.
