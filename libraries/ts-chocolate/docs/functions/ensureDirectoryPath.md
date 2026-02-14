[Home](../README.md) > ensureDirectoryPath

# Function: ensureDirectoryPath

Ensures a directory path exists in a FileTree, creating intermediate
directories as needed (analogous to `mkdir -p`).

## Signature

```typescript
function ensureDirectoryPath(root: IFileTreeDirectoryItem, relativePath: string): Result<IFileTreeDirectoryItem<string>>
```
