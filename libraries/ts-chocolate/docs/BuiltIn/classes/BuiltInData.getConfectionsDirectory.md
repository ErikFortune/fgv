[Home](../../README.md) > [BuiltIn](../README.md) > [BuiltInData](./BuiltInData.md) > getConfectionsDirectory

## BuiltInData.getConfectionsDirectory() method

Gets the confections directory from the built-in library tree.

**Signature:**

```typescript
static getConfectionsDirectory(): Result<IFileTreeDirectoryItem<string>>;
```

**Returns:**

Result&lt;IFileTreeDirectoryItem&lt;string&gt;&gt;

`Success` with the confections directory, or `Failure` if not found.
