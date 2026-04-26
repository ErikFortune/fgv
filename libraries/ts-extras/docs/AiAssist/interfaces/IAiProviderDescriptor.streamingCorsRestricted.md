[Home](../../README.md) > [AiAssist](../README.md) > [IAiProviderDescriptor](./IAiProviderDescriptor.md) > streamingCorsRestricted

## IAiProviderDescriptor.streamingCorsRestricted property

Whether this provider's streaming completion endpoint requires a proxy
for direct browser calls. Some providers gate streaming separately from
non-streaming (rare), so this is tracked independently from
IAiProviderDescriptor.corsRestricted.

**Signature:**

```typescript
readonly streamingCorsRestricted: boolean;
```
