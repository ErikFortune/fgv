[Home](../../README.md) > [KeyStore](../README.md) > [IEncryptedFilePrivateKeyStorageCreateParams](./IEncryptedFilePrivateKeyStorageCreateParams.md) > encryptionKey

## IEncryptedFilePrivateKeyStorageCreateParams.encryptionKey property

Raw AES-256-GCM key (32 bytes) used to encrypt each file's JWK content.
Consumer-supplied and decoupled from the keystore's password lifecycle —
derive it however the application sees fit (typically the same
password-derived key material the keystore vault uses).

**Signature:**

```typescript
readonly encryptionKey: Uint8Array;
```
