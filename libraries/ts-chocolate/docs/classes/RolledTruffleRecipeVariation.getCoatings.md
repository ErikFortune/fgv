[Home](../README.md) > [RolledTruffleRecipeVariation](./RolledTruffleRecipeVariation.md) > getCoatings

## RolledTruffleRecipeVariation.getCoatings() method

Gets resolved coatings specification (lazy-loaded).

**Signature:**

```typescript
getCoatings(): Result<IResolvedCoatings | undefined>;
```

**Returns:**

Result&lt;[IResolvedCoatings](../interfaces/IResolvedCoatings.md) | undefined&gt;

Result with resolved coatings (or undefined if not specified), or Failure if resolution fails
