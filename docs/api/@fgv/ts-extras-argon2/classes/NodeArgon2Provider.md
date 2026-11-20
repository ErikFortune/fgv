[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-extras-argon2](../README.md) / NodeArgon2Provider

# Class: NodeArgon2Provider

Node.js implementation of @fgv/ts-extras#IArgon2idProvider backed by the
`argon2` (kelektiv) native binding.

## Implements

- [`IArgon2idProvider`](../namespaces/CryptoUtils/interfaces/IArgon2idProvider.md)

## Methods

### argon2id()

> **argon2id**(`password`, `salt`, `params`, `options?`): `Promise`\<[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<`Uint8Array`\<`ArrayBufferLike`\>\>\>

Derives a key using Argon2id.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `password` | `string` \| `Uint8Array`\<`ArrayBufferLike`\> | The password or passphrase (string or raw bytes). |
| `salt` | `Uint8Array` | The salt (must be at least 8 bytes; 16+ bytes recommended). |
| `params` | [`IArgon2idParams`](../namespaces/CryptoUtils/interfaces/IArgon2idParams.md) | Argon2id parameters. All values are validated before derivation. |
| `options?` | [`IArgon2idKeyingOptions`](../namespaces/CryptoUtils/interfaces/IArgon2idKeyingOptions.md) | Optional @fgv/ts-extras#CryptoUtils.IArgon2idKeyingOptions \| keyed-hashing inputs (RFC 9106 secret K and/or associated data X). Both are wired through to the underlying `argon2` binding when present and non-empty; omitting them (or passing empty arrays) leaves the output byte-identical to prior behavior. |

#### Returns

`Promise`\<[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<`Uint8Array`\<`ArrayBufferLike`\>\>\>

Success with the derived key bytes, or Failure with a descriptive message.

#### Implementation of

[`IArgon2idProvider`](../namespaces/CryptoUtils/interfaces/IArgon2idProvider.md).[`argon2id`](../namespaces/CryptoUtils/interfaces/IArgon2idProvider.md#argon2id)

***

### create()

> `static` **create**(): [`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<`NodeArgon2Provider`\>

Creates a new NodeArgon2Provider instance.

#### Returns

[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<`NodeArgon2Provider`\>

Success with a new provider instance.
