[Home](../../README.md) > [LibraryRuntime](../README.md) > [ILibraryRuntimeContext](./ILibraryRuntimeContext.md) > molds

## ILibraryRuntimeContext.molds property

A materialized library of all molds, keyed by composite ID.
Molds are resolved lazily on access and cached.
Use `.get(id)` for ID-based lookup, `.has(id)` for existence checks,
`.values()` for iteration.

**Signature:**

```typescript
readonly molds: MaterializedLibrary<MoldId, IMoldEntity, IMold, never>;
```
