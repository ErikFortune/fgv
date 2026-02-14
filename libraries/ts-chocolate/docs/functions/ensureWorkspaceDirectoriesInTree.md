[Home](../README.md) > ensureWorkspaceDirectoriesInTree

# Function: ensureWorkspaceDirectoriesInTree

Ensures the standard workspace directory structure exists in a FileTree.

Platform-agnostic equivalent of createWorkspaceDirectories — works
with any writable FileTree (localStorage, File System Access API, in-memory, etc.).

## Signature

```typescript
function ensureWorkspaceDirectoriesInTree(root: IFileTreeDirectoryItem): Result<void>
```
