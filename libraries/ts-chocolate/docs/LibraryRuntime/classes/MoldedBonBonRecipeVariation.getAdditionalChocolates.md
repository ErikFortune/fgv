[Home](../../README.md) > [LibraryRuntime](../README.md) > [MoldedBonBonRecipeVariation](./MoldedBonBonRecipeVariation.md) > getAdditionalChocolates

## MoldedBonBonRecipeVariation.getAdditionalChocolates() method

Gets resolved additional chocolates (lazy-loaded).

**Signature:**

```typescript
getAdditionalChocolates(): Result<readonly IResolvedAdditionalChocolate[]>;
```

**Returns:**

Result&lt;readonly [IResolvedAdditionalChocolate](../../interfaces/IResolvedAdditionalChocolate.md)[]&gt;

Result with resolved additional chocolates (may be empty array), or Failure if resolution fails
