[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-web-extras-argon2](../../../README.md) / [CryptoUtils](../README.md) / NodeCryptoProvider

# Class: NodeCryptoProvider

Node.js implementation of [CryptoUtils.ICryptoProvider](../interfaces/ICryptoProvider.md) using the built-in crypto module.
Uses AES-256-GCM for authenticated encryption.

## Implements

- [`ICryptoProvider`](../interfaces/ICryptoProvider.md)

## Constructors

### Constructor

> **new NodeCryptoProvider**(): `NodeCryptoProvider`

#### Returns

`NodeCryptoProvider`

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

`Success` with decrypted UTF-8 string, or `Failure` with an error.

#### Implementation of

[`ICryptoProvider`](../interfaces/ICryptoProvider.md).[`decrypt`](../interfaces/ICryptoProvider.md#decrypt)

***

### decryptBytes()

> **decryptBytes**(`key`, `nonce`, `ciphertext`, `authTag`, `aad?`): `Promise`\<[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<`Uint8Array`\<`ArrayBufferLike`\>\>\>

Decrypts raw bytes produced by [NodeCryptoProvider.encryptBytes](#encryptbytes) using
AES-256-GCM. See [ICryptoProvider.decryptBytes](../interfaces/ICryptoProvider.md#decryptbytes).
Fails (never throws) on any authentication failure, including a mismatched `aad`.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `key` | `Uint8Array` | 32-byte AES-256 key. |
| `nonce` | `Uint8Array` | 12-byte GCM nonce (the same one used to encrypt). |
| `ciphertext` | `Uint8Array` | The ciphertext from the `encryptBytes` result. |
| `authTag` | `Uint8Array` | The 16-byte GCM auth tag from the `encryptBytes` result. |
| `aad?` | `Uint8Array`\<`ArrayBufferLike`\> | The identical AAD supplied at encrypt time (or absent). |

#### Returns

`Promise`\<[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<`Uint8Array`\<`ArrayBufferLike`\>\>\>

`Success` with the decrypted plaintext bytes, or `Failure` with an error.

#### Implementation of

[`ICryptoProvider`](../interfaces/ICryptoProvider.md).[`decryptBytes`](../interfaces/ICryptoProvider.md#decryptbytes)

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

`Success` with derived 32-byte key, or `Failure` with an error.

#### Implementation of

[`ICryptoProvider`](../interfaces/ICryptoProvider.md).[`deriveKey`](../interfaces/ICryptoProvider.md#derivekey)

***

### encrypt()

> **encrypt**(`plaintext`, `key`): `Promise`\<[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<[`IEncryptionResult`](../interfaces/IEncryptionResult.md)\>\>

Encrypts plaintext using AES-256-GCM.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `plaintext` | `string` | UTF-8 string to encrypt |
| `key` | `Uint8Array` | 32-byte encryption key |

#### Returns

`Promise`\<[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<[`IEncryptionResult`](../interfaces/IEncryptionResult.md)\>\>

`Success` with encryption result, or `Failure` with an error.

#### Implementation of

[`ICryptoProvider`](../interfaces/ICryptoProvider.md).[`encrypt`](../interfaces/ICryptoProvider.md#encrypt)

***

### encryptBytes()

> **encryptBytes**(`key`, `nonce`, `plaintext`, `aad?`): `Promise`\<[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<[`IEncryptBytesResult`](../interfaces/IEncryptBytesResult.md)\>\>

Encrypts raw bytes using AES-256-GCM with a caller-supplied nonce and
optional AAD. See [ICryptoProvider.encryptBytes](../interfaces/ICryptoProvider.md#encryptbytes)
— in particular the caller's responsibility to use a unique `nonce` per
message under a given `key`.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `key` | `Uint8Array` | 32-byte AES-256 key. |
| `nonce` | `Uint8Array` | 12-byte GCM nonce (must be unique per message under `key`). |
| `plaintext` | `Uint8Array` | The bytes to encrypt (empty permitted). |
| `aad?` | `Uint8Array`\<`ArrayBufferLike`\> | Optional additional authenticated data bound into the tag. |

#### Returns

`Promise`\<[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<[`IEncryptBytesResult`](../interfaces/IEncryptBytesResult.md)\>\>

`Success` with the ciphertext and 16-byte auth tag, or `Failure` with an error.

#### Implementation of

[`ICryptoProvider`](../interfaces/ICryptoProvider.md).[`encryptBytes`](../interfaces/ICryptoProvider.md#encryptbytes)

***

### exportPublicKeyJwk()

> **exportPublicKeyJwk**(`publicKey`): `Promise`\<[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<`JsonWebKey`\>\>

Exports a public `CryptoKey` as a JSON Web Key.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `publicKey` | `CryptoKey` | Extractable public key to export. |

#### Returns

`Promise`\<[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<`JsonWebKey`\>\>

`Success` with the JWK, or `Failure` if not a public key or if export fails.

#### Remarks

Rejects non-public keys at runtime. WebCrypto's `exportKey('jwk', ...)`
does not enforce public-vs-private; without this guard a caller that
passed an extractable private key would receive its private fields
(`d`, `p`, `q`, ...) as JWK, defeating the method's name.

#### Implementation of

[`ICryptoProvider`](../interfaces/ICryptoProvider.md).[`exportPublicKeyJwk`](../interfaces/ICryptoProvider.md#exportpublickeyjwk)

***

### exportPublicKeySpki()

> **exportPublicKeySpki**(`publicKey`): `Promise`\<[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<`Uint8Array`\<`ArrayBufferLike`\>\>\>

Exports a public `CryptoKey` as a DER-encoded SPKI blob.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `publicKey` | `CryptoKey` | The public `CryptoKey` to export. |

#### Returns

`Promise`\<[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<`Uint8Array`\<`ArrayBufferLike`\>\>\>

`Success` with the raw SPKI bytes, or `Failure` with error context.

#### Implementation of

[`ICryptoProvider`](../interfaces/ICryptoProvider.md).[`exportPublicKeySpki`](../interfaces/ICryptoProvider.md#exportpublickeyspki)

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

#### Implementation of

[`ICryptoProvider`](../interfaces/ICryptoProvider.md).[`fromBase64`](../interfaces/ICryptoProvider.md#frombase64)

***

### generateHmacKey()

> **generateHmacKey**(`options?`): `Promise`\<[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<`CryptoKey`\>\>

Generates a fresh random 256-bit HMAC-SHA256 key with usages
`['sign', 'verify']`, non-extractable by default.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `options?` | [`IHmacKeyOptions`](../interfaces/IHmacKeyOptions.md) | Optional `IHmacKeyOptions`. |

#### Returns

`Promise`\<[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<`CryptoKey`\>\>

`Success` with the HMAC `CryptoKey`, or `Failure` with error context.

#### Implementation of

[`ICryptoProvider`](../interfaces/ICryptoProvider.md).[`generateHmacKey`](../interfaces/ICryptoProvider.md#generatehmackey)

***

### generateKey()

> **generateKey**(): `Promise`\<[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<`Uint8Array`\<`ArrayBufferLike`\>\>\>

Generates a random 32-byte key suitable for AES-256.

#### Returns

`Promise`\<[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<`Uint8Array`\<`ArrayBufferLike`\>\>\>

`Success` with generated key, or `Failure` with an error.

#### Implementation of

[`ICryptoProvider`](../interfaces/ICryptoProvider.md).[`generateKey`](../interfaces/ICryptoProvider.md#generatekey)

***

### generateKeyPair()

> **generateKeyPair**(`algorithm`, `extractable`): `Promise`\<[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<`CryptoKeyPair`\>\>

Generates a new asymmetric keypair using Node's WebCrypto.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `algorithm` | [`KeyPairAlgorithm`](../type-aliases/KeyPairAlgorithm.md) | The [algorithm](../type-aliases/KeyPairAlgorithm.md) to use. |
| `extractable` | `boolean` | Whether the resulting keys may be exported. |

#### Returns

`Promise`\<[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<`CryptoKeyPair`\>\>

`Success` with the generated `CryptoKeyPair`, or `Failure` with an error.

#### Implementation of

[`ICryptoProvider`](../interfaces/ICryptoProvider.md).[`generateKeyPair`](../interfaces/ICryptoProvider.md#generatekeypair)

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

#### Implementation of

[`ICryptoProvider`](../interfaces/ICryptoProvider.md).[`generateRandomBytes`](../interfaces/ICryptoProvider.md#generaterandombytes)

***

### generateUuid()

> **generateUuid**(): [`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<[`Uuid`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\>

Generates a cryptographically random UUIDv4 via the platform Web Crypto API.

#### Returns

[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<[`Uuid`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\>

`Success` with the generated UUID, or `Failure` if the runtime
does not expose `globalThis.crypto.randomUUID`.

#### Implementation of

[`ICryptoProvider`](../interfaces/ICryptoProvider.md).[`generateUuid`](../interfaces/ICryptoProvider.md#generateuuid)

***

### hmacSha256()

> **hmacSha256**(`key`, `data`): `Promise`\<[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<`Uint8Array`\<`ArrayBufferLike`\>\>\>

Computes an HMAC-SHA256 MAC for `data` using `key`.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `key` | `CryptoKey` | An HMAC `CryptoKey` with `'sign'` usage. |
| `data` | `Uint8Array` | The bytes to authenticate. |

#### Returns

`Promise`\<[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<`Uint8Array`\<`ArrayBufferLike`\>\>\>

`Success` with the 32-byte MAC, or `Failure` with error context.

#### Implementation of

[`ICryptoProvider`](../interfaces/ICryptoProvider.md).[`hmacSha256`](../interfaces/ICryptoProvider.md#hmacsha256)

***

### importHmacKey()

> **importHmacKey**(`raw`, `options?`): `Promise`\<[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<`CryptoKey`\>\>

Imports raw key bytes as an HMAC-SHA256 key with usages
`['sign', 'verify']`, non-extractable by default. Refuses keys shorter
than `Constants.HMAC_SHA256_KEY_SIZE` bytes.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `raw` | `Uint8Array` | The raw key bytes. |
| `options?` | [`IHmacKeyOptions`](../interfaces/IHmacKeyOptions.md) | Optional `IHmacKeyOptions`. |

#### Returns

`Promise`\<[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<`CryptoKey`\>\>

`Success` with the HMAC `CryptoKey`, or `Failure` with error context.

#### Implementation of

[`ICryptoProvider`](../interfaces/ICryptoProvider.md).[`importHmacKey`](../interfaces/ICryptoProvider.md#importhmackey)

***

### importKeyPairFromSeed()

> **importKeyPairFromSeed**(`algorithm`, `seed`, `extractable`): `Promise`\<[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<`CryptoKeyPair`\>\>

Derives an asymmetric keypair deterministically from a fixed secret seed.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `algorithm` | [`SeedDerivableAlgorithm`](../type-aliases/SeedDerivableAlgorithm.md) | The seed-derivable algorithm (only `'ed25519'` today). |
| `seed` | `Uint8Array` | The 32-byte secret seed. |
| `extractable` | `boolean` | Whether the returned private key may be exported. |

#### Returns

`Promise`\<[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<`CryptoKeyPair`\>\>

`Success` with the derived `CryptoKeyPair`, or `Failure` with an error.

#### Implementation of

[`ICryptoProvider`](../interfaces/ICryptoProvider.md).[`importKeyPairFromSeed`](../interfaces/ICryptoProvider.md#importkeypairfromseed)

***

### importPublicKeyJwk()

> **importPublicKeyJwk**(`jwk`, `algorithm`): `Promise`\<[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<`CryptoKey`\>\>

Imports a public-key JWK as a `CryptoKey` for the requested algorithm.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `jwk` | `JsonWebKey` | The JSON Web Key produced by a prior export. |
| `algorithm` | [`KeyPairAlgorithm`](../type-aliases/KeyPairAlgorithm.md) | The algorithm the key was generated for. |

#### Returns

`Promise`\<[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<`CryptoKey`\>\>

`Success` with the imported public `CryptoKey`, or `Failure` with an error.

#### Implementation of

[`ICryptoProvider`](../interfaces/ICryptoProvider.md).[`importPublicKeyJwk`](../interfaces/ICryptoProvider.md#importpublickeyjwk)

***

### importPublicKeySpki()

> **importPublicKeySpki**(`spkiBytes`, `algorithm`): `Promise`\<[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<`CryptoKey`\>\>

Imports a public key from a DER-encoded SPKI blob.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `spkiBytes` | `Uint8Array` | The raw SPKI bytes. |
| `algorithm` | [`KeyPairAlgorithm`](../type-aliases/KeyPairAlgorithm.md) | The algorithm the key was generated for. |

#### Returns

`Promise`\<[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<`CryptoKey`\>\>

`Success` with the imported public `CryptoKey`, or `Failure` with error context.

#### Implementation of

[`ICryptoProvider`](../interfaces/ICryptoProvider.md).[`importPublicKeySpki`](../interfaces/ICryptoProvider.md#importpublickeyspki)

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

`Success` with hex-encoded hash string, or `Failure` with an error.

#### Implementation of

[`ICryptoProvider`](../interfaces/ICryptoProvider.md).[`sha256`](../interfaces/ICryptoProvider.md#sha256)

***

### sign()

> **sign**(`privateKey`, `data`): `Promise`\<[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<`Uint8Array`\<`ArrayBufferLike`\>\>\>

Signs `data` with `privateKey` using the algorithm inferred from the key.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `privateKey` | `CryptoKey` | A signing `CryptoKey` (`'ecdsa-p256'` or `'ed25519'`). |
| `data` | `Uint8Array` | The bytes to sign. |

#### Returns

`Promise`\<[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<`Uint8Array`\<`ArrayBufferLike`\>\>\>

`Success` with the raw signature bytes, or `Failure` with error context.

#### Implementation of

[`ICryptoProvider`](../interfaces/ICryptoProvider.md).[`sign`](../interfaces/ICryptoProvider.md#sign)

***

### timingSafeEqual()

> **timingSafeEqual**(`a`, `b`): `boolean`

Compares two byte arrays in constant time using Node's native
`crypto.timingSafeEqual`. Returns `false` for mismatched lengths
rather than throwing (Node's native throws on length mismatch).

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `a` | `Uint8Array` | First byte array. |
| `b` | `Uint8Array` | Second byte array. |

#### Returns

`boolean`

`true` if lengths match and all bytes are equal, `false` otherwise.

#### Implementation of

[`ICryptoProvider`](../interfaces/ICryptoProvider.md).[`timingSafeEqual`](../interfaces/ICryptoProvider.md#timingsafeequal)

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

#### Implementation of

[`ICryptoProvider`](../interfaces/ICryptoProvider.md).[`toBase64`](../interfaces/ICryptoProvider.md#tobase64)

***

### unwrapBytes()

> **unwrapBytes**(`wrapped`, `recipientPrivateKey`, `options`): `Promise`\<[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<`Uint8Array`\<`ArrayBufferLike`\>\>\>

Unwraps a payload produced by `wrapBytes` using the recipient's private
key. See [ICryptoProvider.unwrapBytes](../interfaces/ICryptoProvider.md#unwrapbytes).

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `wrapped` | [`IWrappedBytes`](../interfaces/IWrappedBytes.md) | The wrapped payload. |
| `recipientPrivateKey` | `CryptoKey` | The recipient's ECDH P-256 private `CryptoKey`. |
| `options` | [`IWrapBytesOptions`](../interfaces/IWrapBytesOptions.md) | HKDF salt and info matching the wrap call. |

#### Returns

`Promise`\<[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<`Uint8Array`\<`ArrayBufferLike`\>\>\>

`Success` with the original `plaintext`, or `Failure` with an error.

#### Implementation of

[`ICryptoProvider`](../interfaces/ICryptoProvider.md).[`unwrapBytes`](../interfaces/ICryptoProvider.md#unwrapbytes)

***

### verify()

> **verify**(`publicKey`, `signature`, `data`): `Promise`\<[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<`boolean`\>\>

Verifies a signature produced by [NodeCryptoProvider.sign](#sign).

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `publicKey` | `CryptoKey` | A verify `CryptoKey` (`'ecdsa-p256'` or `'ed25519'`). |
| `signature` | `Uint8Array` | The raw signature bytes. |
| `data` | `Uint8Array` | The original data that was signed. |

#### Returns

`Promise`\<[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<`boolean`\>\>

`Success` with `true` if valid, `false` if not, or `Failure` with error context.

#### Implementation of

[`ICryptoProvider`](../interfaces/ICryptoProvider.md).[`verify`](../interfaces/ICryptoProvider.md#verify)

***

### verifyHmacSha256()

> **verifyHmacSha256**(`key`, `signature`, `data`): `Promise`\<[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<`boolean`\>\>

Verifies an HMAC-SHA256 MAC in constant time.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `key` | `CryptoKey` | An HMAC `CryptoKey` with `'sign'` usage. |
| `signature` | `Uint8Array` | The MAC bytes to verify. |
| `data` | `Uint8Array` | The original data that was authenticated. |

#### Returns

`Promise`\<[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<`boolean`\>\>

`Success` with `true` if valid, `false` if not, or `Failure` with error context.

#### Implementation of

[`ICryptoProvider`](../interfaces/ICryptoProvider.md).[`verifyHmacSha256`](../interfaces/ICryptoProvider.md#verifyhmacsha256)

***

### wrapBytes()

> **wrapBytes**(`plaintext`, `recipientPublicKey`, `options`): `Promise`\<[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<[`IWrappedBytes`](../interfaces/IWrappedBytes.md)\>\>

Wraps `plaintext` for the holder of `recipientPublicKey` using
ECIES (ECDH P-256 + HKDF-SHA256 + AES-GCM-256). See
[ICryptoProvider.wrapBytes](../interfaces/ICryptoProvider.md#wrapbytes).

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `plaintext` | `Uint8Array` | The bytes to wrap. |
| `recipientPublicKey` | `CryptoKey` | The recipient's ECDH P-256 public `CryptoKey`. |
| `options` | [`IWrapBytesOptions`](../interfaces/IWrapBytesOptions.md) | HKDF salt and info; see [IWrapBytesOptions](../interfaces/IWrapBytesOptions.md). |

#### Returns

`Promise`\<[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<[`IWrappedBytes`](../interfaces/IWrappedBytes.md)\>\>

`Success` with the wrapped payload, or `Failure` with an error.

#### Implementation of

[`ICryptoProvider`](../interfaces/ICryptoProvider.md).[`wrapBytes`](../interfaces/ICryptoProvider.md#wrapbytes)
