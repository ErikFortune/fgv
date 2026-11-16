[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-extras](../../../README.md) / [CryptoUtils](../README.md) / ICryptoProvider

# Interface: ICryptoProvider

Crypto provider interface for cross-platform encryption.
Implementations provided for Node.js (crypto module) and browser (Web Crypto API).

## Methods

### decrypt()

> **decrypt**(`encryptedData`, `key`, `iv`, `authTag`): `Promise`\<[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<`string`\>\>

Decrypts ciphertext using AES-256-GCM.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `encryptedData` | `Uint8Array` | Encrypted bytes |
| `key` | `Uint8Array` | 32-byte decryption key |
| `iv` | `Uint8Array` | Initialization vector (12 bytes) |
| `authTag` | `Uint8Array` | GCM authentication tag (16 bytes) |

#### Returns

`Promise`\<[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<`string`\>\>

Success with decrypted UTF-8 string, or Failure with error

***

### decryptBytes()

> **decryptBytes**(`key`, `nonce`, `ciphertext`, `authTag`, `aad?`): `Promise`\<[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<`Uint8Array`\<`ArrayBufferLike`\>\>\>

Decrypts raw bytes produced by
[encryptBytes](#encryptbytes) using
AES-256-GCM. The inverse of `encryptBytes`: the `ciphertext` and `authTag`
from an `encryptBytes` result, together with the same `key`, `nonce`, and
`aad`, recover the original plaintext.

Fails (never throws) on any authentication failure: a tampered ciphertext
or tag, the wrong key or nonce, or an `aad` that differs from the one used
at encrypt time. AES-GCM authentication is fail-closed — a mismatched `aad`
fails exactly as a tampered ciphertext does.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `key` | `Uint8Array` | 32-byte AES-256 key (the same key used to encrypt). |
| `nonce` | `Uint8Array` | 12-byte (96-bit) GCM nonce (the same nonce used to encrypt). |
| `ciphertext` | `Uint8Array` | The ciphertext from the `encryptBytes` result. |
| `authTag` | `Uint8Array` | The 16-byte (128-bit) GCM authentication tag from the `encryptBytes` result. |
| `aad?` | `Uint8Array`\<`ArrayBufferLike`\> | The identical additional authenticated data supplied at encrypt time (or absent if none was supplied). A mismatch fails authentication. |

#### Returns

`Promise`\<[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<`Uint8Array`\<`ArrayBufferLike`\>\>\>

`Success` with the decrypted plaintext bytes, or `Failure` with
error context (including all authentication failures).

***

### deriveKey()

> **deriveKey**(`password`, `salt`, `iterations`): `Promise`\<[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<`Uint8Array`\<`ArrayBufferLike`\>\>\>

Derives a key from a password using PBKDF2.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `password` | `string` | Password string |
| `salt` | `Uint8Array` | Salt bytes (should be at least 16 bytes) |
| `iterations` | `number` | Number of iterations (recommend 100000+) |

#### Returns

`Promise`\<[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<`Uint8Array`\<`ArrayBufferLike`\>\>\>

Success with derived 32-byte key, or Failure with error

***

### encrypt()

> **encrypt**(`plaintext`, `key`): `Promise`\<[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<[`IEncryptionResult`](IEncryptionResult.md)\>\>

Encrypts plaintext using AES-256-GCM.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `plaintext` | `string` | UTF-8 string to encrypt |
| `key` | `Uint8Array` | 32-byte encryption key |

#### Returns

`Promise`\<[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<[`IEncryptionResult`](IEncryptionResult.md)\>\>

Success with encryption result, or Failure with error

***

### encryptBytes()

> **encryptBytes**(`key`, `nonce`, `plaintext`, `aad?`): `Promise`\<[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<[`IEncryptBytesResult`](IEncryptBytesResult.md)\>\>

Encrypts raw bytes using AES-256-GCM with a **caller-supplied nonce** and
optional additional authenticated data (AAD).

This is the raw-byte sibling of [encrypt](#encrypt).
Unlike `encrypt`, it takes and returns `Uint8Array` (no UTF-8 coding), the
caller owns the nonce (rather than the provider generating one), and it
binds optional `aad` into the GCM authentication. Use it when you need to
bind context (e.g. an actor id, key version, or row kind) into the
authentication so a wrapped secret cannot be replayed across
users/versions/kinds, or when you manage nonces yourself.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `key` | `Uint8Array` | 32-byte AES-256 key. Wrong lengths fail with error context. |
| `nonce` | `Uint8Array` | 12-byte (96-bit) GCM nonce. MUST be unique per message under `key` (see the nonce-uniqueness warning above). Wrong lengths fail with error context. |
| `plaintext` | `Uint8Array` | The bytes to encrypt. Empty plaintext is permitted and round-trips (GCM produces a valid tag over zero-length plaintext). |
| `aad?` | `Uint8Array`\<`ArrayBufferLike`\> | Optional additional authenticated data bound into the GCM tag but NOT encrypted. If provided at encrypt time, the identical bytes must be supplied to `decryptBytes` or decryption fails authentication. Absent means no AAD. |

#### Returns

`Promise`\<[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<[`IEncryptBytesResult`](IEncryptBytesResult.md)\>\>

`Success` with the [ciphertext and 16-byte auth tag](IEncryptBytesResult.md),
or `Failure` with error context.

#### Remarks

**⚠️ NONCE UNIQUENESS IS THE CALLER'S RESPONSIBILITY AND IS CRITICAL.**
Because the caller supplies the nonce, this primitive cannot guarantee
uniqueness. Reusing a `(key, nonce)` pair for two different messages is
**catastrophic** for AES-GCM: it breaks confidentiality (the XOR of the two
plaintexts leaks) AND authentication (the GCM authentication key can be
recovered, letting an attacker forge tags for arbitrary messages under that
key). The caller MUST use a unique nonce for every message encrypted under a
given key — draw it from [generateRandomBytes(12)](#generaterandombytes)
(12 random bytes has negligible collision probability well within a single
key's message budget) or from a strictly-increasing counter. Never hardcode
a nonce and never reuse one.

***

### exportPublicKeyJwk()

> **exportPublicKeyJwk**(`publicKey`): `Promise`\<[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<`JsonWebKey`\>\>

Exports the public half of a keypair as a JSON Web Key.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `publicKey` | `CryptoKey` | The public `CryptoKey` to export. Must be an `extractable` key generated for an asymmetric algorithm. |

#### Returns

`Promise`\<[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<`JsonWebKey`\>\>

Success with the JWK, or Failure with error context.

***

### exportPublicKeySpki()

> **exportPublicKeySpki**(`publicKey`): `Promise`\<[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<`Uint8Array`\<`ArrayBufferLike`\>\>\>

Exports a public `CryptoKey` as a DER-encoded SPKI (SubjectPublicKeyInfo) blob.
SPKI is the standard algorithm-agnostic format for public key storage and transport.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `publicKey` | `CryptoKey` | The `CryptoKey` to export. Must have `key.type === 'public'`. |

#### Returns

`Promise`\<[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<`Uint8Array`\<`ArrayBufferLike`\>\>\>

`Success` with the raw SPKI bytes, or `Failure` with error context.

***

### fromBase64()

> **fromBase64**(`base64`): [`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<`Uint8Array`\<`ArrayBufferLike`\>\>

Decodes base64 string to binary data.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `base64` | `string` | Base64-encoded string |

#### Returns

[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<`Uint8Array`\<`ArrayBufferLike`\>\>

Success with decoded bytes, or Failure if invalid base64

***

### generateHmacKey()

> **generateHmacKey**(`options?`): `Promise`\<[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<`CryptoKey`\>\>

Generates a fresh random HMAC-SHA256 key.

The key is exactly `Constants.HMAC_SHA256_KEY_SIZE`
bytes (256 bits), carries usages `['sign', 'verify']`, and is
non-extractable unless `options.extractable` is `true`.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `options?` | [`IHmacKeyOptions`](IHmacKeyOptions.md) | Optional `IHmacKeyOptions`. |

#### Returns

`Promise`\<[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<`CryptoKey`\>\>

`Success` with the HMAC `CryptoKey`, or `Failure` with error context.

***

### generateKey()

> **generateKey**(): `Promise`\<[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<`Uint8Array`\<`ArrayBufferLike`\>\>\>

Generates a random 32-byte key suitable for AES-256.

#### Returns

`Promise`\<[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<`Uint8Array`\<`ArrayBufferLike`\>\>\>

Success with generated key, or Failure with error

***

### generateKeyPair()

> **generateKeyPair**(`algorithm`, `extractable`): `Promise`\<[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<`CryptoKeyPair`\>\>

Generates a new asymmetric keypair for the requested algorithm.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `algorithm` | [`KeyPairAlgorithm`](../type-aliases/KeyPairAlgorithm.md) | The [algorithm](../type-aliases/KeyPairAlgorithm.md) to use. |
| `extractable` | `boolean` | Whether the resulting `CryptoKey` objects may be exported. Set `false` on backends that store `CryptoKey` references directly (e.g. IndexedDB). Set `true` when the private key must round-trip through JWK or PKCS#8 (e.g. encrypted-file backends). |

#### Returns

`Promise`\<[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<`CryptoKeyPair`\>\>

Success with the generated `CryptoKeyPair`, or Failure with error context.

***

### generateRandomBytes()

> **generateRandomBytes**(`length`): [`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<`Uint8Array`\<`ArrayBufferLike`\>\>

Generates cryptographically secure random bytes.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `length` | `number` | Number of bytes to generate |

#### Returns

[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<`Uint8Array`\<`ArrayBufferLike`\>\>

Success with random bytes, or Failure with error

***

### generateUuid()

> **generateUuid**(): [`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<[`Uuid`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\>

Generates a cryptographically random UUIDv4 using the provider's
underlying source of randomness. The default Node and browser
implementations delegate to `globalThis.crypto.randomUUID`;
deterministic providers (e.g. test stubs) may override to produce
reproducible values.

#### Returns

[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<[`Uuid`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\>

Success with a canonical UUID, or Failure with error.

***

### hmacSha256()

> **hmacSha256**(`key`, `data`): `Promise`\<[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<`Uint8Array`\<`ArrayBufferLike`\>\>\>

Computes an HMAC-SHA256 authentication code for `data` using `key`.

The key must be a `CryptoKey` with `'sign'` usage and algorithm name
`'HMAC'`. Obtain one from `generateHmacKey`,
or from `importHmacKey` for raw key
bytes — including bytes from `deriveKey`,
which returns a `Uint8Array` rather than a `CryptoKey`.
Use [ICryptoProvider.verifyHmacSha256](#verifyhmacsha256) for constant-time
verification of the output.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `key` | `CryptoKey` | An HMAC `CryptoKey` with `'sign'` usage. |
| `data` | `Uint8Array` | The bytes to authenticate. |

#### Returns

`Promise`\<[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<`Uint8Array`\<`ArrayBufferLike`\>\>\>

`Success` with the 32-byte MAC, or `Failure` with error context.

***

### importHmacKey()

> **importHmacKey**(`raw`, `options?`): `Promise`\<[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<`CryptoKey`\>\>

Imports raw key bytes as an HMAC-SHA256 key.

Use this for key material obtained elsewhere, including the output of
`deriveKey`. Refuses a key shorter than
`Constants.HMAC_SHA256_KEY_SIZE`
bytes (RFC 2104's `L` for SHA-256). The key carries usages
`['sign', 'verify']` and is non-extractable unless `options.extractable`
is `true`.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `raw` | `Uint8Array` | The raw key bytes (at least 32). |
| `options?` | [`IHmacKeyOptions`](IHmacKeyOptions.md) | Optional `IHmacKeyOptions`. |

#### Returns

`Promise`\<[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<`CryptoKey`\>\>

`Success` with the HMAC `CryptoKey`, or `Failure` with error context.

***

### importKeyPairFromSeed()

> **importKeyPairFromSeed**(`algorithm`, `seed`, `extractable`): `Promise`\<[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<`CryptoKeyPair`\>\>

Derives an asymmetric keypair *deterministically* from a fixed secret seed.
The same `seed` always yields the same keypair on every runtime, so this is
the primitive to use when a keypair must be reconstructable from stored seed
material (key escrow, HD-style derivation, deterministic test vectors) rather
than freshly sampled by [generateKeyPair](#generatekeypair).

For both `'ed25519'` and `'x25519'` the private key *is* its 32-byte seed and
the public key is a deterministic function of that seed (RFC 8032 / RFC 7748),
so the returned public key is recovered even when the caller requests a
non-extractable private key. The transient extractable key used internally to
recover the public half is never returned or logged when `extractable` is
`false`. The returned keys carry the algorithm's usages: `'ed25519'` →
private `'sign'` / public `'verify'`; `'x25519'` → private `'deriveBits'` /
public no-usage (ready to hand to [CryptoUtils.HpkeProvider](../classes/HpkeProvider.md)).

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `algorithm` | [`SeedDerivableAlgorithm`](../type-aliases/SeedDerivableAlgorithm.md) | The [seed-derivable algorithm](../type-aliases/SeedDerivableAlgorithm.md) (`'ed25519'` or `'x25519'`); any other value fails loudly with context. |
| `seed` | `Uint8Array` | The secret seed. It must be exactly 32 bytes for both supported algorithms; any other length fails loudly, before any WebCrypto call. The bytes are copied, not retained or mutated. |
| `extractable` | `boolean` | Whether the returned private key may be exported. The returned public key is identical for a given seed regardless of this flag. |

#### Returns

`Promise`\<[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<`CryptoKeyPair`\>\>

Success with the derived `CryptoKeyPair`, or Failure with error context.

***

### importPublicKeyJwk()

> **importPublicKeyJwk**(`jwk`, `algorithm`): `Promise`\<[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<`CryptoKey`\>\>

Re-imports a public-key JWK as a `CryptoKey` usable for verification or
encryption (depending on algorithm).

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `jwk` | `JsonWebKey` | The JSON Web Key produced by [exportPublicKeyJwk](#exportpublickeyjwk). |
| `algorithm` | [`KeyPairAlgorithm`](../type-aliases/KeyPairAlgorithm.md) | The [algorithm](../type-aliases/KeyPairAlgorithm.md) the key was generated for. Determines the import parameters and key usages. |

#### Returns

`Promise`\<[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<`CryptoKey`\>\>

Success with the imported public `CryptoKey`, or Failure with error context.

***

### importPublicKeySpki()

> **importPublicKeySpki**(`spkiBytes`, `algorithm`): `Promise`\<[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<`CryptoKey`\>\>

Imports a public key from a DER-encoded SPKI blob.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `spkiBytes` | `Uint8Array` | The raw SPKI bytes produced by [exportPublicKeySpki](#exportpublickeyspki). |
| `algorithm` | [`KeyPairAlgorithm`](../type-aliases/KeyPairAlgorithm.md) | The [algorithm](../type-aliases/KeyPairAlgorithm.md) the key was generated for. |

#### Returns

`Promise`\<[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<`CryptoKey`\>\>

`Success` with the imported public `CryptoKey`, or `Failure` with error context.

***

### sha256()

> **sha256**(`data`): `Promise`\<[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<`string`\>\>

Computes a SHA-256 hash of the given data.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `data` | `string` | UTF-8 string to hash |

#### Returns

`Promise`\<[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<`string`\>\>

Success with hex-encoded hash string, or Failure with error

***

### sign()

> **sign**(`privateKey`, `data`): `Promise`\<[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<`Uint8Array`\<`ArrayBufferLike`\>\>\>

Signs `data` with `privateKey` using the algorithm inferred from the key.
Delegates to `crypto.subtle.sign`; the algorithm is derived from
`privateKey.algorithm.name` — ECDSA keys are augmented with
`hash: 'SHA-256'` at sign time (the hash is not stored in the key);
all other algorithm names are passed through as-is.
Intended for Ed25519 and ECDSA-P256 asymmetric private keys; for
HMAC-SHA256 authentication codes use [ICryptoProvider.hmacSha256](#hmacsha256) instead.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `privateKey` | `CryptoKey` | A `CryptoKey` with `'sign'` usage (e.g. generated by [generateKeyPair](#generatekeypair) with `'ecdsa-p256'` or `'ed25519'`). |
| `data` | `Uint8Array` | The bytes to sign. |

#### Returns

`Promise`\<[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<`Uint8Array`\<`ArrayBufferLike`\>\>\>

`Success` with the raw signature bytes, or `Failure` with error context.

***

### timingSafeEqual()

> **timingSafeEqual**(`a`, `b`): `boolean`

Compares two byte arrays in constant time.

The comparison visits all bytes of `a` and `b` regardless of where they
diverge, accumulating XOR differences with bitwise-OR. No early-return is
possible once the length check passes, making timing independent of the
byte values. This prevents timing side-channels when comparing MAC outputs,
signed-token bytes, or any secret-derived byte sequences.

Returns `false` immediately (before the loop) when `a.length !== b.length`;
the length mismatch itself is not secret in normal use.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `a` | `Uint8Array` | First byte array. |
| `b` | `Uint8Array` | Second byte array. |

#### Returns

`boolean`

`true` if the arrays have the same length and identical contents,
`false` otherwise.

***

### toBase64()

> **toBase64**(`data`): `string`

Encodes binary data to base64 string.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `data` | `Uint8Array` | Binary data to encode |

#### Returns

`string`

Base64-encoded string

***

### unwrapBytes()

> **unwrapBytes**(`wrapped`, `recipientPrivateKey`, `options`): `Promise`\<[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<`Uint8Array`\<`ArrayBufferLike`\>\>\>

Inverse of [wrapBytes](#wrapbytes).
Recovers the original `plaintext` from a wrapped payload using the
recipient's private key.

Returns a `Failure` (never throws) on any of:
- Tampered nonce or ciphertext (AES-GCM authentication fails)
- Wrong private key (different shared secret derives a different wrap key)
- Wrong HKDF parameters (different wrap key)
- Malformed `ephemeralPublicKey` JWK
- Malformed base64 in `nonce` or `ciphertext`

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `wrapped` | [`IWrappedBytes`](IWrappedBytes.md) | The wrapped payload produced by `wrapBytes`. |
| `recipientPrivateKey` | `CryptoKey` | The recipient's ECDH P-256 private `CryptoKey`. Must have algorithm name `'ECDH'` and named curve `'P-256'`, and key usages including `'deriveKey'` or `'deriveBits'`. |
| `options` | [`IWrapBytesOptions`](IWrapBytesOptions.md) | The same HKDF parameters used at wrap time. |

#### Returns

`Promise`\<[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<`Uint8Array`\<`ArrayBufferLike`\>\>\>

`Success` with the original `plaintext`, or `Failure` with error context.

***

### verify()

> **verify**(`publicKey`, `signature`, `data`): `Promise`\<[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<`boolean`\>\>

Verifies a signature produced by [ICryptoProvider.sign](#sign).
Delegates to `crypto.subtle.verify`; the algorithm is derived from
`publicKey.algorithm.name` — ECDSA keys are augmented with
`hash: 'SHA-256'`; all other algorithm names are passed through as-is.
Intended for Ed25519 and ECDSA-P256 asymmetric public keys; for
HMAC-SHA256 verification use [ICryptoProvider.verifyHmacSha256](#verifyhmacsha256) instead.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `publicKey` | `CryptoKey` | A `CryptoKey` with `'verify'` usage (e.g. the public half of a keypair generated by [generateKeyPair](#generatekeypair) with `'ecdsa-p256'` or `'ed25519'`). |
| `signature` | `Uint8Array` | The raw signature bytes produced by `sign`. |
| `data` | `Uint8Array` | The original data that was signed. |

#### Returns

`Promise`\<[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<`boolean`\>\>

`Success` with `true` if the signature is valid, `false` if it is
not, or `Failure` with error context if the operation itself failed.

***

### verifyHmacSha256()

> **verifyHmacSha256**(`key`, `signature`, `data`): `Promise`\<[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<`boolean`\>\>

Verifies an HMAC-SHA256 authentication code in constant time.

Computes the expected MAC over `data` with `key`, then compares it to
`signature` using [ICryptoProvider.timingSafeEqual](#timingsafeequal) so that
mismatches do not leak information through timing.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `key` | `CryptoKey` | An HMAC `CryptoKey` with `'sign'` usage. |
| `signature` | `Uint8Array` | The MAC bytes to verify (typically 32 bytes). |
| `data` | `Uint8Array` | The original data that was authenticated. |

#### Returns

`Promise`\<[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<`boolean`\>\>

`Success` with `true` if the MAC is valid, `false` if it is not,
or `Failure` with error context if the MAC computation itself failed.

***

### wrapBytes()

> **wrapBytes**(`plaintext`, `recipientPublicKey`, `options`): `Promise`\<[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<[`IWrappedBytes`](IWrappedBytes.md)\>\>

Wraps `plaintext` for delivery to the holder of the private key paired
with `recipientPublicKey`. Uses ECIES with ECDH P-256, HKDF-SHA256, and
AES-GCM-256.

Generates a fresh ephemeral keypair per call; the ephemeral private key
is discarded after the shared-secret derive. Only the recipient (with the
matching private key) and the same HKDF parameters can recover
`plaintext`.

Empty `plaintext` is permitted; the resulting wrap contains only the
16-byte GCM authentication tag and round-trips back to an empty
`Uint8Array`.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `plaintext` | `Uint8Array` | The bytes to wrap. Any length supported by AES-GCM (in practice, well below 2^39 - 256 bits). |
| `recipientPublicKey` | `CryptoKey` | The recipient's ECDH P-256 public `CryptoKey`. Must have algorithm name `'ECDH'` and named curve `'P-256'`; mismatched algorithm or curve yields a `Failure` with error context. |
| `options` | [`IWrapBytesOptions`](IWrapBytesOptions.md) | HKDF parameters; see [IWrapBytesOptions](IWrapBytesOptions.md). |

#### Returns

`Promise`\<[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<[`IWrappedBytes`](IWrappedBytes.md)\>\>

`Success` with the wrapped payload, or `Failure` with error context.
