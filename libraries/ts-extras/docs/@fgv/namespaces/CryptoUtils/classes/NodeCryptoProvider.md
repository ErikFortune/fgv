[**@fgv/ts-extras**](../../../../README.md)

***

[@fgv/ts-extras](../../../../README.md) / [CryptoUtils](../README.md) / NodeCryptoProvider

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

> **decrypt**(`encryptedData`, `key`, `iv`, `authTag`): `Promise`\<[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`string`\>\>

Decrypts ciphertext using AES-256-GCM.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `encryptedData` | `Uint8Array` | Encrypted bytes |
| `key` | `Uint8Array` | 32-byte decryption key |
| `iv` | `Uint8Array` | Initialization vector (12 bytes) |
| `authTag` | `Uint8Array` | GCM authentication tag (16 bytes) |

#### Returns

`Promise`\<[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`string`\>\>

`Success` with decrypted UTF-8 string, or `Failure` with an error.

#### Implementation of

[`ICryptoProvider`](../interfaces/ICryptoProvider.md).[`decrypt`](../interfaces/ICryptoProvider.md#decrypt)

***

### deriveKey()

> **deriveKey**(`password`, `salt`, `iterations`): `Promise`\<[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`Uint8Array`\<`ArrayBufferLike`\>\>\>

Derives a key from a password using PBKDF2.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `password` | `string` | Password string |
| `salt` | `Uint8Array` | Salt bytes (should be at least 16 bytes) |
| `iterations` | `number` | Number of iterations (recommend 100000+) |

#### Returns

`Promise`\<[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`Uint8Array`\<`ArrayBufferLike`\>\>\>

`Success` with derived 32-byte key, or `Failure` with an error.

#### Implementation of

[`ICryptoProvider`](../interfaces/ICryptoProvider.md).[`deriveKey`](../interfaces/ICryptoProvider.md#derivekey)

***

### encrypt()

> **encrypt**(`plaintext`, `key`): `Promise`\<[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`IEncryptionResult`](../interfaces/IEncryptionResult.md)\>\>

Encrypts plaintext using AES-256-GCM.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `plaintext` | `string` | UTF-8 string to encrypt |
| `key` | `Uint8Array` | 32-byte encryption key |

#### Returns

`Promise`\<[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`IEncryptionResult`](../interfaces/IEncryptionResult.md)\>\>

`Success` with encryption result, or `Failure` with an error.

#### Implementation of

[`ICryptoProvider`](../interfaces/ICryptoProvider.md).[`encrypt`](../interfaces/ICryptoProvider.md#encrypt)

***

### fromBase64()

> **fromBase64**(`base64`): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`Uint8Array`\<`ArrayBufferLike`\>\>

Decodes base64 string to binary data.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `base64` | `string` | Base64-encoded string |

#### Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`Uint8Array`\<`ArrayBufferLike`\>\>

Success with decoded bytes, or Failure if invalid base64

#### Implementation of

[`ICryptoProvider`](../interfaces/ICryptoProvider.md).[`fromBase64`](../interfaces/ICryptoProvider.md#frombase64)

***

### generateKey()

> **generateKey**(): `Promise`\<[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`Uint8Array`\<`ArrayBufferLike`\>\>\>

Generates a random 32-byte key suitable for AES-256.

#### Returns

`Promise`\<[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`Uint8Array`\<`ArrayBufferLike`\>\>\>

`Success` with generated key, or `Failure` with an error.

#### Implementation of

[`ICryptoProvider`](../interfaces/ICryptoProvider.md).[`generateKey`](../interfaces/ICryptoProvider.md#generatekey)

***

### generateRandomBytes()

> **generateRandomBytes**(`length`): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`Uint8Array`\<`ArrayBufferLike`\>\>

Generates cryptographically secure random bytes.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `length` | `number` | Number of bytes to generate |

#### Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`Uint8Array`\<`ArrayBufferLike`\>\>

Success with random bytes, or Failure with error

#### Implementation of

[`ICryptoProvider`](../interfaces/ICryptoProvider.md).[`generateRandomBytes`](../interfaces/ICryptoProvider.md#generaterandombytes)

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
