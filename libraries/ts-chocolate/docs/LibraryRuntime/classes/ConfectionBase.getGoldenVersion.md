[Home](../../README.md) > [LibraryRuntime](../README.md) > [ConfectionBase](./ConfectionBase.md) > getGoldenVersion

## ConfectionBase.getGoldenVersion() method

Gets the golden (default) version - resolved.
Resolved lazily on first access.

**Signature:**

```typescript
getGoldenVersion(): Result<TVersion>;
```

**Returns:**

Result&lt;TVersion&gt;

Result with golden version, or Failure if creation fails
