[Home](../README.md) > importPublicKeyFromMultibaseSpki

# Function: importPublicKeyFromMultibaseSpki

Imports a public key from a multibase base64url-encoded SPKI blob.

Decodes the multibase prefix, decodes the base64url body, then uses
the provider to import the key with the algorithm parameters from
CryptoUtils.keyPairAlgorithmParams.

Accepts a plain `string` (not only a branded CryptoUtils.MultibaseSpkiPublicKey),
so callers holding an unbranded value read from storage or the wire can import
it directly; a malformed value fails with error context rather than throwing.

## Signature

```typescript
function importPublicKeyFromMultibaseSpki(encoded: string, algorithm: KeyPairAlgorithm, provider: ICryptoProvider): Promise<Result<CryptoKey>>
```
