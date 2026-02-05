[**@fgv/ts-chocolate**](../../../../../../README.md)

***

[@fgv/ts-chocolate](../../../../../../README.md) / [LibraryRuntime](../../../README.md) / [Indexers](../README.md) / IIndexer

# Interface: IIndexer\<TId, TConfig\>

Defined in: [ts-chocolate/src/packlets/library-runtime/indexers/model.ts:38](https://github.com/ErikFortune/fgv/blob/4be6f2d0ab84c3f4b78ffd3f9b262279d2ab7172/libraries/ts-chocolate/src/packlets/library-runtime/indexers/model.ts#L38)

Interface for a single indexer that can find entity IDs matching a query config.

Indexers are templated by:
- TId: The ID type for the entity (e.g., RecipeId)
- TConfig: The specific config type for this indexer

Indexers return only IDs - the orchestrator resolves IDs to entities.

## Type Parameters

### TId

`TId`

### TConfig

`TConfig`

## Methods

### find()

> **find**(`config`): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<readonly `TId`[]\> \| `undefined`

Defined in: [ts-chocolate/src/packlets/library-runtime/indexers/model.ts:47](https://github.com/ErikFortune/fgv/blob/4be6f2d0ab84c3f4b78ffd3f9b262279d2ab7172/libraries/ts-chocolate/src/packlets/library-runtime/indexers/model.ts#L47)

Finds IDs matching the given configuration.
Returns undefined if this indexer has no work to do (config not relevant).
Returns empty array if config is relevant but no matches found.

#### Parameters

##### config

`TConfig`

The indexer-specific configuration

#### Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<readonly `TId`[]\> \| `undefined`

Array of IDs, undefined if not applicable, or Failure on error

***

### invalidate()

> **invalidate**(): `void`

Defined in: [ts-chocolate/src/packlets/library-runtime/indexers/model.ts:53](https://github.com/ErikFortune/fgv/blob/4be6f2d0ab84c3f4b78ffd3f9b262279d2ab7172/libraries/ts-chocolate/src/packlets/library-runtime/indexers/model.ts#L53)

Invalidates any cached index data.
Called when underlying library data changes.

#### Returns

`void`

***

### warmUp()

> **warmUp**(): `void`

Defined in: [ts-chocolate/src/packlets/library-runtime/indexers/model.ts:59](https://github.com/ErikFortune/fgv/blob/4be6f2d0ab84c3f4b78ffd3f9b262279d2ab7172/libraries/ts-chocolate/src/packlets/library-runtime/indexers/model.ts#L59)

Pre-builds the index for efficient queries.
Called during warmup.

#### Returns

`void`
