[**@fgv Monorepo API Documentation**](../../../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../../../README.md) / [@fgv/ts-web-extras-argon2](../../../../../README.md) / [CryptoUtils](../../../README.md) / [KeyStore](../README.md) / IPrivateKeyStorage

# Interface: IPrivateKeyStorage

Pluggable backend that persists raw asymmetric private keys outside of the
encrypted keystore vault. Concrete implementations:
- [CryptoUtils.KeyStore.EncryptedFilePrivateKeyStorage](../classes/EncryptedFilePrivateKeyStorage.md) in
  `@fgv/ts-extras` — directory-on-disk, AES-256-GCM-encrypted JWK per key
  (Node; `supportsNonExtractable: false`).
- `IdbPrivateKeyStorage` in `@fgv/ts-web-extras` — IndexedDB-backed, stores
  `CryptoKey` objects directly (browser; `supportsNonExtractable: true`).

The keystore writes storage-first: a private key is always stored here
before the corresponding public-key vault entry is committed. Conversely,
deletes hit the vault first and then this storage best-effort. As a result,
crashes or skipped saves can leave orphaned blobs here; callers are expected
to reconcile via [CryptoUtils.KeyStore.IPrivateKeyStorage.list](#list) cross-referenced
against the keystore's asymmetric entries.

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="property-supportsnonextractable"></a> `supportsNonExtractable` | `readonly` | `boolean` | Whether keys generated for this backend may be marked `extractable: false`. `true` on backends that store `CryptoKey` objects directly (e.g. IndexedDB). `false` on backends that must round-trip via JWK (e.g. encrypted-file backends). |

## Methods

### delete()

> **delete**(`id`): `Promise`\<[`Result`](../../../../../../ts-res-ui-components/type-aliases/Result.md)\<`string`\>\>

Deletes the entry stored under `id`. Returns the deleted `id` on
success so the call can compose into a Result chain.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `id` | `string` | Storage handle to remove. |

#### Returns

`Promise`\<[`Result`](../../../../../../ts-res-ui-components/type-aliases/Result.md)\<`string`\>\>

***

### list()

> **list**(): `Promise`\<[`Result`](../../../../../../ts-res-ui-components/type-aliases/Result.md)\<readonly `string`[]\>\>

Lists every `id` currently held by the backend. Used by consumers to
garbage-collect orphans left by crashes or aborted sessions; the
keystore itself does not invoke this automatically.

#### Returns

`Promise`\<[`Result`](../../../../../../ts-res-ui-components/type-aliases/Result.md)\<readonly `string`[]\>\>

***

### load()

> **load**(`id`): `Promise`\<[`Result`](../../../../../../ts-res-ui-components/type-aliases/Result.md)\<`CryptoKey`\>\>

Loads the private key previously stored under `id`.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `id` | `string` | Storage handle to look up. |

#### Returns

`Promise`\<[`Result`](../../../../../../ts-res-ui-components/type-aliases/Result.md)\<`CryptoKey`\>\>

***

### store()

> **store**(`id`, `key`): `Promise`\<[`Result`](../../../../../../ts-res-ui-components/type-aliases/Result.md)\<`string`\>\>

Stores `key` under `id`. Returns the stored `id` on success so the
call can compose into a Result chain.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `id` | `string` | Storage handle to write under. |
| `key` | `CryptoKey` | The private `CryptoKey` to persist. |

#### Returns

`Promise`\<[`Result`](../../../../../../ts-res-ui-components/type-aliases/Result.md)\<`string`\>\>
