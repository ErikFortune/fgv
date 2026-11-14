[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-web-extras-transformers](../README.md) / classify

# Function: classify()

> **classify**(`classifier`, `text`, `options?`): `Promise`\<[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<`TextClassificationOutput`\>\>

Result-integration wrapper that invokes a `TextClassificationPipeline` on a single text input
for browser consumers.

Returns the classification results as a flat `TextClassificationOutput` (array of
`{ label: string; score: number }` entries).

Callers should retrieve the pipeline via `loadPipeline('text-classification', modelId)` (or the
`'sentiment-analysis'` alias). This helper always passes a single string to the upstream
pipeline and normalises the result to `TextClassificationOutput` so consumers don't need to
handle the `string | string[]` overload union.

Returns `Promise<Result<TextClassificationOutput>>`; upstream errors (inference failures,
tokenisation errors) are captured as `Failure` with the original message.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `classifier` | [`TextClassificationPipeline`](../interfaces/TextClassificationPipeline.md) | A `TextClassificationPipeline` obtained from `loadPipeline`. |
| `text` | `string` | The text to classify. |
| `options?` | `TextClassificationPipelineOptions` | Optional upstream classification options (e.g. `{ top_k: null }` to return all labels). Passed through verbatim to the pipeline call. |

## Returns

`Promise`\<[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<`TextClassificationOutput`\>\>

## See

https://huggingface.co/docs/transformers.js
