[Home](../README.md) > [IProviderCompletionStreamParams](./IProviderCompletionStreamParams.md) > cache

## IProviderCompletionStreamParams.cache property

Prompt-caching plan for this request. Omitted, nothing cache-related is sent — the request
body is byte-identical to a build predating this feature. See AiAssist.IAiCacheRequest.
Validated against this request's own `system` at the point it is applied, and gated per
provider exactly as `IProviderCompletionParams.cache` is on the non-streaming path.

**Signature:**

```typescript
readonly cache: IAiCacheRequest;
```
