[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-extras](../../../README.md) / [AiAssist](../README.md) / IAiImageAttachment

# Interface: IAiImageAttachment

Image attachment for a vision (image-input) prompt.

## Remarks

Extends [IAiImageData](IAiImageData.md) with an OpenAI-specific `detail` hint that is
silently ignored by Anthropic, Gemini, and other providers.

## Extends

- [`IAiImageData`](IAiImageData.md)

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="property-base64"></a> `base64` | `readonly` | `string` | Base64-encoded image bytes (no `data:` prefix). |
| <a id="property-detail"></a> `detail?` | `readonly` | `"auto"` \| `"high"` \| `"low"` | OpenAI vision detail hint: - `'low'`: faster, cheaper, lower fidelity - `'high'`: slower, more expensive, higher fidelity - `'auto'` (default): provider chooses Ignored by providers other than OpenAI. |
| <a id="property-mimetype"></a> `mimeType` | `readonly` | `string` | MIME type, e.g. `'image/png'`, `'image/jpeg'`, `'image/webp'`. |
