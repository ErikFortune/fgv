[Home](../README.md) > [LibraryRuntimeContext](./LibraryRuntimeContext.md) > procedures

## LibraryRuntimeContext.procedures property

A materialized library of all procedures, keyed by composite ID.
Procedures are resolved lazily on access and cached.

**Signature:**

```typescript
readonly procedures: MaterializedLibrary<ProcedureId, IProcedureEntity, Procedure, never>;
```
