[**@fgv/ts-chocolate**](../../../../README.md)

***

[@fgv/ts-chocolate](../../../../README.md) / [LibraryRuntime](../README.md) / IFindOrchestrator

# Interface: IFindOrchestrator\<TEntity, TSpec\>

Defined in: [ts-chocolate/src/packlets/library-runtime/validatingLibrary.ts:33](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/library-runtime/validatingLibrary.ts#L33)

Interface for an orchestrator that provides find functionality.

## Type Parameters

### TEntity

`TEntity`

### TSpec

`TSpec`

## Methods

### convertConfig()

> **convertConfig**(`json`): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`TSpec`\>

Defined in: [ts-chocolate/src/packlets/library-runtime/validatingLibrary.ts:47](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/library-runtime/validatingLibrary.ts#L47)

Converts a JSON query specification to a typed config.

#### Parameters

##### json

`unknown`

JSON object with query configuration

#### Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`TSpec`\>

Typed query spec

***

### find()

> **find**(`spec`, `options?`): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<readonly `TEntity`[]\>

Defined in: [ts-chocolate/src/packlets/library-runtime/validatingLibrary.ts:40](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/library-runtime/validatingLibrary.ts#L40)

Finds entities matching a query specification.

#### Parameters

##### spec

`TSpec`

Query specification

##### options?

[`IFindOptions`](../namespaces/Indexers/interfaces/IFindOptions.md)

Optional find options (aggregation mode)

#### Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<readonly `TEntity`[]\>

Array of matching entities

***

### invalidate()

> **invalidate**(): `void`

Defined in: [ts-chocolate/src/packlets/library-runtime/validatingLibrary.ts:52](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/library-runtime/validatingLibrary.ts#L52)

Invalidates all indexer caches.

#### Returns

`void`

***

### warmUp()

> **warmUp**(): `void`

Defined in: [ts-chocolate/src/packlets/library-runtime/validatingLibrary.ts:57](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/library-runtime/validatingLibrary.ts#L57)

Pre-warms all indexers.

#### Returns

`void`
