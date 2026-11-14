[Home](../README.md) > [HpkeProvider](./HpkeProvider.md) > encodeEnvelope

## HpkeProvider.encodeEnvelope() method

Encodes an IHpkeSealResult as a single contiguous byte array for wire transport.

Format: `enc` (32 bytes, fixed) || `ciphertext` (variable length).
The 32-byte `enc` length is fixed for X25519; the split point is unambiguous.

**Signature:**

```typescript
static encodeEnvelope(result: IHpkeSealResult): Uint8Array;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>result</td><td>IHpkeSealResult</td><td>The output of HpkeProvider.sealBase.</td></tr>
</tbody></table>

**Returns:**

Uint8Array

Concatenated bytes: `enc || ciphertext`.
