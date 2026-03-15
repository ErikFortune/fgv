[Home](../README.md) > [IEditableCollectionParams](./IEditableCollectionParams.md) > encryptionProvider

## IEditableCollectionParams.encryptionProvider property

Optional encryption provider for encrypted save support.
When present and the collection's metadata includes a `secretName`,
EditableCollection.save will encrypt the collection before writing.

Accepts any CryptoUtils.IEncryptionProvider: a `KeyStore`,
a `DirectEncryptionProvider`, or a custom implementation.

**Signature:**

```typescript
readonly encryptionProvider: IEncryptionProvider;
```
