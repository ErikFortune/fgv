[Home](../../README.md) > [CryptoUtils](../README.md) > [HpkeProvider](./HpkeProvider.md) > decodeEnvelope

## HpkeProvider.decodeEnvelope() method

Decodes an envelope produced by HpkeProvider.encodeEnvelope.

Validates that the buffer is at least 48 bytes (32-byte enc + 16-byte minimum
ciphertext containing the AES-GCM auth tag; zero-length plaintext is the minimum
meaningful case).

**Signature:**

```typescript
static decodeEnvelope(envelope: Uint8Array): Result<IHpkeSealResult>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>envelope</td><td>Uint8Array</td><td>Envelope bytes from `encodeEnvelope`.</td></tr>
</tbody></table>

**Returns:**

Result&lt;[IHpkeSealResult](../../interfaces/IHpkeSealResult.md)&gt;

`Success` with `{ enc, ciphertext }`, or `Failure` if malformed.
