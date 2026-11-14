[**@fgv Monorepo API Documentation**](../../../README.md)

***

[@fgv Monorepo API Documentation](../../../README.md) / [@fgv/ts-prompt-assist](../README.md) / FileTreePromptStore

# Class: FileTreePromptStore

Read-only FileTree-backed [IPromptStore](../interfaces/IPromptStore.md). v0.1 implements `get`,
`list`, `getBindings`, and `getQualifierConfig`; write methods and
`watch` are intentionally undefined (design §4.6 + OQ-3).

## Remarks

Generic over `TQualifierNames extends string` (B-3). When the optional
`qualifierNameConverter` is supplied to `create`, the store's YAML
loader narrows candidate `conditions` keys to that union at convert
time. Default `TQualifierNames = string` keeps existing call sites
compiling unchanged.

## Implements

- [`IPromptStore`](../interfaces/IPromptStore.md)

## Methods

### get()

> **get**(`scope`, `id`): `Promise`\<[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<[`IStoredPromptRecord`](../interfaces/IStoredPromptRecord.md)\<`string`\> \| `undefined`\>\>

Returns the record at `(scope, id)` or `undefined` if none exists.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `scope` | [`ScopeKey`](../type-aliases/ScopeKey.md) |
| `id` | [`PromptId`](../type-aliases/PromptId.md) |

#### Returns

`Promise`\<[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<[`IStoredPromptRecord`](../interfaces/IStoredPromptRecord.md)\<`string`\> \| `undefined`\>\>

#### Implementation of

[`IPromptStore`](../interfaces/IPromptStore.md).[`get`](../interfaces/IPromptStore.md#get)

***

### getBindings()

> **getBindings**(`scope`): `Promise`\<[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<[`IScopeSlotBindingsRecord`](../interfaces/IScopeSlotBindingsRecord.md) \| `undefined`\>\>

Returns the scope-level `_bindings.yaml` record (or `undefined` if absent).

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `scope` | [`ScopeKey`](../type-aliases/ScopeKey.md) |

#### Returns

`Promise`\<[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<[`IScopeSlotBindingsRecord`](../interfaces/IScopeSlotBindingsRecord.md) \| `undefined`\>\>

#### Implementation of

[`IPromptStore`](../interfaces/IPromptStore.md).[`getBindings`](../interfaces/IPromptStore.md#getbindings)

***

### getQualifierConfig()

> **getQualifierConfig**(): `Promise`\<[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<readonly [`IQualifierDecl`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-res/docs)[] \| `undefined`\>\>

Returns the ts-res qualifier declarations carried by the store, or
`undefined` if the store does not publish qualifier config (consumer
supplies it directly to `PromptLibrary.create`).

#### Returns

`Promise`\<[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<readonly [`IQualifierDecl`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-res/docs)[] \| `undefined`\>\>

#### Implementation of

[`IPromptStore`](../interfaces/IPromptStore.md).[`getQualifierConfig`](../interfaces/IPromptStore.md#getqualifierconfig)

***

### list()

> **list**(`filter?`): `Promise`\<[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<readonly [`IStoredPromptRecord`](../interfaces/IStoredPromptRecord.md)\<`string`\>[]\>\>

Returns all records, optionally filtered.

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `filter?` | [`IPromptStoreListFilter`](../interfaces/IPromptStoreListFilter.md) |

#### Returns

`Promise`\<[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<readonly [`IStoredPromptRecord`](../interfaces/IStoredPromptRecord.md)\<`string`\>[]\>\>

#### Implementation of

[`IPromptStore`](../interfaces/IPromptStore.md).[`list`](../interfaces/IPromptStore.md#list)

***

### create()

> `static` **create**\<`TQualifierNames`\>(`params`): `Promise`\<[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<`FileTreePromptStore`\>\>

Family-convention factory.

#### Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| <a id="type-parameter-tqualifiernames"></a> `TQualifierNames` *extends* `string` | `string` |

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `params` | [`IFileTreePromptStoreCreateParams`](../interfaces/IFileTreePromptStoreCreateParams.md)\<`TQualifierNames`\> |

#### Returns

`Promise`\<[`Result`](../../ts-res-ui-components/type-aliases/Result.md)\<`FileTreePromptStore`\>\>

#### Remarks

The signature is `Promise<Result<...>>` for forward compatibility
with FsTree adapters whose construction may do real I/O. The v0.1
FileTree backend is in-memory or already-loaded FsTree, so this
factory resolves synchronously via `Promise.resolve`.

The optional `qualifierNameConverter` on `params` threads through
to the YAML loader (B-3) — a YAML candidate with a typo'd axis
name fails at convert time when the consumer's literal-string
union doesn't include the typo. Default-string keeps existing call
sites compiling unchanged.
