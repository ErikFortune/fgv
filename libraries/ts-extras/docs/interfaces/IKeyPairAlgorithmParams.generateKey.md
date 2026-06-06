[Home](../README.md) > [IKeyPairAlgorithmParams](./IKeyPairAlgorithmParams.md) > generateKey

## IKeyPairAlgorithmParams.generateKey property

Algorithm parameters for `crypto.subtle.generateKey`. Always an asymmetric
variant — these algorithms produce a `CryptoKeyPair`, not a single key.
The literal `{ name: 'Ed25519' }` member covers WebCrypto's Secure-Curves
Ed25519 algorithm; `{ name: 'X25519' }` covers the X25519 key-agreement
algorithm. Both take only a `name`; using literals rather than the base
`Algorithm` keeps the union closed to the algorithms this table supports.

**Signature:**

```typescript
readonly generateKey: EcKeyGenParams | RsaHashedKeyGenParams | { name: "Ed25519" } | { name: "X25519" };
```
