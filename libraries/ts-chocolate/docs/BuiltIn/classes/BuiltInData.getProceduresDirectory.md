[Home](../../README.md) > [BuiltIn](../README.md) > [BuiltInData](./BuiltInData.md) > getProceduresDirectory

## BuiltInData.getProceduresDirectory() method

Gets the procedures directory from the built-in library tree.

**Signature:**

```typescript
static getProceduresDirectory(): Result<IFileTreeDirectoryItem<string>>;
```

**Returns:**

Result&lt;IFileTreeDirectoryItem&lt;string&gt;&gt;

`Success` with the procedures directory, or `Failure` if not found.
