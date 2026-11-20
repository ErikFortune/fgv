[Home](../README.md) > [ISaferFetchOptions](./ISaferFetchOptions.md) > retry

## ISaferFetchOptions.retry property

Opt-in retry. **Off by default** — a primitive that silently retries changes the semantics
of every call site and amplifies load against a service that is already struggling.

**Signature:**

```typescript
readonly retry: IRetryPolicy;
```
