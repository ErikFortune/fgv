[Home](../../README.md) > [SaferFetch](../README.md) > [ISaferFetchOptions](./ISaferFetchOptions.md) > timeoutMs

## ISaferFetchOptions.timeoutMs property

Overall deadline in milliseconds, covering the connect, the response headers, and the
body read. Default SaferFetch.DEFAULT_TIMEOUT_MS. This is the deadline that stops
a response dribbling one byte every 25 seconds, which passes every per-read check.

**Signature:**

```typescript
readonly timeoutMs: number;
```
