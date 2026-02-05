[Home](../README.md) > [ILoadCollectionFromFileTreeParams](./ILoadCollectionFromFileTreeParams.md) > onEncryptedFile

## ILoadCollectionFromFileTreeParams.onEncryptedFile property

How to handle encrypted files in synchronous loading.
- `'fail'`: Fail the entire load operation
- `'skip'`: Silently skip encrypted files
- `'warn'`: Log warning and skip encrypted files
- `'capture'`: Capture encrypted files for later decryption (default)

Defaults to `'capture'` so encrypted files are tracked and can be decrypted
on-demand when keys become available.

**Signature:**

```typescript
readonly onEncryptedFile: EncryptedFileHandling;
```
