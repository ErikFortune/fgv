[Home](../../README.md) > [CryptoUtils](../README.md) > [KeyStore](./KeyStore.md) > getEncryptionConfig

## KeyStore.getEncryptionConfig() method

Creates a partial IEncryptionConfig using this key store as the secret source.

**Signature:**

```typescript
getEncryptionConfig(): Result<Pick<IEncryptionConfig, "cryptoProvider" | "secretProvider">>;
```

**Returns:**

Result&lt;Pick&lt;[IEncryptionConfig](../../interfaces/IEncryptionConfig.md), "cryptoProvider" | "secretProvider"&gt;&gt;

Partial config that can be spread into a full IEncryptionConfig
