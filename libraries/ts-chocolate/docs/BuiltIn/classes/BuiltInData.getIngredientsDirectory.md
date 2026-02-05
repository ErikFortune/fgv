[Home](../../README.md) > [BuiltIn](../README.md) > [BuiltInData](./BuiltInData.md) > getIngredientsDirectory

## BuiltInData.getIngredientsDirectory() method

Gets the ingredients directory from the built-in library tree.

**Signature:**

```typescript
static getIngredientsDirectory(): Result<IFileTreeDirectoryItem<string>>;
```

**Returns:**

Result&lt;IFileTreeDirectoryItem&lt;string&gt;&gt;

`Success` with the ingredients directory, or `Failure` if not found.
