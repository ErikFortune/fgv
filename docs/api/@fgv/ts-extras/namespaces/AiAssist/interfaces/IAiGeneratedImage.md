[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-extras](../../../README.md) / [AiAssist](../README.md) / IAiGeneratedImage

# Interface: IAiGeneratedImage

A single generated image.

## Extends

- [`IAiImageData`](IAiImageData.md)

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="property-base64"></a> `base64` | `readonly` | `string` | Base64-encoded image bytes (no `data:` prefix). |
| <a id="property-mimetype"></a> `mimeType` | `readonly` | `string` | MIME type, e.g. `'image/png'`, `'image/jpeg'`, `'image/webp'`. |
| <a id="property-revisedprompt"></a> `revisedPrompt?` | `readonly` | `string` | The prompt as rewritten by the provider, if any. OpenAI's image models commonly rewrite prompts; other providers do not. |
