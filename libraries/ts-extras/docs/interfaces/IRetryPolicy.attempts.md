[Home](../README.md) > [IRetryPolicy](./IRetryPolicy.md) > attempts

## IRetryPolicy.attempts property

Additional attempts after the first, **not** a total. `attempts: 2` means up to three
requests. Must be a non-negative integer; `0` disables retry.

**Signature:**

```typescript
readonly attempts: number;
```
