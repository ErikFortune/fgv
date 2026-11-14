[Home](../../README.md) > [CryptoUtils](../README.md) > [ICryptoProvider](./ICryptoProvider.md) > timingSafeEqual

## ICryptoProvider.timingSafeEqual() method

Compares two byte arrays in constant time.

The comparison visits all bytes of `a` and `b` regardless of where they
diverge, accumulating XOR differences with bitwise-OR. No early-return is
possible once the length check passes, making timing independent of the
byte values. This prevents timing side-channels when comparing MAC outputs,
signed-token bytes, or any secret-derived byte sequences.

Returns `false` immediately (before the loop) when `a.length !== b.length`;
the length mismatch itself is not secret in normal use.

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

`true` if the arrays have the same length and identical contents,
`false` otherwise.
