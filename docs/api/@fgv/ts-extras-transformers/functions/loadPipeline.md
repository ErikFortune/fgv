[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-extras-transformers](../README.md) / loadPipeline

# Function: loadPipeline()

> **loadPipeline**\<`T`\>(`task`, `model?`, `options?`): `Promise`\<[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<[`AllTasks`](../type-aliases/AllTasks.md)\[`T`\]\>\>

Result-integration wrapper around `@huggingface/transformers`'s `pipeline` factory.
Loads a model and returns a ready-to-use pipeline object.

The returned pipeline is the upstream `AllTasks[T]` instance — consumers retain full access
to the upstream API. Lifecycle management (caching, disposal, GPU/CPU selection) is the
consumer's responsibility.

Returns `Promise<Result<AllTasks[T]>>`; upstream errors (network, model-not-found, ONNX
initialization failures) are captured as `Failure` with the original message.

## Type Parameters

| Type Parameter |
| ------ |
| <a id="type-parameter-t"></a> `T` *extends* [`PipelineType`](../type-aliases/PipelineType.md) |

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `task` | `T` | The pipeline task type (e.g. `'text-classification'`, `'feature-extraction'`). |
| `model?` | `string` | The model identifier (HuggingFace Hub ID or local path). If omitted, the upstream default for the task is used. |
| `options?` | `PretrainedModelOptions` | Optional `PretrainedModelOptions` (device, dtype, cache_dir, etc.). Passed through verbatim to the upstream `pipeline()` call. |

## Returns

`Promise`\<[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<[`AllTasks`](../type-aliases/AllTasks.md)\[`T`\]\>\>

## See

https://huggingface.co/docs/transformers.js
