[Home](../../../README.md) > [CryptoUtils](../../README.md) > [KeyStore](../README.md) > [IKeyStoreSymmetricEntry](./IKeyStoreSymmetricEntry.md) > key

## IKeyStoreSymmetricEntry.key property

The secret data.
- For `'encryption-key'`: 32-byte AES-256 key.
- For `'api-key'`: UTF-8 encoded API key string (arbitrary length).

**Signature:**

```typescript
readonly key: Uint8Array;
```
