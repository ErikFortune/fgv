[Home](../../README.md) > [SaferFetch](../README.md) > [IGuardedFetchOptions](./IGuardedFetchOptions.md) > headersTimeoutMs

## IGuardedFetchOptions.headersTimeoutMs property

Deadline from the start of each hop to its response headers, in milliseconds. Default
SaferFetch.DEFAULT_HEADERS_TIMEOUT_MS. It covers the request and address guards, the
connect, the wait for headers and the response-headers guard, and is cleared once that guard
accepts: a stream that then lives for an hour is not cut off.

**Signature:**

```typescript
readonly headersTimeoutMs: number;
```
