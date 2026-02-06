[Home](../../README.md) > [LibraryRuntime](../README.md) > [FillingRecipe](./FillingRecipe.md) > getLatestVariation

## FillingRecipe.getLatestVariation() method

Gets the latest variation (by created date).
Resolved lazily on first access.

**Signature:**

```typescript
getLatestVariation(): Result<FillingRecipeVersion>;
```

**Returns:**

Result&lt;[FillingRecipeVersion](../../classes/FillingRecipeVersion.md)&gt;

Result with latest variation, or Failure if creation fails
