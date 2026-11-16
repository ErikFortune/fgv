[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-web-extras-transformers](../README.md) / classifyAll

# Function: classifyAll()

> **classifyAll**(`classifier`, `text`, `options?`): `Promise`\<[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<`TextClassificationOutput`\>\>

Convenience wrapper over `classify` that forces `top_k: null` so the full per-label vector
is returned for every call. Callers no longer need to remember to pass `{ top_k: null }`.

Any caller-supplied options are honoured except `top_k`, which is always overridden to `null`.

Returns `Promise<Result<TextClassificationOutput>>`; upstream errors are captured as `Failure`
with the original message.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `classifier` | [`TextClassificationPipeline`](../interfaces/TextClassificationPipeline.md) | A `TextClassificationPipeline` obtained from `loadPipeline`. |
| `text` | `string` | The text to classify. |
| `options?` | `TextClassificationPipelineOptions` | Optional upstream classification options. `top_k` is always set to `null` regardless of any value supplied here. |

## Returns

`Promise`\<[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<`TextClassificationOutput`\>\>

## See

https://huggingface.co/docs/transformers.js
