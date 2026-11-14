[Home](../README.md) > [IKeyStoreAsymmetricEntryJson](./IKeyStoreAsymmetricEntryJson.md) > escrowedPrivateKeyJwk

## IKeyStoreAsymmetricEntryJson.escrowedPrivateKeyJwk property

Optional escrowed copy of the private key, as a JSON Web Key. Present only
on `'keystore-v2'` vaults whose entry was created with escrow enabled. A
v1 vault omits the field; a v2 reader treats its absence as "no escrow".

**Signature:**

```typescript
readonly escrowedPrivateKeyJwk: JsonWebKey;
```
