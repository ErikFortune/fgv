[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-web-extras-transformers](../README.md) / summarize

# Function: summarize()

> **summarize**(`summarizer`, `text`, `options?`): `Promise`\<[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<`SummarizationOutput`\>\>

Result-integration wrapper that invokes a `SummarizationPipeline` on a single text input for
browser consumers.

Returns the upstream `SummarizationOutput` Result-wrapped (an array of `{ summary_text }`
entries; one for a single-string input).

Callers should retrieve the summarizer via `loadPipeline('summarization', modelId)` — e.g.
`Xenova/distilbart-cnn-6-6`. This facade applies no opinionated orchestration (no length policy,
no local-vs-cloud routing) — `options` are passed through verbatim and the caller owns any
escalation decision.

Returns `Promise<Result<SummarizationOutput>>`; upstream errors (inference failures, tokenisation
errors) are captured as `Failure` with the original message.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `summarizer` | [`SummarizationPipeline`](../interfaces/SummarizationPipeline.md) | A `SummarizationPipeline` obtained from `loadPipeline`. |
| `text` | `string` | The text to summarize. |
| `options?` | `GenerationFunctionParameters` | Optional upstream summarization options (e.g. `min_length`, `max_length`, `max_new_tokens`). Passed through verbatim to the pipeline call. |

## Returns

`Promise`\<[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<`SummarizationOutput`\>\>

## See

https://huggingface.co/docs/transformers.js
