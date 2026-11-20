[Home](../../README.md) > [CryptoUtils](../README.md) > isValidMultibaseSpkiPublicKey

# Function: isValidMultibaseSpkiPublicKey

Type guard for CryptoUtils.MultibaseSpkiPublicKey: a string matching
CryptoUtils.MultibaseSpkiPublicKeyRegExp (multibase `'m'` prefix + a
non-empty base64url-no-pad body) whose body also satisfies the base64url-no-pad
length rule shared with CryptoUtils.base64UrlNoPadDecode. This is a
structural *shape* check, not full validation — it does not decode the DER SPKI
or verify the key material/algorithm (a malformed-but-well-shaped string fails
later, with clear context, in CryptoUtils.importPublicKeyFromMultibaseSpki).

## Signature

```typescript
function isValidMultibaseSpkiPublicKey(value: unknown): value is MultibaseSpkiPublicKey
```
