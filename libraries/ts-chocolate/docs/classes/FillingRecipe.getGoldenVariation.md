[Home](../README.md) > [FillingRecipe](./FillingRecipe.md) > getGoldenVariation

## FillingRecipe.getGoldenVariation() method

Gets the golden (default approved) variation - resolved.
Resolved lazily on first access.

**Signature:**

```typescript
getGoldenVariation(): Result<FillingRecipeVersion>;
```

**Returns:**

Result&lt;[FillingRecipeVersion](FillingRecipeVersion.md)&gt;

Result with golden variation, or Failure if creation fails
