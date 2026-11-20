[Home](../../README.md) > [AiAssist](../README.md) > AiEmbeddingTaskType

# Type Alias: AiEmbeddingTaskType

A single embedding task-type hint (Gemini-style). Cross-provider; providers
that don't support task typing ignore it (logged, not failed). Open string
union so new Gemini task types don't force a churn, with the known set
enumerated for ergonomics.

## Type

```typescript
type AiEmbeddingTaskType = "retrieval-query" | "retrieval-document" | "semantic-similarity" | "classification" | "clustering" | "code-retrieval-query" | "question-answering" | "fact-verification" | string & {}
```
