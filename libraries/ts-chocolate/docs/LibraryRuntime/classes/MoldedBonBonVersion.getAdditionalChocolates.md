[Home](../../README.md) > [LibraryRuntime](../README.md) > [MoldedBonBonVersion](./MoldedBonBonVersion.md) > getAdditionalChocolates

## MoldedBonBonVersion.getAdditionalChocolates() method

Gets resolved additional chocolates (lazy-loaded).

**Signature:**

```typescript
getAdditionalChocolates(): Result<readonly IResolvedAdditionalChocolate[]>;
```

**Returns:**

Result&lt;readonly [IResolvedAdditionalChocolate](../../interfaces/IResolvedAdditionalChocolate.md)[]&gt;

Result with resolved additional chocolates (may be empty array), or Failure if resolution fails
