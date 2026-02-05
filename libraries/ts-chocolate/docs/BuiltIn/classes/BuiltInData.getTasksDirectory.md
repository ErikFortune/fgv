[Home](../../README.md) > [BuiltIn](../README.md) > [BuiltInData](./BuiltInData.md) > getTasksDirectory

## BuiltInData.getTasksDirectory() method

Gets the tasks directory from the built-in library tree.

**Signature:**

```typescript
static getTasksDirectory(): Result<IFileTreeDirectoryItem<string>>;
```

**Returns:**

Result&lt;IFileTreeDirectoryItem&lt;string&gt;&gt;

`Success` with the tasks directory, or `Failure` if not found.
