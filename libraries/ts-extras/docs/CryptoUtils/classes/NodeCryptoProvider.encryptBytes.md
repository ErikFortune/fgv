[Home](../../README.md) > [CryptoUtils](../README.md) > [NodeCryptoProvider](./NodeCryptoProvider.md) > encryptBytes

## NodeCryptoProvider.encryptBytes() method

Encrypts raw bytes using AES-256-GCM with a caller-supplied nonce and
optional AAD. See CryptoUtils.ICryptoProvider.encryptBytes | ICryptoProvider.encryptBytes
— in particular the caller's responsibility to use a unique `nonce` per
message under a given `key`.

**Signature:**

```typescript
encryptBytes(key: Uint8Array, nonce: Uint8Array, plaintext: Uint8Array, aad?: Uint8Array<ArrayBufferLike>): Promise<Result<IEncryptBytesResult>>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>key</td><td>Uint8Array</td><td>32-byte AES-256 key.</td></tr>
<tr><td>nonce</td><td>Uint8Array</td><td>12-byte GCM nonce (must be unique per message under `key`).</td></tr>
<tr><td>plaintext</td><td>Uint8Array</td><td>The bytes to encrypt (empty permitted).</td></tr>
<tr><td>aad</td><td>Uint8Array&lt;ArrayBufferLike&gt;</td><td>Optional additional authenticated data bound into the tag.</td></tr>
</tbody></table>

**Returns:**

Promise&lt;Result&lt;[IEncryptBytesResult](../../interfaces/IEncryptBytesResult.md)&gt;&gt;

`Success` with the ciphertext and 16-byte auth tag, or `Failure` with an error.
