[Home](../../README.md) > [CryptoUtils](../README.md) > [BrowserCryptoProvider](./BrowserCryptoProvider.md) > unwrapBytes

## BrowserCryptoProvider.unwrapBytes() method

Unwraps a payload produced by `wrapBytes` using the recipient's private
key. See CryptoUtils.ICryptoProvider.unwrapBytes | ICryptoProvider.unwrapBytes.

**Signature:**

```typescript
unwrapBytes(wrapped: IWrappedBytes, recipientPrivateKey: CryptoKey, options: IWrapBytesOptions): Promise<Result<Uint8Array<ArrayBufferLike>>>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>wrapped</td><td>IWrappedBytes</td><td>The wrapped payload.</td></tr>
<tr><td>recipientPrivateKey</td><td>CryptoKey</td><td>The recipient's ECDH P-256 private `CryptoKey`.</td></tr>
<tr><td>options</td><td>IWrapBytesOptions</td><td>HKDF salt and info matching the wrap call.</td></tr>
</tbody></table>

**Returns:**

Promise&lt;Result&lt;Uint8Array&lt;ArrayBufferLike&gt;&gt;&gt;

`Success` with the original `plaintext`, or `Failure` with an error.
