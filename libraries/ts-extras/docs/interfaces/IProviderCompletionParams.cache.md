[Home](../README.md) > [IProviderCompletionParams](./IProviderCompletionParams.md) > cache

## IProviderCompletionParams.cache property

Prompt-caching plan for this request. Omitted, nothing cache-related is sent — the request
body is byte-identical to a build predating this feature. See AiAssist.IAiCacheRequest.

**Signature:**

```typescript
readonly cache: IAiCacheRequest;
```
