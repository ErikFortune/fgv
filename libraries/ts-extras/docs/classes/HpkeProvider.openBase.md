[Home](../README.md) > [HpkeProvider](./HpkeProvider.md) > openBase

## HpkeProvider.openBase() method

HPKE base-mode open (recipient side). RFC 9180 §6.1.

Decapsulates `enc` using the recipient's X25519 private key, derives the same
AEAD key and nonce from the shared secret and `info`, then authenticates and
decrypts `ciphertext` with AES-256-GCM.

Returns `Failure` on any of:
- Wrong private key (different DH output → different key derivation)
- Wrong `info` (different key schedule context → different AEAD key)
- Wrong `aad` (AES-GCM authentication fails)
- Tampered `ciphertext` or `enc` (authentication fails or DH fails)
- `enc` not exactly 32 bytes
- `ciphertext` shorter than 16 bytes (no room for authentication tag)

**Signature:**

```typescript
openBase(recipientPrivateKey: CryptoKey, info: Uint8Array, aad: Uint8Array, enc: Uint8Array, ciphertext: Uint8Array): Promise<Result<Uint8Array<ArrayBufferLike>>>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>recipientPrivateKey</td><td>CryptoKey</td><td>Recipient's X25519 private `CryptoKey`
  (`algorithm.name === 'X25519'`, `type === 'private'`, `usages` includes `'deriveBits'`).
  **Must be extractable** (`extractable: true`) — the recipient's public key bytes
  are recovered from the JWK `x` field during Decap.</td></tr>
<tr><td>info</td><td>Uint8Array</td><td>Context-binding bytes. Must exactly match `info` from `sealBase`.</td></tr>
<tr><td>aad</td><td>Uint8Array</td><td>Must exactly match `aad` from `sealBase`.</td></tr>
<tr><td>enc</td><td>Uint8Array</td><td>The encapsulated key from `sealBase` — exactly 32 bytes.</td></tr>
<tr><td>ciphertext</td><td>Uint8Array</td><td>The ciphertext from `sealBase` — `plaintext.length + 16` bytes.</td></tr>
</tbody></table>

**Returns:**

Promise&lt;Result&lt;Uint8Array&lt;ArrayBufferLike&gt;&gt;&gt;

`Success` with decrypted plaintext bytes, or `Failure` with error context.
