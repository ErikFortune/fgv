[Home](../README.md) > createEncryptedFileConverter

# Function: createEncryptedFileConverter

Creates a converter for CryptoUtils.IEncryptedFile | encrypted files with optional typed metadata.

## Signature

```typescript
function createEncryptedFileConverter(metadataConverter: Converter<TMetadata, unknown>): Converter<IEncryptedFile<TMetadata>>
```
