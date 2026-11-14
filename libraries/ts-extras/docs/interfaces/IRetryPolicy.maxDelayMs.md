[Home](../README.md) > [IRetryPolicy](./IRetryPolicy.md) > maxDelayMs

## IRetryPolicy.maxDelayMs property

Ceiling on any single delay, in milliseconds. Default
SaferFetch.DEFAULT_RETRY_MAX_DELAY_MS. Also clamps a server-supplied
`Retry-After`, which is the security-relevant half of its job.

**Signature:**

```typescript
readonly maxDelayMs: number;
```
