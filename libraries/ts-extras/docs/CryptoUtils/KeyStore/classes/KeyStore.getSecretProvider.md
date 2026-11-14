[Home](../../../README.md) > [CryptoUtils](../../README.md) > [KeyStore](../README.md) > [KeyStore](./KeyStore.md) > getSecretProvider

## KeyStore.getSecretProvider() method

Creates a SecretProvider function for use with IEncryptionConfig.
The returned function looks up secrets from this key store.

**Signature:**

```typescript
getSecretProvider(): Result<SecretProvider>;
```

**Returns:**

Result&lt;[SecretProvider](../../../type-aliases/SecretProvider.md)&gt;

Success with SecretProvider, Failure if locked
