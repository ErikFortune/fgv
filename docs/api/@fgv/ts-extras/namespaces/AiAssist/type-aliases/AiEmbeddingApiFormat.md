[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-extras](../../../README.md) / [AiAssist](../README.md) / AiEmbeddingApiFormat

# Type Alias: AiEmbeddingApiFormat

> **AiEmbeddingApiFormat** = `"openai-embeddings"` \| `"gemini-embeddings"`

API format categories for embedding provider routing.

## Remarks

- `'openai-embeddings'` — OpenAI `/v1/embeddings` shape. Serves OpenAI,
  Ollama (via `/v1`), openai-compat self-hosted servers (vLLM, LM Studio,
  llama.cpp's openai-server), and Mistral (`mistral-embed`) — all of which
  speak the same request/response shape.
- `'gemini-embeddings'` — Google Gemini `:batchEmbedContents` endpoint. A
  genuinely divergent shape (different route, auth header, request body, and
  the `taskType` retrieval-asymmetry knob that has no OpenAI analog).

Named with the `ApiFormat` suffix for symmetry with `AiApiFormat` and
`AiImageApiFormat`.
