[Home](../README.md) > restoreRoot

# Function: restoreRoot

Restores files from a backup ZIP into a mutable storage root.

Uses "merge" semantics: files from the backup are written to the target
directory, but existing files NOT present in the backup are left untouched.

## Signature

```typescript
function restoreRoot(zipData: ArrayBuffer, rootId: string, targetDir: IFileTreeDirectoryItem): Promise<Result<IRestoreResult>>
```
