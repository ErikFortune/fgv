[Home](../../README.md) > [LibraryRuntime](../README.md) > [ConfectionVersionBase](./ConfectionVersionBase.md) > getFillings

## ConfectionVersionBase.getFillings() method

Gets resolved filling slots for this version.

**Signature:**

```typescript
getFillings(): Result<readonly IResolvedFillingSlot[]>;
```

**Returns:**

Result&lt;readonly [IResolvedFillingSlot](../../interfaces/IResolvedFillingSlot.md)[]&gt;

Result with resolved fillings (empty array if none), or Failure if resolution fails
