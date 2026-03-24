[**@fgv/ts-web-extras**](../../../../README.md)

***

[@fgv/ts-web-extras](../../../../README.md) / [CryptoUtils](../README.md) / BrowserCryptoProvider

# Class: BrowserCryptoProvider

Browser implementation of `ICryptoProvider` using the Web Crypto API.
Uses AES-256-GCM for authenticated encryption.

Note: This provider requires a browser environment with Web Crypto API support.
In Node.js 15+, Web Crypto is available via globalThis.crypto or require('crypto').webcrypto.

## Implements

- [`ICryptoProvider`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-web-extras/docs)

## Constructors

### Constructor

> **new BrowserCryptoProvider**(`cryptoApi?`): `BrowserCryptoProvider`

Creates a new BrowserCryptoProvider.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `cryptoApi?` | `Crypto` | Optional Crypto instance (defaults to globalThis.crypto) |

#### Returns

`BrowserCryptoProvider`

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

`ICryptoProvider.decrypt`

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

Success with derived 32-byte key, or Failure with error

#### Implementation of

`ICryptoProvider.deriveKey`

***

### encrypt()

> **encrypt**(`plaintext`, `key`): `Promise`\<[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`IEncryptionResult`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-extras/docs)\>\>

Encrypts plaintext using AES-256-GCM.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `plaintext` | `string` | UTF-8 string to encrypt |
| `key` | `Uint8Array` | 32-byte encryption key |

#### Returns

`Promise`\<[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`IEncryptionResult`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-extras/docs)\>\>

`Success` with encryption result, or `Failure` with an error.

#### Implementation of

`ICryptoProvider.encrypt`

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

`ICryptoProvider.fromBase64`

***

### generateKey()

> **generateKey**(): `Promise`\<[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`Uint8Array`\<`ArrayBufferLike`\>\>\>

Generates a random 32-byte key suitable for AES-256.

#### Returns

`Promise`\<[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`Uint8Array`\<`ArrayBufferLike`\>\>\>

Success with generated key, or Failure with error

#### Implementation of

`ICryptoProvider.generateKey`

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

`ICryptoProvider.generateRandomBytes`

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

`ICryptoProvider.toBase64`
