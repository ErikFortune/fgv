[Home](../README.md) > [BuiltInData](./BuiltInData.md) > getDecorationsDirectory

## BuiltInData.getDecorationsDirectory() method

Gets the decorations directory from the built-in library tree.

**Signature:**

```typescript
static getDecorationsDirectory(): Result<IFileTreeDirectoryItem<string>>;
```

**Returns:**

Result&lt;IFileTreeDirectoryItem&lt;string&gt;&gt;

`Success` with the decorations directory, or `Failure` if not found.
