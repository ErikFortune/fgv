[Home](../README.md) > [ICryptoProvider](./ICryptoProvider.md) > encryptBytes

## ICryptoProvider.encryptBytes() method

Encrypts raw bytes using AES-256-GCM with a **caller-supplied nonce** and
optional additional authenticated data (AAD).

This is the raw-byte sibling of CryptoUtils.ICryptoProvider.encrypt | encrypt.
Unlike `encrypt`, it takes and returns `Uint8Array` (no UTF-8 coding), the
caller owns the nonce (rather than the provider generating one), and it
binds optional `aad` into the GCM authentication. Use it when you need to
bind context (e.g. an actor id, key version, or row kind) into the
authentication so a wrapped secret cannot be replayed across
users/versions/kinds, or when you manage nonces yourself.

**Signature:**

```typescript
encryptBytes(key: Uint8Array, nonce: Uint8Array, plaintext: Uint8Array, aad?: Uint8Array<ArrayBufferLike>): Promise<Result<IEncryptBytesResult>>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>key</td><td>Uint8Array</td><td>32-byte AES-256 key. Wrong lengths fail with error context.</td></tr>
<tr><td>nonce</td><td>Uint8Array</td><td>12-byte (96-bit) GCM nonce. MUST be unique per message under
`key` (see the nonce-uniqueness warning above). Wrong lengths fail with
error context.</td></tr>
<tr><td>plaintext</td><td>Uint8Array</td><td>The bytes to encrypt. Empty plaintext is permitted and
round-trips (GCM produces a valid tag over zero-length plaintext).</td></tr>
<tr><td>aad</td><td>Uint8Array&lt;ArrayBufferLike&gt;</td><td>Optional additional authenticated data bound into the GCM tag
but NOT encrypted. If provided at encrypt time, the identical bytes must be
supplied to `decryptBytes` or decryption fails authentication. Absent means
no AAD.</td></tr>
</tbody></table>

**Returns:**

Promise&lt;Result&lt;[IEncryptBytesResult](IEncryptBytesResult.md)&gt;&gt;

`Success` with the CryptoUtils.IEncryptBytesResult | ciphertext and 16-byte auth tag,
or `Failure` with error context.
