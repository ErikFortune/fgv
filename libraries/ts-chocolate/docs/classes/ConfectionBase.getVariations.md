[Home](../README.md) > [ConfectionBase](./ConfectionBase.md) > getVariations

## ConfectionBase.getVariations() method

Gets all variations - resolved.
Resolved lazily on first access.

**Signature:**

```typescript
getVariations(): Result<readonly TVariation[]>;
```

**Returns:**

Result&lt;readonly TVariation[]&gt;

Result with all variations, or Failure if any variation creation fails
