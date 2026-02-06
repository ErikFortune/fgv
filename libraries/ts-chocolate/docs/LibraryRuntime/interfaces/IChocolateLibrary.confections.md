[Home](../../README.md) > [LibraryRuntime](../README.md) > [IChocolateLibrary](./IChocolateLibrary.md) > confections

## IChocolateLibrary.confections property

A materialized library of all confections, keyed by composite ID.
Confections are resolved lazily on access and cached.
Use `.get(id)` for ID-based lookup, `.has(id)` for existence checks,
`.values()` for iteration.

**Signature:**

```typescript
readonly confections: MaterializedLibrary<ConfectionId, AnyConfectionRecipeEntity, IConfectionBase<AnyConfectionRecipeVariation, AnyConfectionRecipeEntity>, never>;
```
