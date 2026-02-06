[Home](../../README.md) > [LibraryRuntime](../README.md) > [ConfectionVersionBase](./ConfectionVersionBase.md) > getProcedures

## ConfectionVersionBase.getProcedures() method

Gets resolved procedures for this variation.

**Signature:**

```typescript
getProcedures(): Result<IOptionsWithPreferred<IResolvedConfectionProcedure, ProcedureId> | undefined>;
```

**Returns:**

Result&lt;[IOptionsWithPreferred](../../interfaces/IOptionsWithPreferred.md)&lt;[IResolvedConfectionProcedure](../../interfaces/IResolvedConfectionProcedure.md), [ProcedureId](../../type-aliases/ProcedureId.md)&gt; | undefined&gt;

Result with resolved procedures (undefined if none), or Failure if resolution fails
