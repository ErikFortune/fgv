[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-extras](../../../README.md) / [AiAssist](../README.md) / IGptImageGenerationConfig

# Interface: IGptImageGenerationConfig

Provider-specific config for gpt-image-1.

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="property-background"></a> `background?` | `readonly` | `"transparent"` \| `"auto"` \| `"opaque"` | Background transparency control. |
| <a id="property-moderation"></a> `moderation?` | `readonly` | `"auto"` \| `"low"` | Content moderation strictness. |
| <a id="property-outputcompression"></a> `outputCompression?` | `readonly` | `number` | JPEG/WebP compression level 0–100. |
| <a id="property-outputformat"></a> `outputFormat?` | `readonly` | `"png"` \| `"jpeg"` \| `"webp"` | Output format (replaces response_format for this model). |
| <a id="property-quality"></a> `quality?` | `readonly` | [`GptImageQuality`](../type-aliases/GptImageQuality.md) | Quality tier. |
| <a id="property-size"></a> `size?` | `readonly` | [`GptImageSize`](../type-aliases/GptImageSize.md) | Image dimensions. |
