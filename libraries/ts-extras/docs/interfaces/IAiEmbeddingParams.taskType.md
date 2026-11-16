[Home](../README.md) > [IAiEmbeddingParams](./IAiEmbeddingParams.md) > taskType

## IAiEmbeddingParams.taskType property

Task-type hint. Mapped to Gemini `taskType`; a no-op (with a `logger.info`
note) on OpenAI/Ollama/compat/Mistral. Preserves Gemini's
query-vs-document retrieval asymmetry.

**Signature:**

```typescript
readonly taskType: AiEmbeddingTaskType;
```
