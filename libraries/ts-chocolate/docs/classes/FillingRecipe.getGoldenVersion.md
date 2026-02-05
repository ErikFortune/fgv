[Home](../README.md) > [FillingRecipe](./FillingRecipe.md) > getGoldenVersion

## FillingRecipe.getGoldenVersion() method

Gets the golden (default approved) version - resolved.
Resolved lazily on first access.

**Signature:**

```typescript
getGoldenVersion(): Result<FillingRecipeVersion>;
```

**Returns:**

Result&lt;[FillingRecipeVersion](FillingRecipeVersion.md)&gt;

Result with golden version, or Failure if creation fails
