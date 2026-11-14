[Home](../README.md) > [IGuardedFetchOptions](./IGuardedFetchOptions.md) > redirectPolicy

## IGuardedFetchOptions.redirectPolicy property

How redirects are handled. Defaults to `'reject'`, as everywhere in safer-fetch. The caller's
`RequestInit.redirect` is ignored: the platform is never allowed to follow a hop the guard did
not see.

**Signature:**

```typescript
readonly redirectPolicy: SaferFetchRedirectPolicy;
```
