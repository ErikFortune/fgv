[Home](../README.md) > hexEncode

# Function: hexEncode

Encodes a `Uint8Array` as a lowercase hexadecimal string with no `0x` prefix.

Each byte becomes exactly two lowercase hex characters (zero-padded), so an
`n`-byte input yields a `2n`-character string. An empty input yields the empty
string. This is the inverse of CryptoUtils.hexDecode.

## Signature

```typescript
function hexEncode(data: Uint8Array): string
```
