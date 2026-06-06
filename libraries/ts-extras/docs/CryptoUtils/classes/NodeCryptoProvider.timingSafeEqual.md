[Home](../../README.md) > [CryptoUtils](../README.md) > [NodeCryptoProvider](./NodeCryptoProvider.md) > timingSafeEqual

## NodeCryptoProvider.timingSafeEqual() method

Compares two byte arrays in constant time using Node's native
`crypto.timingSafeEqual`. Returns `false` for mismatched lengths
rather than throwing (Node's native throws on length mismatch).

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
