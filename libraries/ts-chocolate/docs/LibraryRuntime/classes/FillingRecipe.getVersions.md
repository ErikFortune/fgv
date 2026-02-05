[Home](../../README.md) > [LibraryRuntime](../README.md) > [FillingRecipe](./FillingRecipe.md) > getVersions

## FillingRecipe.getVersions() method

Gets all versions - resolved.
Resolved lazily on first access.

**Signature:**

```typescript
getVersions(): Result<readonly FillingRecipeVersion[]>;
```

**Returns:**

Result&lt;readonly [FillingRecipeVersion](../../classes/FillingRecipeVersion.md)[]&gt;

Result with all versions, or Failure if any version creation fails
