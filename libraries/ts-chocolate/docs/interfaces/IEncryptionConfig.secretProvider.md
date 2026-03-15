[Home](../README.md) > [IEncryptionConfig](./IEncryptionConfig.md) > secretProvider

## IEncryptionConfig.secretProvider property

Optional function to dynamically provide keys by secret name.
Called when a secret is not found in the `secrets` array.

**Signature:**

```typescript
readonly secretProvider: SecretProvider;
```
