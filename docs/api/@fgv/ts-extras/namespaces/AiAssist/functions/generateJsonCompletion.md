[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-extras](../../../README.md) / [AiAssist](../README.md) / generateJsonCompletion

# Function: generateJsonCompletion()

> **generateJsonCompletion**\<`T`\>(`params`): `Promise`\<[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<[`IGenerateJsonCompletionResult`](../interfaces/IGenerateJsonCompletionResult.md)\<`T`\>\>\>

Calls [AiAssist.callProviderCompletion](callProviderCompletion.md), then runs the response text
through a tolerant JSON converter (default:
[AiAssist.fencedStringifiedJson](fencedStringifiedJson.md)) and the caller's
`converter`/`validator`. Returns the validated value plus the raw text and
underlying completion response for diagnostics.

## Type Parameters

| Type Parameter |
| ------ |
| <a id="type-parameter-t"></a> `T` |

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `params` | [`IGenerateJsonCompletionParams`](../interfaces/IGenerateJsonCompletionParams.md)\<`T`\> | Provider parameters plus JSON validation options. |

## Returns

`Promise`\<[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<[`IGenerateJsonCompletionResult`](../interfaces/IGenerateJsonCompletionResult.md)\<`T`\>\>\>

The validated value, the raw text, and the underlying response.

## Remarks

The default smart prompt hint asks the model to emit raw JSON. The read-side
extractor still tolerates fences and prose, so models that ignore the hint
are still handled.

Either `converter` or `jsonConverter` must be provided; passing both lets
`jsonConverter` win.
