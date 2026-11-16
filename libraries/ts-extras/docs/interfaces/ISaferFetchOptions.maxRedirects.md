[Home](../README.md) > [ISaferFetchOptions](./ISaferFetchOptions.md) > maxRedirects

## ISaferFetchOptions.maxRedirects property

Cap on redirect hops followed under `'validate-each-hop'`. Default
SaferFetch.DEFAULT_MAX_REDIRECTS (5). Must be a non-negative integer; `0` refuses
to follow any redirect.

**Signature:**

```typescript
readonly maxRedirects: number;
```
