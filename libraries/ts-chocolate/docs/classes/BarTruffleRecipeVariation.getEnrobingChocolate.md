[Home](../README.md) > [BarTruffleRecipeVariation](./BarTruffleRecipeVariation.md) > getEnrobingChocolate

## BarTruffleRecipeVariation.getEnrobingChocolate() method

Gets resolved enrobing chocolate specification (lazy-loaded).

**Signature:**

```typescript
getEnrobingChocolate(): Result<IResolvedChocolateSpec | undefined>;
```

**Returns:**

Result&lt;[IResolvedChocolateSpec](../interfaces/IResolvedChocolateSpec.md) | undefined&gt;

Result with resolved chocolate spec (or undefined if not specified), or Failure if resolution fails
