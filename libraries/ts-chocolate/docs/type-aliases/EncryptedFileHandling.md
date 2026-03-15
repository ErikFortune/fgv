[Home](../README.md) > EncryptedFileHandling

# Type Alias: EncryptedFileHandling

How to handle encrypted files in synchronous loading.
- `'fail'`: Fail the entire load operation (original behavior)
- `'skip'`: Silently skip encrypted files
- `'warn'`: Log warning and skip encrypted files
- `'capture'`: Capture encrypted files for later decryption (default)

## Type

```typescript
type EncryptedFileHandling = "fail" | "skip" | "warn" | "capture"
```
