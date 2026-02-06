[Home](../../README.md) > [LibraryRuntime](../README.md) > [ConfectionBase](./ConfectionBase.md) > getGoldenVariation

## ConfectionBase.getGoldenVariation() method

Gets the golden (default) variation - resolved.
Resolved lazily on first access.

**Signature:**

```typescript
getGoldenVariation(): Result<TVariation>;
```

**Returns:**

Result&lt;TVariation&gt;

Result with golden variation, or Failure if creation fails
