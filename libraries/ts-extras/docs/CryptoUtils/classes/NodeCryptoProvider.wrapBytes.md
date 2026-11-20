[Home](../../README.md) > [CryptoUtils](../README.md) > [NodeCryptoProvider](./NodeCryptoProvider.md) > wrapBytes

## NodeCryptoProvider.wrapBytes() method

Wraps `plaintext` for the holder of `recipientPublicKey` using
ECIES (ECDH P-256 + HKDF-SHA256 + AES-GCM-256). See
CryptoUtils.ICryptoProvider.wrapBytes | ICryptoProvider.wrapBytes.

**Signature:**

```typescript
wrapBytes(plaintext: Uint8Array, recipientPublicKey: CryptoKey, options: IWrapBytesOptions): Promise<Result<IWrappedBytes>>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>plaintext</td><td>Uint8Array</td><td>The bytes to wrap.</td></tr>
<tr><td>recipientPublicKey</td><td>CryptoKey</td><td>The recipient's ECDH P-256 public `CryptoKey`.</td></tr>
<tr><td>options</td><td>IWrapBytesOptions</td><td>HKDF salt and info; see CryptoUtils.IWrapBytesOptions | IWrapBytesOptions.</td></tr>
</tbody></table>

**Returns:**

Promise&lt;Result&lt;[IWrappedBytes](../../interfaces/IWrappedBytes.md)&gt;&gt;

`Success` with the wrapped payload, or `Failure` with an error.
