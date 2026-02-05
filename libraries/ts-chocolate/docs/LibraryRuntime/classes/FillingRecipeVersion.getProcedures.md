[Home](../../README.md) > [LibraryRuntime](../README.md) > [FillingRecipeVersion](./FillingRecipeVersion.md) > getProcedures

## FillingRecipeVersion.getProcedures() method

Gets resolved procedures associated with this version.
Returns Result with procedures, or Success with undefined if version has no procedures.
Resolved lazily on first access.

**Signature:**

```typescript
getProcedures(): Result<IResolvedProcedures | undefined>;
```

**Returns:**

Result&lt;[IResolvedProcedures](../../interfaces/IResolvedProcedures.md) | undefined&gt;

Result with resolved procedures or undefined, or Failure if resolution fails
