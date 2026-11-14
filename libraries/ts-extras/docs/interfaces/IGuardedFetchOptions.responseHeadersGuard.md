[Home](../README.md) > [IGuardedFetchOptions](./IGuardedFetchOptions.md) > responseHeadersGuard

## IGuardedFetchOptions.responseHeadersGuard property

Policy guard over the head of every response the function returns, whatever its status. It
runs before the response is handed back, so a refusal costs no body bytes. Defaults to silent
passthrough.

**Signature:**

```typescript
readonly responseHeadersGuard: IResponseHeadersGuard;
```
