[Home](../../README.md) > [LibraryRuntime](../README.md) > [ConfectionBase](./ConfectionBase.md) > getVersions

## ConfectionBase.getVersions() method

Gets all versions - resolved.
Resolved lazily on first access.

**Signature:**

```typescript
getVersions(): Result<readonly TVersion[]>;
```

**Returns:**

Result&lt;readonly TVersion[]&gt;

Result with all versions, or Failure if any version creation fails
