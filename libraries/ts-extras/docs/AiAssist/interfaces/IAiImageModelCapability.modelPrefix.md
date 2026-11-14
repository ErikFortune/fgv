[Home](../../README.md) > [AiAssist](../README.md) > [IAiImageModelCapability](./IAiImageModelCapability.md) > modelPrefix

## IAiImageModelCapability.modelPrefix property

Prefix matched against the resolved image model id. The empty string is
the catch-all and matches every model. When multiple rules' prefixes
match a model id, the longest prefix wins; ties are broken by
first-encountered.

**Signature:**

```typescript
readonly modelPrefix: string;
```
