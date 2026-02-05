[Home](../../README.md) > [LibraryRuntime](../README.md) > [ILibraryRuntimeContext](./ILibraryRuntimeContext.md) > procedures

## ILibraryRuntimeContext.procedures property

A materialized library of all procedures, keyed by composite ID.
Procedures are resolved lazily on access and cached.
Use `.get(id)` for ID-based lookup, `.has(id)` for existence checks,
`.values()` for iteration.

**Signature:**

```typescript
readonly procedures: MaterializedLibrary<ProcedureId, IProcedureEntity, IProcedure, never>;
```
