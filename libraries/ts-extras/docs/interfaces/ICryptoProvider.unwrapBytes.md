[Home](../README.md) > [ICryptoProvider](./ICryptoProvider.md) > unwrapBytes

## ICryptoProvider.unwrapBytes() method

Inverse of CryptoUtils.ICryptoProvider.wrapBytes | wrapBytes.
Recovers the original `plaintext` from a wrapped payload using the
recipient's private key.

Returns a `Failure` (never throws) on any of:
- Tampered nonce or ciphertext (AES-GCM authentication fails)
- Wrong private key (different shared secret derives a different wrap key)
- Wrong HKDF parameters (different wrap key)
- Malformed `ephemeralPublicKey` JWK
- Malformed base64 in `nonce` or `ciphertext`

**Signature:**

```typescript
unwrapBytes(wrapped: IWrappedBytes, recipientPrivateKey: CryptoKey, options: IWrapBytesOptions): Promise<Result<Uint8Array<ArrayBufferLike>>>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>wrapped</td><td>IWrappedBytes</td><td>The wrapped payload produced by `wrapBytes`.</td></tr>
<tr><td>recipientPrivateKey</td><td>CryptoKey</td><td>The recipient's ECDH P-256 private
`CryptoKey`. Must have algorithm name `'ECDH'` and named curve `'P-256'`,
and key usages including `'deriveKey'` or `'deriveBits'`.</td></tr>
<tr><td>options</td><td>IWrapBytesOptions</td><td>The same HKDF parameters used at wrap time.</td></tr>
</tbody></table>

**Returns:**

Promise&lt;Result&lt;Uint8Array&lt;ArrayBufferLike&gt;&gt;&gt;

`Success` with the original `plaintext`, or `Failure` with error context.
