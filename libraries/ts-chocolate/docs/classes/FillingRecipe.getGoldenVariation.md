[Home](../README.md) > [FillingRecipe](./FillingRecipe.md) > getGoldenVariation

## FillingRecipe.getGoldenVariation() method

Gets the golden (default approved) variation - resolved.
Resolved lazily on first access.

**Signature:**

```typescript
getGoldenVariation(): Result<FillingRecipeVariation>;
```

**Returns:**

Result&lt;[FillingRecipeVariation](FillingRecipeVariation.md)&gt;

Result with golden variation, or Failure if creation fails
