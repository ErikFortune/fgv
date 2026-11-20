[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-extras](../../../README.md) / [AiAssist](../README.md) / IAiImageGenerationOptions

# Interface: IAiImageGenerationOptions

Options for image generation requests.

## Remarks

Uses a layered architecture:
1. Generic top-level options (size, count, quality, seed) apply across providers
   via the resolved model's registry mapping.
2. Optional `models` array contains model-family-scoped blocks; the resolver
   picks applicable blocks based on the resolved model and applies them in
   declaration order.

**Merge precedence (later wins):**
1. Generic top-level options (lowest precedence)
2. Family-generic blocks (matching family, models field omitted)
3. Model-specific blocks (models array includes resolved model name)
4. Other blocks (provider: 'other', models array includes resolved model name)

Provider-mismatch: blocks whose provider doesn't match the dispatcher's
provider lineage are silently skipped.

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="property-count"></a> `count?` | `readonly` | `number` | Number of images. Default 1. Some models enforce a maximum. |
| <a id="property-models"></a> `models?` | `readonly` | readonly [`IModelFamilyConfig`](../type-aliases/IModelFamilyConfig.md)[] | Optional precision via model-family-scoped blocks. The resolver picks applicable blocks dynamically based on the resolved model. |
| <a id="property-quality"></a> `quality?` | `readonly` | [`GptImageQuality`](../type-aliases/GptImageQuality.md) | Quality tier. Accepted values differ per model: - gpt-image-1: 'low' \| 'medium' \| 'high' \| 'auto' Other models ignore this field. |
| <a id="property-seed"></a> `seed?` | `readonly` | `number` | Reproducibility seed, where supported. |
| <a id="property-size"></a> `size?` | `readonly` | [`GptImageSize`](../type-aliases/GptImageSize.md) | Image dimensions for OpenAI models (mapped to `size` field). For xAI or Gemini Flash aspect ratio, use the corresponding `models` family block. |
