[Home](../README.md) > [ILibraryFileTreeSource](./ILibraryFileTreeSource.md) > skipMissingDirectories

## ILibraryFileTreeSource.skipMissingDirectories property

If true, gracefully skip this source when its data directory does not exist
instead of failing.  Useful for shared roots where not every sub-library's
directory is guaranteed to be present.

**Signature:**

```typescript
readonly skipMissingDirectories: boolean;
```
