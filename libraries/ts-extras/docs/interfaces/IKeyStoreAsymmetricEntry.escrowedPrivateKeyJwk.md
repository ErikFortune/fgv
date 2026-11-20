[Home](../README.md) > [IKeyStoreAsymmetricEntry](./IKeyStoreAsymmetricEntry.md) > escrowedPrivateKeyJwk

## IKeyStoreAsymmetricEntry.escrowedPrivateKeyJwk property

Optional escrowed copy of the private key, as a JSON Web Key. Present only
when the entry was created with `addKeyPair(name, { escrow: true })`.

This is an opt-in cross-device recovery affordance: the private key is
carried inside the vault's AES-GCM ciphertext (same custody class as
`publicKeyJwk`), so a recovered vault plus the master password can
reconstitute the signing/decryption identity on a fresh device via
`getKeyPair(name, { rehydrate: true })`.

SECURITY: when present, the master password becomes the sole gate
protecting this private key. Use a strong KDF for escrow-bearing stores.
See the CryptoUtils.KeyStore.KeyStore class docs.

**Signature:**

```typescript
readonly escrowedPrivateKeyJwk: JsonWebKey;
```
