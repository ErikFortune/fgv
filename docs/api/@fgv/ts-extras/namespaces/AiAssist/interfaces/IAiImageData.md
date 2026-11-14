[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-extras](../../../README.md) / [AiAssist](../README.md) / IAiImageData

# Interface: IAiImageData

Universal image representation used for both image input (vision prompts)
and image output (generation responses).

## Remarks

The base64 string is raw — no `data:` URL prefix. Use [AiAssist.toDataUrl](../functions/toDataUrl.md) to
format it for browser-display contexts.

## Extended by

- [`IAiImageAttachment`](IAiImageAttachment.md)
- [`IAiGeneratedImage`](IAiGeneratedImage.md)

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="property-base64"></a> `base64` | `readonly` | `string` | Base64-encoded image bytes (no `data:` prefix). |
| <a id="property-mimetype"></a> `mimeType` | `readonly` | `string` | MIME type, e.g. `'image/png'`, `'image/jpeg'`, `'image/webp'`. |
