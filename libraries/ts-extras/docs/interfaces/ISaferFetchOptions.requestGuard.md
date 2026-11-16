[Home](../README.md) > [ISaferFetchOptions](./ISaferFetchOptions.md) > requestGuard

## ISaferFetchOptions.requestGuard property

Policy guard over the outbound request. Optional here and non-optional once resolved —
it defaults to silent passthrough, applied once at the boundary, so no downstream code
path branches on a guard's absence.

**Signature:**

```typescript
readonly requestGuard: IRequestGuard;
```
