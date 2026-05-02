[Home](../../README.md) > [CryptoUtils](../README.md) > [IKeyPairAlgorithmParams](./IKeyPairAlgorithmParams.md) > importPublicKey

## IKeyPairAlgorithmParams.importPublicKey property

Algorithm parameters for `crypto.subtle.importKey('jwk', ...)` when
importing the public half of a keypair. The literal `{ name: 'Ed25519' }`
member covers Ed25519 imports, which take only a `name`; using a literal
rather than the base `Algorithm` keeps the union closed to the algorithms
this table supports.

**Signature:**

```typescript
readonly importPublicKey: EcKeyImportParams | RsaHashedImportParams | { name: "Ed25519" };
```
