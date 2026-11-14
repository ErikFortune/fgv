[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-extras](../../../README.md) / [AiAssist](../README.md) / IAiImageGenerationParams

# Interface: IAiImageGenerationParams

Parameters for an image-generation request.

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="property-options"></a> `options?` | `readonly` | [`IAiImageGenerationOptions`](IAiImageGenerationOptions.md) | Optional generation options. |
| <a id="property-prompt"></a> `prompt` | `readonly` | `string` | The text prompt describing the desired image. |
| <a id="property-referenceimages"></a> `referenceImages?` | `readonly` | readonly [`IAiImageAttachment`](IAiImageAttachment.md)[] | Optional reference images. When present, the provider will use them as visual context (e.g. to preserve a character's appearance across multiple generations). The dispatcher resolves the [AiAssist.IAiImageModelCapability](IAiImageModelCapability.md) for the requested model and rejects the call up front if `acceptsImageReferenceInput` is not set on the matching capability. An empty array is treated identically to `undefined`. |
