[Home](../../README.md) > [Editing](../README.md) > [IPersistedEditableCollectionParams](./IPersistedEditableCollectionParams.md) > encryptionProvider

## IPersistedEditableCollectionParams.encryptionProvider property

Optional encryption provider (or lazy getter) for encrypted collections.
Use a getter function when the provider is not available at construction
time (e.g. a KeyStore that is unlocked after app startup).

**Signature:**

```typescript
readonly encryptionProvider: IEncryptionProvider | (() => IEncryptionProvider | undefined);
```
