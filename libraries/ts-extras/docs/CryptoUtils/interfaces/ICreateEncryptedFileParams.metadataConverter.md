[Home](../../README.md) > [CryptoUtils](../README.md) > [ICreateEncryptedFileParams](./ICreateEncryptedFileParams.md) > metadataConverter

## ICreateEncryptedFileParams.metadataConverter property

Optional converter to validate metadata before including.
If provided, metadata will be validated before encryption.

**Signature:**

```typescript
readonly metadataConverter: Converter<TMetadata, unknown>;
```
