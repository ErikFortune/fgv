[Home](../../README.md) > [CryptoUtils](../README.md) > base64UrlNoPadDecode

# Function: base64UrlNoPadDecode

Decodes a base64url (no-padding) string (RFC 4648 §5) back to a `Uint8Array`.

This is the bare primitive with no multibase prefix; use
CryptoUtils.multibaseBase64UrlDecode to decode a multibase-`'m'`-prefixed value.

## Signature

```typescript
function base64UrlNoPadDecode(encoded: string): Result<Uint8Array<ArrayBufferLike>>
```
