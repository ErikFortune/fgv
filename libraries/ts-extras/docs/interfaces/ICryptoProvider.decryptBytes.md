[Home](../README.md) > [ICryptoProvider](./ICryptoProvider.md) > decryptBytes

## ICryptoProvider.decryptBytes() method

Decrypts raw bytes produced by
CryptoUtils.ICryptoProvider.encryptBytes | encryptBytes using
AES-256-GCM. The inverse of `encryptBytes`: the `ciphertext` and `authTag`
from an `encryptBytes` result, together with the same `key`, `nonce`, and
`aad`, recover the original plaintext.

Fails (never throws) on any authentication failure: a tampered ciphertext
or tag, the wrong key or nonce, or an `aad` that differs from the one used
at encrypt time. AES-GCM authentication is fail-closed — a mismatched `aad`
fails exactly as a tampered ciphertext does.

**Signature:**

```typescript
decryptBytes(key: Uint8Array, nonce: Uint8Array, ciphertext: Uint8Array, authTag: Uint8Array, aad?: Uint8Array<ArrayBufferLike>): Promise<Result<Uint8Array<ArrayBufferLike>>>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>key</td><td>Uint8Array</td><td>32-byte AES-256 key (the same key used to encrypt).</td></tr>
<tr><td>nonce</td><td>Uint8Array</td><td>12-byte (96-bit) GCM nonce (the same nonce used to encrypt).</td></tr>
<tr><td>ciphertext</td><td>Uint8Array</td><td>The ciphertext from the `encryptBytes` result.</td></tr>
<tr><td>authTag</td><td>Uint8Array</td><td>The 16-byte (128-bit) GCM authentication tag from the
`encryptBytes` result.</td></tr>
<tr><td>aad</td><td>Uint8Array&lt;ArrayBufferLike&gt;</td><td>The identical additional authenticated data supplied at encrypt
time (or absent if none was supplied). A mismatch fails authentication.</td></tr>
</tbody></table>

**Returns:**

Promise&lt;Result&lt;Uint8Array&lt;ArrayBufferLike&gt;&gt;&gt;

`Success` with the decrypted plaintext bytes, or `Failure` with
error context (including all authentication failures).
