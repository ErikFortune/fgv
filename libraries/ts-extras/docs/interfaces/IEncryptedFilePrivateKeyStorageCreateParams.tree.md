[Home](../README.md) > [IEncryptedFilePrivateKeyStorageCreateParams](./IEncryptedFilePrivateKeyStorageCreateParams.md) > tree

## IEncryptedFilePrivateKeyStorageCreateParams.tree property

Optional FileTree.IFileTreeDirectoryItem | FileTree directory
override. When supplied it is used as the storage directory directly and
CryptoUtils.KeyStore.IEncryptedFilePrivateKeyStorageCreateParams.directory is ignored —
pass an in-memory tree for tests, or another Node-compatible backend. When
omitted, a mutable `FsTree` rooted at `directory` is used. (This backend is
Node-only — it round-trips keys through `node:crypto` — so a browser file
tree is not a supported target.)

**Signature:**

```typescript
readonly tree: IFileTreeDirectoryItem<string>;
```
