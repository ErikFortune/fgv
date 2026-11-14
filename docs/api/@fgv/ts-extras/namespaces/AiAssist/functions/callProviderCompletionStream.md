[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-extras](../../../README.md) / [AiAssist](../README.md) / callProviderCompletionStream

# Function: callProviderCompletionStream()

> **callProviderCompletionStream**(`params`): `Promise`\<[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<`AsyncIterable`\<[`IAiStreamEvent`](../type-aliases/IAiStreamEvent.md), `any`, `any`\>\>\>

Calls the appropriate streaming chat completion API for a given provider.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `params` | [`IProviderCompletionStreamParams`](../interfaces/IProviderCompletionStreamParams.md) | Request parameters including descriptor, API key, prompt, and optional tools |

## Returns

`Promise`\<[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<`AsyncIterable`\<[`IAiStreamEvent`](../type-aliases/IAiStreamEvent.md), `any`, `any`\>\>\>

A streaming iterable of unified events, or a Result.fail

## Remarks

Pre-flight rejection: when `descriptor.streamingCorsRestricted === true`
and the call isn't being routed through a proxy, this returns
`Result.fail` before fetch is invoked. Callers should route through
[AiAssist.callProxiedCompletionStream](callProxiedCompletionStream.md) or surface the failure to the user.

This guard is applied **here only**. `executeClientToolTurn` is also a
streaming entry point and does not pre-flight the flag, so a browser
client-tool turn against a `streamingCorsRestricted` provider fails at the
fetch with a CORS error rather than with this legible refusal.

Connection-time failures (auth, network, non-2xx) surface as the outer
`Result.fail`. Once iteration begins, errors mid-stream surface as a
terminal error event ([AiAssist.IAiStreamError](../interfaces/IAiStreamError.md)) followed by the iterable
ending. The final successful event is [AiAssist.IAiStreamDone](../interfaces/IAiStreamDone.md).
