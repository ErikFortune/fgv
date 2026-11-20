[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-extras-argon2](../../../README.md) / [CryptoUtils](../README.md) / HpkeProvider

# Class: HpkeProvider

HPKE base mode (RFC 9180) — `DHKEM(X25519, HKDF-SHA256) + HKDF-SHA256 + AES-256-GCM`.

Class-based provider that captures a `SubtleCrypto` instance at construction,
matching the existing `NodeCryptoProvider` / `BrowserCryptoProvider` / `KeyStore`
factory pattern used throughout `@fgv/ts-extras/crypto-utils`.

**Node.js usage:**
```typescript
import * as crypto from 'crypto';
const hpke = HpkeProvider.create(crypto.webcrypto.subtle).orThrow();
```

**Browser usage:**
```typescript
const hpke = HpkeProvider.create(globalThis.crypto.subtle).orThrow();
```

**Runtime requirements:** Node.js 20+ (X25519 in `crypto.webcrypto`);
Chrome 113+, Safari 16.4+, Firefox 118+ (X25519 added to Web Crypto in 2023).

## Methods

### hkdf()

> **hkdf**(`secret`, `salt`, `info`, `length`): `Promise`\<[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<`Uint8Array`\<`ArrayBufferLike`\>\>\>

HKDF-SHA256 key derivation (RFC 5869). Extract-then-Expand using SHA-256.

This is raw RFC 5869 HKDF — it does **not** use RFC 9180's labeled variants.
The HPKE key schedule internally uses labeled HKDF; this method is the unlabeled
version for callers that need standalone key derivation.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `secret` | `Uint8Array` | Input keying material (IKM). Any length. |
| `salt` | `Uint8Array` | Optional salt. Use `new Uint8Array(0)` if no salt is available (RFC 5869: 32 zero bytes are used internally when salt is empty). |
| `info` | `Uint8Array` | Context / application-binding bytes. Any length. |
| `length` | `number` | Number of output bytes to derive. Maximum 8160 bytes (255 × 32). |

#### Returns

`Promise`\<[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<`Uint8Array`\<`ArrayBufferLike`\>\>\>

`Success` with derived bytes, or `Failure` with error context.

***

### openBase()

> **openBase**(`recipientPrivateKey`, `info`, `aad`, `enc`, `ciphertext`, `recipientPublicKey?`): `Promise`\<[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<`Uint8Array`\<`ArrayBufferLike`\>\>\>

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

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `recipientPrivateKey` | `CryptoKey` | Recipient's X25519 private `CryptoKey` (`algorithm.name === 'X25519'`, `type === 'private'`, `usages` includes `'deriveBits'`). **Must be extractable** (`extractable: true`) only when `recipientPublicKey` is not supplied — the recipient's public key bytes are then recovered from the JWK `x` field during Decap. When `recipientPublicKey` is supplied, `recipientPrivateKey` may be non-extractable. |
| `info` | `Uint8Array` | Context-binding bytes. Must exactly match `info` from `sealBase`. |
| `aad` | `Uint8Array` | Must exactly match `aad` from `sealBase`. |
| `enc` | `Uint8Array` | The encapsulated key from `sealBase` — exactly 32 bytes. |
| `ciphertext` | `Uint8Array` | The ciphertext from `sealBase` — `plaintext.length + 16` bytes. |
| `recipientPublicKey?` | `Uint8Array`\<`ArrayBufferLike`\> | Optional raw 32-byte X25519 public key matching `recipientPrivateKey` (`pkRm` in RFC 9180 §4.1). Public material — supplying it lets Decap build `kem_context` without exporting `recipientPrivateKey` to JWK, so `recipientPrivateKey` no longer needs to be extractable. A mismatched value only breaks the caller's own decryption (AEAD authentication fails) — it cannot be used to attack another party's ciphertext. |

#### Returns

`Promise`\<[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<`Uint8Array`\<`ArrayBufferLike`\>\>\>

`Success` with decrypted plaintext bytes, or `Failure` with error context.

***

### sealBase()

> **sealBase**(`recipientPublicKey`, `info`, `aad`, `plaintext`): `Promise`\<[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<[`IHpkeSealResult`](../interfaces/IHpkeSealResult.md)\>\>

HPKE base-mode seal (sender side). RFC 9180 §6.1.

Generates a fresh ephemeral X25519 keypair, runs DHKEM Encap to produce a
shared secret and `enc` (32-byte raw ephemeral public key), derives the AEAD
key and nonce deterministically via the RFC 9180 key schedule, then encrypts
`plaintext` with AES-256-GCM.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `recipientPublicKey` | `CryptoKey` | Recipient's X25519 public `CryptoKey` (`algorithm.name === 'X25519'`, `type === 'public'`, **`extractable: true`**). Must be extractable — DHKEM Encap calls `exportKey('raw', ...)` on this key to build the KEM shared-secret context. Keys imported with `extractable: false` will cause this method to return a `Failure`. |
| `info` | `Uint8Array` | Context-binding bytes. **Load-bearing — no default.** Binds this ciphertext to a specific application context, preventing replay across different contexts sharing the same recipient keypair. Use `new TextEncoder().encode('myapp/v1/use-case\x00' + contextId)` pattern. Never pass an empty array in production: empty `info` provides no context binding. |
| `aad` | `Uint8Array` | Additional authenticated data. Integrity-protected but not encrypted. `new Uint8Array(0)` is valid when no AAD is needed. |
| `plaintext` | `Uint8Array` | Bytes to encrypt. `new Uint8Array(0)` is valid. |

#### Returns

`Promise`\<[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<[`IHpkeSealResult`](../interfaces/IHpkeSealResult.md)\>\>

`Success` with `{ enc, ciphertext }`, or `Failure` with error context.

***

### create()

> `static` **create**(`subtle`): [`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<`HpkeProvider`\>

Creates an `HpkeProvider` bound to the given `SubtleCrypto` instance.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `subtle` | `SubtleCrypto` | Web Crypto SubtleCrypto instance. Node.js: `(await import('crypto')).webcrypto.subtle`. Browser: `globalThis.crypto.subtle`. |

#### Returns

[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<`HpkeProvider`\>

`Success` with the provider, or `Failure` if construction fails.

***

### decodeEnvelope()

> `static` **decodeEnvelope**(`envelope`): [`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<[`IHpkeSealResult`](../interfaces/IHpkeSealResult.md)\>

Decodes an envelope produced by [HpkeProvider.encodeEnvelope](#encodeenvelope).

Validates that the buffer is at least 48 bytes (32-byte enc + 16-byte minimum
ciphertext containing the AES-GCM auth tag; zero-length plaintext is the minimum
meaningful case).

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `envelope` | `Uint8Array` | Envelope bytes from `encodeEnvelope`. |

#### Returns

[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<[`IHpkeSealResult`](../interfaces/IHpkeSealResult.md)\>

`Success` with `{ enc, ciphertext }`, or `Failure` if malformed.

***

### encodeEnvelope()

> `static` **encodeEnvelope**(`result`): `Uint8Array`

Encodes an [IHpkeSealResult](../interfaces/IHpkeSealResult.md) as a single contiguous byte array for wire transport.

Format: `enc` (32 bytes, fixed) || `ciphertext` (variable length).
The 32-byte `enc` length is fixed for X25519; the split point is unambiguous.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `result` | [`IHpkeSealResult`](../interfaces/IHpkeSealResult.md) | The output of [HpkeProvider.sealBase](#sealbase). |

#### Returns

`Uint8Array`

Concatenated bytes: `enc || ciphertext`.
