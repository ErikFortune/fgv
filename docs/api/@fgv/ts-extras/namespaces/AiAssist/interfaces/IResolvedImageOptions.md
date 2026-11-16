[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-extras](../../../README.md) / [AiAssist](../README.md) / IResolvedImageOptions

# Interface: IResolvedImageOptions

The resolved, merged wire parameters for an image generation request.
Built from the layered options and ready for provider-specific encoding.

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="property-aspectratio"></a> `aspectRatio?` | `readonly` | `string` | - |
| <a id="property-background"></a> `background?` | `readonly` | `string` | - |
| <a id="property-geminiaspectratio"></a> `geminiAspectRatio?` | `readonly` | `string` | - |
| <a id="property-moderation"></a> `moderation?` | `readonly` | `string` | - |
| <a id="property-n"></a> `n` | `readonly` | `number` | Number of images to generate. |
| <a id="property-otherparams"></a> `otherParams?` | `readonly` | [`JsonObject`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs) | - |
| <a id="property-outputcompression"></a> `outputCompression?` | `readonly` | `number` | - |
| <a id="property-outputformat"></a> `outputFormat?` | `readonly` | `string` | - |
| <a id="property-quality"></a> `quality?` | `readonly` | `string` | Quality tier. |
| <a id="property-resolution"></a> `resolution?` | `readonly` | `string` | - |
| <a id="property-seed"></a> `seed?` | `readonly` | `number` | Seed for reproducibility. |
| <a id="property-size"></a> `size?` | `readonly` | `string` | Image size (OpenAI-style pixel strings). |
