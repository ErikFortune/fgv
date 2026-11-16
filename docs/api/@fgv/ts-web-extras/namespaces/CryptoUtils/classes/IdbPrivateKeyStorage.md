[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-web-extras](../../../README.md) / [CryptoUtils](../README.md) / IdbPrivateKeyStorage

# Class: IdbPrivateKeyStorage

[IPrivateKeyStorage](../../../../ts-extras-argon2/namespaces/CryptoUtils/namespaces/KeyStore/interfaces/IPrivateKeyStorage.md)
implementation backed by IndexedDB. Stores `CryptoKey` objects directly via
IndexedDB's structured-clone serialization — no JWK round-trip — so it works
with non-extractable keys.

`supportsNonExtractable` is `true`: because the `CryptoKey` is stored by
reference (structured clone) rather than exported, the keystore may generate
`extractable: false` keys for maximum security on browsers that support it.

The database is opened lazily on first use and cached. Each operation runs in
its own transaction, relying on IndexedDB's default serialization. Multi-tab
concurrency is a known limitation: two tabs writing the same id can race; this
implementation targets single-tab use.

## Implements

- [`IPrivateKeyStorage`](../../../../ts-extras-argon2/namespaces/CryptoUtils/namespaces/KeyStore/interfaces/IPrivateKeyStorage.md)

## Properties

| Property | Modifier | Type | Default value | Description |
| ------ | ------ | ------ | ------ | ------ |
| <a id="property-supportsnonextractable"></a> `supportsNonExtractable` | `public readonly` | `true` | `true` | `true` — IndexedDB stores `CryptoKey` objects directly, so non-extractable keys are supported. |

## Methods

### delete()

> **delete**(`id`): `Promise`\<[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<`string`\>\>

Deletes the entry stored under `id`. Missing ids fail, mirroring the
encrypted-file backend. The existence check and the delete run in separate
transactions (single-tab assumption).

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `id` | `string` | Storage handle to remove. |

#### Returns

`Promise`\<[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<`string`\>\>

#### Implementation of

[`IPrivateKeyStorage`](../../../../ts-extras-argon2/namespaces/CryptoUtils/namespaces/KeyStore/interfaces/IPrivateKeyStorage.md).[`delete`](../../../../ts-extras-argon2/namespaces/CryptoUtils/namespaces/KeyStore/interfaces/IPrivateKeyStorage.md#delete)

***

### list()

> **list**(): `Promise`\<[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<readonly `string`[]\>\>

Lists every stored id.

#### Returns

`Promise`\<[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<readonly `string`[]\>\>

#### Implementation of

[`IPrivateKeyStorage`](../../../../ts-extras-argon2/namespaces/CryptoUtils/namespaces/KeyStore/interfaces/IPrivateKeyStorage.md).[`list`](../../../../ts-extras-argon2/namespaces/CryptoUtils/namespaces/KeyStore/interfaces/IPrivateKeyStorage.md#list)

***

### load()

> **load**(`id`): `Promise`\<[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<`CryptoKey`\>\>

Loads the private key stored under `id`.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `id` | `string` | Storage handle to look up. |

#### Returns

`Promise`\<[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<`CryptoKey`\>\>

#### Implementation of

[`IPrivateKeyStorage`](../../../../ts-extras-argon2/namespaces/CryptoUtils/namespaces/KeyStore/interfaces/IPrivateKeyStorage.md).[`load`](../../../../ts-extras-argon2/namespaces/CryptoUtils/namespaces/KeyStore/interfaces/IPrivateKeyStorage.md#load)

***

### store()

> **store**(`id`, `key`): `Promise`\<[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<`string`\>\>

Stores `key` under `id`.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `id` | `string` | Storage handle to write under. |
| `key` | `CryptoKey` | The private `CryptoKey` to persist. |

#### Returns

`Promise`\<[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<`string`\>\>

#### Implementation of

[`IPrivateKeyStorage`](../../../../ts-extras-argon2/namespaces/CryptoUtils/namespaces/KeyStore/interfaces/IPrivateKeyStorage.md).[`store`](../../../../ts-extras-argon2/namespaces/CryptoUtils/namespaces/KeyStore/interfaces/IPrivateKeyStorage.md#store)

***

### create()

> `static` **create**(`params?`): [`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<`IdbPrivateKeyStorage`\>

Creates a new CryptoUtils.IdbPrivateKeyStorage.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `params?` | [`IIdbPrivateKeyStorageCreateParams`](../interfaces/IIdbPrivateKeyStorageCreateParams.md) | Optional [CryptoUtils.IIdbPrivateKeyStorageCreateParams](../interfaces/IIdbPrivateKeyStorageCreateParams.md). |

#### Returns

[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<`IdbPrivateKeyStorage`\>

`Success` with the new instance, or `Failure` if no IndexedDB
factory is available.
