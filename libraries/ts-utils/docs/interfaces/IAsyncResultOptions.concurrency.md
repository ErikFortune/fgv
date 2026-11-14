[Home](../README.md) > [IAsyncResultOptions](./IAsyncResultOptions.md) > concurrency

## IAsyncResultOptions.concurrency property

Maximum number of operations in flight at once.  Defaults to
DEFAULT_RESULT_CONCURRENCY.  Values below `1`, and `NaN`, are clamped to `1`;
fractional values are truncated; supply `Number.POSITIVE_INFINITY` to run without a bound.

**Signature:**

```typescript
readonly concurrency: number;
```
