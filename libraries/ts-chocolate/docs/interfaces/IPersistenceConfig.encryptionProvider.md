[Home](../README.md) > [IPersistenceConfig](./IPersistenceConfig.md) > encryptionProvider

## IPersistenceConfig.encryptionProvider property

Encryption provider (or lazy getter) for encrypted collections.
Use a getter function when the provider is not yet available at
configuration time (e.g. a KeyStore that is unlocked after startup).

**Signature:**

```typescript
readonly encryptionProvider: IEncryptionProvider | (() => IEncryptionProvider | undefined);
```
