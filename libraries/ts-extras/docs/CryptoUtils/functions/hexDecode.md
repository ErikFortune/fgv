[Home](../../README.md) > [CryptoUtils](../README.md) > hexDecode

# Function: hexDecode

Decodes a hexadecimal string (no `0x` prefix) back to a `Uint8Array`.

Liberal in what it accepts: both lowercase and uppercase hex digits are
allowed (whereas CryptoUtils.hexEncode always emits lowercase). The
input must have even length and contain only hex digits (`0-9`, `a-f`, `A-F`);
an empty string decodes to an empty `Uint8Array`. Odd length or any non-hex
character fails with error context.

## Signature

```typescript
function hexDecode(encoded: string): Result<Uint8Array<ArrayBufferLike>>
```
