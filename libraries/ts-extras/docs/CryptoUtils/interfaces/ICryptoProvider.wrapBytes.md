[Home](../../README.md) > [CryptoUtils](../README.md) > [ICryptoProvider](./ICryptoProvider.md) > wrapBytes

## ICryptoProvider.wrapBytes() method

Wraps `plaintext` for delivery to the holder of the private key paired
with `recipientPublicKey`. Uses ECIES with ECDH P-256, HKDF-SHA256, and
AES-GCM-256.

Generates a fresh ephemeral keypair per call; the ephemeral private key
is discarded after the shared-secret derive. Only the recipient (with the
matching private key) and the same HKDF parameters can recover
`plaintext`.

Empty `plaintext` is permitted; the resulting wrap contains only the
16-byte GCM authentication tag and round-trips back to an empty
`Uint8Array`.

**Signature:**

```typescript
wrapBytes(plaintext: Uint8Array, recipientPublicKey: CryptoKey, options: IWrapBytesOptions): Promise<Result<IWrappedBytes>>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>plaintext</td><td>Uint8Array</td><td>The bytes to wrap. Any length supported by AES-GCM
(in practice, well below 2^39 - 256 bits).</td></tr>
<tr><td>recipientPublicKey</td><td>CryptoKey</td><td>The recipient's ECDH P-256 public `CryptoKey`.
Must have algorithm name `'ECDH'` and named curve `'P-256'`; mismatched
algorithm or curve yields a `Failure` with error context.</td></tr>
<tr><td>options</td><td>IWrapBytesOptions</td><td>HKDF parameters; see CryptoUtils.IWrapBytesOptions | IWrapBytesOptions.</td></tr>
</tbody></table>

**Returns:**

Promise&lt;Result&lt;[IWrappedBytes](../../interfaces/IWrappedBytes.md)&gt;&gt;

`Success` with the wrapped payload, or `Failure` with error context.
