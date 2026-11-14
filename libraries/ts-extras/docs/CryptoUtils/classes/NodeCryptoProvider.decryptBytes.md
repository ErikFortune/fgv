[Home](../../README.md) > [CryptoUtils](../README.md) > [NodeCryptoProvider](./NodeCryptoProvider.md) > decryptBytes

## NodeCryptoProvider.decryptBytes() method

Decrypts raw bytes produced by NodeCryptoProvider.encryptBytes using
AES-256-GCM. See CryptoUtils.ICryptoProvider.decryptBytes | ICryptoProvider.decryptBytes.
Fails (never throws) on any authentication failure, including a mismatched `aad`.

**Signature:**

```typescript
decryptBytes(key: Uint8Array, nonce: Uint8Array, ciphertext: Uint8Array, authTag: Uint8Array, aad?: Uint8Array<ArrayBufferLike>): Promise<Result<Uint8Array<ArrayBufferLike>>>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>key</td><td>Uint8Array</td><td>32-byte AES-256 key.</td></tr>
<tr><td>nonce</td><td>Uint8Array</td><td>12-byte GCM nonce (the same one used to encrypt).</td></tr>
<tr><td>ciphertext</td><td>Uint8Array</td><td>The ciphertext from the `encryptBytes` result.</td></tr>
<tr><td>authTag</td><td>Uint8Array</td><td>The 16-byte GCM auth tag from the `encryptBytes` result.</td></tr>
<tr><td>aad</td><td>Uint8Array&lt;ArrayBufferLike&gt;</td><td>The identical AAD supplied at encrypt time (or absent).</td></tr>
</tbody></table>

**Returns:**

Promise&lt;Result&lt;Uint8Array&lt;ArrayBufferLike&gt;&gt;&gt;

`Success` with the decrypted plaintext bytes, or `Failure` with an error.
