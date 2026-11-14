[Home](../../README.md) > [CryptoUtils](../README.md) > [BrowserCryptoProvider](./BrowserCryptoProvider.md) > timingSafeEqual

## BrowserCryptoProvider.timingSafeEqual() method

Compares two byte arrays in constant time.

Accumulates XOR differences with bitwise-OR; no early-return is possible
once the length check passes, making timing independent of the byte
values. Returns `false` immediately on length mismatch (length is not
secret in normal use).

**Signature:**

```typescript
timingSafeEqual(a: Uint8Array, b: Uint8Array): boolean;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>a</td><td>Uint8Array</td><td>First byte array.</td></tr>
<tr><td>b</td><td>Uint8Array</td><td>Second byte array.</td></tr>
</tbody></table>

**Returns:**

boolean

`true` if lengths match and all bytes are equal, `false` otherwise.
