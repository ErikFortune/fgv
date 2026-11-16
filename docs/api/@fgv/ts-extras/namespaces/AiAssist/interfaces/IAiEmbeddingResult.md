[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-extras](../../../README.md) / [AiAssist](../README.md) / IAiEmbeddingResult

# Interface: IAiEmbeddingResult

Result of an embedding call. `vectors[i]` is the embedding for `input[i]`,
in request order.

## Remarks

Vectors are plain `number[]` (not `Float32Array`) for JSON-wire fidelity and
validator-friendliness — consumers who want a typed array call
`Float32Array.from(vector)` at the vector-store / WebGPU boundary. The
library does not L2-normalize; Gemini's MRL truncation (when
`dimensions < native`) returns un-normalized vectors that the consumer should
normalize if their similarity metric requires it.

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="property-dimensions"></a> `dimensions` | `readonly` | `number` | Dimensionality of each returned vector (`vectors[0].length`; `0` for empty input). |
| <a id="property-model"></a> `model` | `readonly` | `string` | The resolved provider-native model id that produced the vectors. |
| <a id="property-usage"></a> `usage?` | `readonly` | [`IAiEmbeddingUsage`](IAiEmbeddingUsage.md) | Token usage, when the provider reports it (OpenAI-format; absent for Gemini). |
| <a id="property-vectors"></a> `vectors` | `readonly` | readonly (readonly `number`[])[] | One vector per input, aligned by index to the request order. |
