[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-web-extras-transformers](../README.md) / embed

# Function: embed()

> **embed**(`extractor`, `text`, `options?`): `Promise`\<[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<[`Tensor`](../interfaces/Tensor.md)\>\>

Result-integration wrapper that invokes a `FeatureExtractionPipeline` on a text input for
browser consumers.

Returns the upstream `Tensor` Result-wrapped — no pooling, normalisation, or reshaping is
applied. Callers receive the raw output and are responsible for any downstream processing.

Callers should retrieve the extractor via `loadPipeline('feature-extraction', modelId)`. The
upstream library automatically uses the ONNX web backend and WebGPU when available.

Returns `Promise<Result<Tensor>>`; upstream errors (inference failures, tokenisation errors)
are captured as `Failure` with the original message.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `extractor` | [`FeatureExtractionPipeline`](../interfaces/FeatureExtractionPipeline.md) | A `FeatureExtractionPipeline` obtained from `loadPipeline`. |
| `text` | `string` \| `string`[] | The text (or texts) to embed. |
| `options?` | `FeatureExtractionPipelineOptions` | Optional upstream feature-extraction options (e.g. `pooling`, `normalize`). Passed through verbatim to the pipeline call. |

## Returns

`Promise`\<[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<[`Tensor`](../interfaces/Tensor.md)\>\>

## See

https://huggingface.co/docs/transformers.js
