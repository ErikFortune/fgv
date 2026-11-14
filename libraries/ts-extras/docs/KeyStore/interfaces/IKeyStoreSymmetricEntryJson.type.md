[Home](../../README.md) > [KeyStore](../README.md) > [IKeyStoreSymmetricEntryJson](./IKeyStoreSymmetricEntryJson.md) > type

## IKeyStoreSymmetricEntryJson.type property

Symmetric secret type discriminator.

Required on this normalized model type. Vaults written prior to the
asymmetric-keypair support may omit this field on the wire; the
converter injects `'encryption-key'` when missing for backwards
compatibility, so by the time a value of this type is observed the
discriminator is always present.

**Signature:**

```typescript
readonly type: KeyStoreSymmetricSecretType;
```
