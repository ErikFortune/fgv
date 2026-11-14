[Home](../../README.md) > [SaferFetch](../README.md) > [ISaferFetchOptions](./ISaferFetchOptions.md) > responseHeadersGuard

## ISaferFetchOptions.responseHeadersGuard property

Policy guard over the response head. Defaults to silent passthrough. Content-type gating
lives here — see SaferFetch.allowContentTypes; it is deliberately not a separate
option, which would be a second mechanism for one job.

**Signature:**

```typescript
readonly responseHeadersGuard: IResponseHeadersGuard;
```
