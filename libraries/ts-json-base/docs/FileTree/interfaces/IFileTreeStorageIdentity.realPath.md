[Home](../../README.md) > [FileTree](../README.md) > [IFileTreeStorageIdentity](./IFileTreeStorageIdentity.md) > realPath

## IFileTreeStorageIdentity.realPath property

For a filesystem-backed item, its canonical path with every symbolic link
resolved. Absent for storage that has no such notion, or when the path
cannot be resolved (it does not exist).

**Signature:**

```typescript
readonly realPath: string;
```
