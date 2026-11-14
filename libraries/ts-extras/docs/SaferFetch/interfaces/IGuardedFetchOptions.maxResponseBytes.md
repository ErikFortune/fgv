[Home](../../README.md) > [SaferFetch](../README.md) > [IGuardedFetchOptions](./IGuardedFetchOptions.md) > maxResponseBytes

## IGuardedFetchOptions.maxResponseBytes property

Cap on the response body, in bytes, counted as the caller reads it. Opt-in: with no value the
body is unbounded and the platform's own `Response` is returned untouched.

**Signature:**

```typescript
readonly maxResponseBytes: number;
```
