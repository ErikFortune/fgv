[Home](../README.md) > backupRoots

# Function: backupRoots

Backs up one or more storage roots into a single ZIP archive.

ZIP structure:
```
_backup-manifest.json
{rootId}/
  data/
    ingredients/
      my-collection.yaml
    settings/
      preferences.json
```

## Signature

```typescript
function backupRoots(roots: readonly IBackupRootInput[]): Promise<Result<Uint8Array<ArrayBufferLike>>>
```
