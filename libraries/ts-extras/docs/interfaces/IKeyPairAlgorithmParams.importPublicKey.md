[Home](../README.md) > [IKeyPairAlgorithmParams](./IKeyPairAlgorithmParams.md) > importPublicKey

## IKeyPairAlgorithmParams.importPublicKey property

Algorithm parameters for `crypto.subtle.importKey('jwk', ...)` when
importing the public half of a keypair.

**Signature:**

```typescript
readonly importPublicKey: EcKeyImportParams | RsaHashedImportParams;
```
