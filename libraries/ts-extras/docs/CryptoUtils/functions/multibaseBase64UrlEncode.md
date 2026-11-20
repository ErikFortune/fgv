[Home](../../README.md) > [CryptoUtils](../README.md) > multibaseBase64UrlEncode

# Function: multibaseBase64UrlEncode

Encodes a `Uint8Array` as a multibase base64url (no-padding) string.

The multibase prefix `'m'` identifies the encoding as RFC 4648 base64url
without padding. The body uses base64url alphabet: `+` → `-`, `/` → `_`,
and trailing `=` padding is stripped.

## Signature

```typescript
function multibaseBase64UrlEncode(data: Uint8Array): string
```
