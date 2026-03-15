[Home](../../README.md) > [LibraryData](../README.md) > [IEncryptionConfig](./IEncryptionConfig.md) > onDecryptionError

## IEncryptionConfig.onDecryptionError property

How to handle decryption errors (e.g., wrong key, corrupted data).
- `'fail'` (default): Fail the entire load operation.
- `'skip'`: Skip the file and continue loading other files.
- `'warn'`: Log a warning and skip the file.

**Signature:**

```typescript
readonly onDecryptionError: EncryptedFileErrorMode;
```
