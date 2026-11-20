[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-prompt-assist](../README.md) / IPromptStore

# Interface: IPromptStore

Storage adapter contract. v0.1 ships a read-only `FileTreePromptStore`;
SQL / Mongo adapters drop in later.

Optional write surface (`put` / `putBindings` / `delete`) and the change-
notification surface (`watch`) are left undefined on the v0.1 FileTree
adapter per OQ-3.

## Methods

### delete()?

> `optional` **delete**(`scope`, `id`): `Promise`\<[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<[`PromptId`](../type-aliases/PromptId.md)\>\>

Optional delete surface. v0.1 `FileTreePromptStore` leaves this undefined.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `scope` | [`ScopeKey`](../type-aliases/ScopeKey.md) |
| `id` | [`PromptId`](../type-aliases/PromptId.md) |

#### Returns

`Promise`\<[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<[`PromptId`](../type-aliases/PromptId.md)\>\>

***

### get()

> **get**(`scope`, `id`): `Promise`\<[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<[`IStoredPromptRecord`](IStoredPromptRecord.md)\<`string`\> \| `undefined`\>\>

Returns the record at `(scope, id)` or `undefined` if none exists.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `scope` | [`ScopeKey`](../type-aliases/ScopeKey.md) |
| `id` | [`PromptId`](../type-aliases/PromptId.md) |

#### Returns

`Promise`\<[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<[`IStoredPromptRecord`](IStoredPromptRecord.md)\<`string`\> \| `undefined`\>\>

***

### getBindings()

> **getBindings**(`scope`): `Promise`\<[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<[`IScopeSlotBindingsRecord`](IScopeSlotBindingsRecord.md) \| `undefined`\>\>

Returns the scope-level `_bindings.yaml` record (or `undefined` if absent).

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `scope` | [`ScopeKey`](../type-aliases/ScopeKey.md) |

#### Returns

`Promise`\<[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<[`IScopeSlotBindingsRecord`](IScopeSlotBindingsRecord.md) \| `undefined`\>\>

***

### getQualifierConfig()

> **getQualifierConfig**(): `Promise`\<[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<readonly [`IQualifierDecl`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-res/docs)[] \| `undefined`\>\>

Returns the ts-res qualifier declarations carried by the store, or
`undefined` if the store does not publish qualifier config (consumer
supplies it directly to `PromptLibrary.create`).

#### Returns

`Promise`\<[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<readonly [`IQualifierDecl`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-res/docs)[] \| `undefined`\>\>

***

### list()

> **list**(`filter?`): `Promise`\<[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<readonly [`IStoredPromptRecord`](IStoredPromptRecord.md)\<`string`\>[]\>\>

Returns all records, optionally filtered.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `filter?` | [`IPromptStoreListFilter`](IPromptStoreListFilter.md) |

#### Returns

`Promise`\<[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<readonly [`IStoredPromptRecord`](IStoredPromptRecord.md)\<`string`\>[]\>\>

***

### put()?

> `optional` **put**(`record`): `Promise`\<[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<[`IStoredPromptRecord`](IStoredPromptRecord.md)\<`string`\>\>\>

Optional write surface. v0.1 `FileTreePromptStore` leaves this undefined.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `record` | [`IStoredPromptRecord`](IStoredPromptRecord.md) |

#### Returns

`Promise`\<[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<[`IStoredPromptRecord`](IStoredPromptRecord.md)\<`string`\>\>\>

***

### putBindings()?

> `optional` **putBindings**(`record`): `Promise`\<[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<[`IScopeSlotBindingsRecord`](IScopeSlotBindingsRecord.md)\>\>

Optional bindings-write surface. v0.1 `FileTreePromptStore` leaves this undefined.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `record` | [`IScopeSlotBindingsRecord`](IScopeSlotBindingsRecord.md) |

#### Returns

`Promise`\<[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<[`IScopeSlotBindingsRecord`](IScopeSlotBindingsRecord.md)\>\>

***

### watch()?

> `optional` **watch**(`handler`): [`IDisposable`](IDisposable.md)

Optional change-notification surface (per OQ-3). No v0.1 adapter implements this.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `handler` | (`event`) => `void` |

#### Returns

[`IDisposable`](IDisposable.md)
