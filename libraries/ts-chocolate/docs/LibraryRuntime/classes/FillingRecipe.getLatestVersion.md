[Home](../../README.md) > [LibraryRuntime](../README.md) > [FillingRecipe](./FillingRecipe.md) > getLatestVersion

## FillingRecipe.getLatestVersion() method

Gets the latest version (by created date).
Resolved lazily on first access.

**Signature:**

```typescript
getLatestVersion(): Result<FillingRecipeVersion>;
```

**Returns:**

Result&lt;[FillingRecipeVersion](../../classes/FillingRecipeVersion.md)&gt;

Result with latest version, or Failure if creation fails
