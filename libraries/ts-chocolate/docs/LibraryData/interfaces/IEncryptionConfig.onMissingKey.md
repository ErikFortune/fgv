[Home](../../README.md) > [LibraryData](../README.md) > [IEncryptionConfig](./IEncryptionConfig.md) > onMissingKey

## IEncryptionConfig.onMissingKey property

How to handle encrypted files when the required secret is not available.
- `'fail'` (default): Fail the entire load operation.
- `'skip'`: Skip the encrypted file and continue loading other files.
- `'warn'`: Log a warning and skip the encrypted file.

**Signature:**

```typescript
readonly onMissingKey: EncryptedFileErrorMode;
```
