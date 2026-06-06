[Home](../../README.md) > [CryptoUtils](../README.md) > importPublicKeyFromMultibaseSpki

# Function: importPublicKeyFromMultibaseSpki

Imports a public key from a multibase base64url-encoded SPKI blob.

Decodes the multibase prefix, decodes the base64url body, then uses
the provider to import the key with the algorithm parameters from
CryptoUtils.keyPairAlgorithmParams.

## Signature

```typescript
function importPublicKeyFromMultibaseSpki(encoded: string, algorithm: KeyPairAlgorithm, provider: ICryptoProvider): Promise<Result<CryptoKey>>
```
