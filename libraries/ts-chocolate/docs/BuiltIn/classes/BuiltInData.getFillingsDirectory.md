[Home](../../README.md) > [BuiltIn](../README.md) > [BuiltInData](./BuiltInData.md) > getFillingsDirectory

## BuiltInData.getFillingsDirectory() method

Gets the recipes directory from the built-in library tree.

**Signature:**

```typescript
static getFillingsDirectory(): Result<IFileTreeDirectoryItem<string>>;
```

**Returns:**

Result&lt;IFileTreeDirectoryItem&lt;string&gt;&gt;

`Success` with the recipes directory, or `Failure` if not found.
