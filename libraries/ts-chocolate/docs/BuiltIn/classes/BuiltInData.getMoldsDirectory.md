[Home](../../README.md) > [BuiltIn](../README.md) > [BuiltInData](./BuiltInData.md) > getMoldsDirectory

## BuiltInData.getMoldsDirectory() method

Gets the molds directory from the built-in library tree.

**Signature:**

```typescript
static getMoldsDirectory(): Result<IFileTreeDirectoryItem<string>>;
```

**Returns:**

Result&lt;IFileTreeDirectoryItem&lt;string&gt;&gt;

`Success` with the molds directory, or `Failure` if not found.
