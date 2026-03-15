[Home](../../README.md) > [LibraryRuntime](../README.md) > [MoldedBonBonRecipeVariation](./MoldedBonBonRecipeVariation.md) > getMolds

## MoldedBonBonRecipeVariation.getMolds() method

Gets resolved molds with preferred selection (lazy-loaded).

**Signature:**

```typescript
getMolds(): Result<IOptionsWithPreferred<IResolvedConfectionMoldRef, MoldId>>;
```

**Returns:**

Result&lt;[IOptionsWithPreferred](../../interfaces/IOptionsWithPreferred.md)&lt;[IResolvedConfectionMoldRef](../../interfaces/IResolvedConfectionMoldRef.md), [MoldId](../../type-aliases/MoldId.md)&gt;&gt;

Result with resolved molds, or Failure if resolution fails
