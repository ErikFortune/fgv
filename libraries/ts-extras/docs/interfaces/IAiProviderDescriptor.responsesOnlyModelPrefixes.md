[Home](../README.md) > [IAiProviderDescriptor](./IAiProviderDescriptor.md) > responsesOnlyModelPrefixes

## IAiProviderDescriptor.responsesOnlyModelPrefixes property

Concrete model ids (prefix-matched) that must be invoked via the OpenAI
Responses API rather than chat completions — e.g. `gpt-5.5-pro`. Non-OpenAI
`apiFormat`s ignore this.

**Signature:**

```typescript
readonly responsesOnlyModelPrefixes: readonly string[];
```
