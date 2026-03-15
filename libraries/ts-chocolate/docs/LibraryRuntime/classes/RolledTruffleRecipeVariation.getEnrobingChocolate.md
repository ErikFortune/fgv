[Home](../../README.md) > [LibraryRuntime](../README.md) > [RolledTruffleRecipeVariation](./RolledTruffleRecipeVariation.md) > getEnrobingChocolate

## RolledTruffleRecipeVariation.getEnrobingChocolate() method

Gets resolved enrobing chocolate specification (lazy-loaded).

**Signature:**

```typescript
getEnrobingChocolate(): Result<IResolvedChocolateSpec | undefined>;
```

**Returns:**

Result&lt;[IResolvedChocolateSpec](../../interfaces/IResolvedChocolateSpec.md) | undefined&gt;

Result with resolved chocolate spec (or undefined if not specified), or Failure if resolution fails
