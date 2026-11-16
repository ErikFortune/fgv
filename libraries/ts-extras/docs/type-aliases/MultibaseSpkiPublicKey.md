[Home](../README.md) > MultibaseSpkiPublicKey

# Type Alias: MultibaseSpkiPublicKey

A multibase base64url-encoded SPKI (SubjectPublicKeyInfo) public key string —
a `'m'` multibase prefix followed by a base64url-no-pad body. Produced by
CryptoUtils.exportPublicKeyAsMultibaseSpki and consumed by
CryptoUtils.importPublicKeyFromMultibaseSpki. Obtain the brand at a
boundary via CryptoUtils.isValidMultibaseSpkiPublicKey or the
CryptoUtils.Converters.multibaseSpkiPublicKey converter.

## Type

```typescript
type MultibaseSpkiPublicKey = Brand<string, "MultibaseSpkiPublicKey">
```
