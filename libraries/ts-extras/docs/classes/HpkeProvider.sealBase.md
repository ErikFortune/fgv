[Home](../README.md) > [HpkeProvider](./HpkeProvider.md) > sealBase

## HpkeProvider.sealBase() method

HPKE base-mode seal (sender side). RFC 9180 §6.1.

Generates a fresh ephemeral X25519 keypair, runs DHKEM Encap to produce a
shared secret and `enc` (32-byte raw ephemeral public key), derives the AEAD
key and nonce deterministically via the RFC 9180 key schedule, then encrypts
`plaintext` with AES-256-GCM.

**Signature:**

```typescript
sealBase(recipientPublicKey: CryptoKey, info: Uint8Array, aad: Uint8Array, plaintext: Uint8Array): Promise<Result<IHpkeSealResult>>;
```

**Parameters:**

<table><thead><tr><th>Parameter</th><th>Type</th><th>Description</th></tr></thead>
<tbody>
<tr><td>recipientPublicKey</td><td>CryptoKey</td><td>Recipient's X25519 public `CryptoKey`
  (`algorithm.name === 'X25519'`, `type === 'public'`, **`extractable: true`**).
  Must be extractable — DHKEM Encap calls `exportKey('raw', ...)` on this key to
  build the KEM shared-secret context. Keys imported with `extractable: false` will
  cause this method to return a `Failure`.</td></tr>
<tr><td>info</td><td>Uint8Array</td><td>Context-binding bytes. **Load-bearing — no default.**
  Binds this ciphertext to a specific application context, preventing replay
  across different contexts sharing the same recipient keypair.
  Use `new TextEncoder().encode('myapp/v1/use-case\x00' + contextId)` pattern.
  Never pass an empty array in production: empty `info` provides no context binding.</td></tr>
<tr><td>aad</td><td>Uint8Array</td><td>Additional authenticated data. Integrity-protected but not encrypted.
  `new Uint8Array(0)` is valid when no AAD is needed.</td></tr>
<tr><td>plaintext</td><td>Uint8Array</td><td>Bytes to encrypt. `new Uint8Array(0)` is valid.</td></tr>
</tbody></table>

**Returns:**

Promise&lt;Result&lt;[IHpkeSealResult](../interfaces/IHpkeSealResult.md)&gt;&gt;

`Success` with `{ enc, ciphertext }`, or `Failure` with error context.
