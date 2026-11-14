[Home](../../README.md) > [SaferFetch](../README.md) > [ISaferFetchOptions](./ISaferFetchOptions.md) > sensitiveHeaders

## ISaferFetchOptions.sensitiveHeaders property

Additional header names to drop on a cross-origin redirect hop, on top of the always-dropped
`authorization`, `cookie` and `proxy-authorization`
(SaferFetch.ALWAYS_STRIPPED_HEADERS).

**Signature:**

```typescript
readonly sensitiveHeaders: readonly string[];
```
