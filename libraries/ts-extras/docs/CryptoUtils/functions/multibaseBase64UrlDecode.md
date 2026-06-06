[Home](../../README.md) > [CryptoUtils](../README.md) > multibaseBase64UrlDecode

# Function: multibaseBase64UrlDecode

Decodes a multibase base64url (no-padding) string back to a `Uint8Array`.

Validates that the first character is `'m'` (the multibase prefix for
RFC 4648 base64url without padding), then decodes the remaining body.

## Signature

```typescript
function multibaseBase64UrlDecode(encoded: string): Result<Uint8Array<ArrayBufferLike>>
```
