[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-extras](../../../README.md) / [AiAssist](../README.md) / AiImageApiFormat

# Type Alias: AiImageApiFormat

> **AiImageApiFormat** = `"openai-images"` \| `"xai-images"` \| `"xai-images-edits"` \| `"gemini-image-out"`

API format categories for image-generation provider routing.

## Remarks

- `'openai-images'` — OpenAI Images API. Routes to `/images/generations`
  (text-only) or `/images/edits` (when reference images are present).
- `'xai-images'` — xAI Images API. Text-only JSON generation request.
- `'xai-images-edits'` — xAI Images API for Grok Imagine models. Uses JSON
  body with `{ type: "image_url" }` objects (not multipart).
- `'gemini-image-out'` — Google Gemini chat-style `:generateContent`
  endpoint that returns image parts (Gemini Flash Image / "Nano
  Banana"). Accepts reference images.
