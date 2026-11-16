[Home](../README.md) > [IAiProviderDescriptor](./IAiProviderDescriptor.md) > maxOutputTokens

## IAiProviderDescriptor.maxOutputTokens property

Per-model maximum output tokens — the largest `maxTokens` the provider accepts for a
completion on that model. Absent (or no matching entry) means the limit is unknown.

**Signature:**

```typescript
readonly maxOutputTokens: readonly IAiMaxOutputTokensCapability[];
```
