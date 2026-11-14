[Home](../README.md) > base64UrlNoPadEncode

# Function: base64UrlNoPadEncode

Encodes a `Uint8Array` as a base64url (no-padding) string (RFC 4648 §5).

The body uses the base64url alphabet (`+` → `-`, `/` → `_`) and trailing `=`
padding is stripped. This is the bare primitive with no multibase prefix; use
CryptoUtils.multibaseBase64UrlEncode when a multibase-`'m'`-prefixed value is required.

## Signature

```typescript
function base64UrlNoPadEncode(data: Uint8Array): string
```
