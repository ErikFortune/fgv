[Home](../README.md) > [FillingRecipe](./FillingRecipe.md) > getVariations

## FillingRecipe.getVariations() method

Gets all variations - resolved.
Resolved lazily on first access.

**Signature:**

```typescript
getVariations(): Result<readonly FillingRecipeVersion[]>;
```

**Returns:**

Result&lt;readonly [FillingRecipeVersion](FillingRecipeVersion.md)[]&gt;

Result with all variations, or Failure if any variation creation fails
