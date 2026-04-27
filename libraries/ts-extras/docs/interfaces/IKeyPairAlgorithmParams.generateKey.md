[Home](../README.md) > [IKeyPairAlgorithmParams](./IKeyPairAlgorithmParams.md) > generateKey

## IKeyPairAlgorithmParams.generateKey property

Algorithm parameters for `crypto.subtle.generateKey`. Always an asymmetric
variant — these algorithms produce a `CryptoKeyPair`, not a single key.

**Signature:**

```typescript
readonly generateKey: EcKeyGenParams | RsaHashedKeyGenParams;
```
