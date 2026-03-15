[Home](../../README.md) > [LibraryData](../README.md) > [ILoadCollectionFromFileTreeParams](./ILoadCollectionFromFileTreeParams.md) > encryption

## ILoadCollectionFromFileTreeParams.encryption property

Optional encryption configuration for decrypting encrypted collection files.
If not provided, encrypted files will be treated as regular JSON (and likely fail validation).

**Signature:**

```typescript
readonly encryption: IEncryptionConfig;
```
