[Home](../../README.md) > [LibraryRuntime](../README.md) > [FillingRecipe](./FillingRecipe.md) > getVariations

## FillingRecipe.getVariations() method

Gets all variations - resolved.
Resolved lazily on first access.

**Signature:**

```typescript
getVariations(): Result<readonly FillingRecipeVariation[]>;
```

**Returns:**

Result&lt;readonly [FillingRecipeVariation](../../classes/FillingRecipeVariation.md)[]&gt;

Result with all variations, or Failure if any variation creation fails
