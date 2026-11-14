[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-extras](../../../README.md) / [AiAssist](../README.md) / AiEmbeddingTaskType

# Type Alias: AiEmbeddingTaskType

> **AiEmbeddingTaskType** = `"retrieval-query"` \| `"retrieval-document"` \| `"semantic-similarity"` \| `"classification"` \| `"clustering"` \| `"code-retrieval-query"` \| `"question-answering"` \| `"fact-verification"` \| `string` & `object`

A single embedding task-type hint (Gemini-style). Cross-provider; providers
that don't support task typing ignore it (logged, not failed). Open string
union so new Gemini task types don't force a churn, with the known set
enumerated for ergonomics.

## Remarks

Values are the kebab-case cross-provider form; the Gemini adapter maps them to
`SCREAMING_SNAKE_CASE` on the wire (e.g. `'retrieval-document'` →
`RETRIEVAL_DOCUMENT`).
