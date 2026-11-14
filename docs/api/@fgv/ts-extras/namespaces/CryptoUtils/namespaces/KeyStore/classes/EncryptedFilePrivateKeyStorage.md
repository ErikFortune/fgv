[**@fgv Monorepo API Documentation**](../../../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../../../README.md) / [@fgv/ts-extras](../../../../../README.md) / [CryptoUtils](../../../README.md) / [KeyStore](../README.md) / EncryptedFilePrivateKeyStorage

# Class: EncryptedFilePrivateKeyStorage

[IPrivateKeyStorage](../interfaces/IPrivateKeyStorage.md)
implementation that persists each private key as its own AES-256-GCM-encrypted
file in a directory. The file content is the key's JWK, encrypted with a
consumer-supplied 32-byte key via the supplied
[crypto provider](../../../interfaces/ICryptoProvider.md).

`supportsNonExtractable` is `false`: persisting to disk requires exporting the
private key to JWK, which only works for `extractable: true` keys. The
keystore generates extractable keys when a backend reports `false` here.

I/O goes through the [FileTree](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs) abstraction (default
`FsTree`), so the same implementation works against an in-memory tree (tests)
or any other Node-compatible backend.

This backend is **Node-only**: it round-trips private keys through
`node:crypto` (`crypto.webcrypto.subtle`), so it is intentionally excluded
from the browser entry point. Browser consumers should use
`IdbPrivateKeyStorage` from `@fgv/ts-web-extras` instead.

Single-process assumption: there is no inter-process locking. Concurrent
writers to the same directory may race.

## Implements

- [`IPrivateKeyStorage`](../interfaces/IPrivateKeyStorage.md)

## Properties

| Property | Modifier | Type | Default value | Description |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-supportsnonextractable"></a> `supportsNonExtractable` | `public readonly` | `false` | `false` | `false` — disk persistence round-trips via JWK, which requires extractable keys. |

## Methods

### delete()

> **delete**(`id`): `Promise`\<[`Result`](../../../../../../ts-res-ui-components/type-aliases/Result.md)\<`string`\>\>

Deletes the entry stored under `id`. Missing ids fail (the read path is
keystore-driven and never asks to delete an id it did not store).

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `id` | `string` | Storage handle. |

#### Returns

`Promise`\<[`Result`](../../../../../../ts-res-ui-components/type-aliases/Result.md)\<`string`\>\>

#### Implementation of

[`IPrivateKeyStorage`](../interfaces/IPrivateKeyStorage.md).[`delete`](../interfaces/IPrivateKeyStorage.md#delete)

***

### list()

> **list**(): `Promise`\<[`Result`](../../../../../../ts-res-ui-components/type-aliases/Result.md)\<readonly `string`[]\>\>

Lists every stored id.

#### Returns

`Promise`\<[`Result`](../../../../../../ts-res-ui-components/type-aliases/Result.md)\<readonly `string`[]\>\>

#### Implementation of

[`IPrivateKeyStorage`](../interfaces/IPrivateKeyStorage.md).[`list`](../interfaces/IPrivateKeyStorage.md#list)

***

### load()

> **load**(`id`): `Promise`\<[`Result`](../../../../../../ts-res-ui-components/type-aliases/Result.md)\<`CryptoKey`\>\>

Loads the private key stored under `id`, decrypting and re-importing it from
JWK.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `id` | `string` | Storage handle. |

#### Returns

`Promise`\<[`Result`](../../../../../../ts-res-ui-components/type-aliases/Result.md)\<`CryptoKey`\>\>

#### Implementation of

[`IPrivateKeyStorage`](../interfaces/IPrivateKeyStorage.md).[`load`](../interfaces/IPrivateKeyStorage.md#load)

***

### store()

> **store**(`id`, `key`): `Promise`\<[`Result`](../../../../../../ts-res-ui-components/type-aliases/Result.md)\<`string`\>\>

Stores `key` under `id` as an encrypted JWK file.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `id` | `string` | Storage handle. Must be a safe filename token (`[A-Za-z0-9._-]+`, not `.`/`..`). |
| `key` | `CryptoKey` | The extractable private `CryptoKey` to persist. |

#### Returns

`Promise`\<[`Result`](../../../../../../ts-res-ui-components/type-aliases/Result.md)\<`string`\>\>

#### Implementation of

[`IPrivateKeyStorage`](../interfaces/IPrivateKeyStorage.md).[`store`](../interfaces/IPrivateKeyStorage.md#store)

***

### create()

> `static` **create**(`params`): [`Result`](../../../../../../ts-res-ui-components/type-aliases/Result.md)\<`EncryptedFilePrivateKeyStorage`\>

Creates a new CryptoUtils.KeyStore.EncryptedFilePrivateKeyStorage.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `params` | [`IEncryptedFilePrivateKeyStorageCreateParams`](../interfaces/IEncryptedFilePrivateKeyStorageCreateParams.md) | [CryptoUtils.KeyStore.IEncryptedFilePrivateKeyStorageCreateParams](../interfaces/IEncryptedFilePrivateKeyStorageCreateParams.md). |

#### Returns

[`Result`](../../../../../../ts-res-ui-components/type-aliases/Result.md)\<`EncryptedFilePrivateKeyStorage`\>

`Success` with the new instance, or `Failure` if the encryption
key is the wrong size or the storage directory cannot be opened.
