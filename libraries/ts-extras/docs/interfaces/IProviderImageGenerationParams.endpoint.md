[Home](../README.md) > [IProviderImageGenerationParams](./IProviderImageGenerationParams.md) > endpoint

## IProviderImageGenerationParams.endpoint property

Optional override of the descriptor's default base URL. Same semantics as
the non-streaming completion path's endpoint: a well-formed `http`/`https`
URL substituted for `descriptor.baseUrl` when composing the request, with
the per-route suffix (e.g. `/images/generations`, `:predict`) appended
unchanged.

**Signature:**

```typescript
readonly endpoint: string;
```
