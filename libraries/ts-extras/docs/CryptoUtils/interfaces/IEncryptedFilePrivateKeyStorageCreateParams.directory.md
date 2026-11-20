[Home](../../README.md) > [CryptoUtils](../README.md) > [IEncryptedFilePrivateKeyStorageCreateParams](./IEncryptedFilePrivateKeyStorageCreateParams.md) > directory

## IEncryptedFilePrivateKeyStorageCreateParams.directory property

Filesystem path to the directory that holds the encrypted private-key
files. Used only when CryptoUtils.KeyStore.IEncryptedFilePrivateKeyStorageCreateParams.tree
is omitted (the default `FsTree` backing). The directory must already
exist.

**Signature:**

```typescript
readonly directory: string;
```
