[**@fgv/ts-chocolate**](../../../../README.md)

***

[@fgv/ts-chocolate](../../../../README.md) / [LibraryRuntime](../README.md) / IMaterializedLibraryParams

# Interface: IMaterializedLibraryParams\<TId, TEntity, TMaterialized, TQuerySpec\>

Defined in: [ts-chocolate/src/packlets/library-runtime/materializedLibrary.ts:67](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/library-runtime/materializedLibrary.ts#L67)

Parameters for constructing a MaterializedLibrary.

## Type Parameters

### TId

`TId` *extends* `string`

### TEntity

`TEntity`

### TMaterialized

`TMaterialized`

### TQuerySpec

`TQuerySpec` = `never`

## Properties

### converter()

> **converter**: (`entity`, `id`) => [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`TMaterialized`\>

Defined in: [ts-chocolate/src/packlets/library-runtime/materializedLibrary.ts:76](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/library-runtime/materializedLibrary.ts#L76)

Converter function: (entity, id) =\> Result\<TMaterialized\>

#### Parameters

##### entity

`TEntity`

##### id

`TId`

#### Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`TMaterialized`\>

***

### inner

> **inner**: [`IReadOnlyResultMap`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`TId`, `TEntity`\>

Defined in: [ts-chocolate/src/packlets/library-runtime/materializedLibrary.ts:71](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/library-runtime/materializedLibrary.ts#L71)

The underlying data library (SubLibraryBase or similar).

***

### logger?

> `optional` **logger**: [`ILogger`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)

Defined in: [ts-chocolate/src/packlets/library-runtime/materializedLibrary.ts:86](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/library-runtime/materializedLibrary.ts#L86)

Optional logger for conversion warnings.

***

### onConversionError?

> `optional` **onConversionError**: [`ConversionErrorHandling`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)

Defined in: [ts-chocolate/src/packlets/library-runtime/materializedLibrary.ts:92](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/library-runtime/materializedLibrary.ts#L92)

Error handling behavior for conversion failures during iteration.
Defaults to `'warn'` for chocolate libraries.

***

### orchestrator?

> `optional` **orchestrator**: [`IFindOrchestrator`](IFindOrchestrator.md)\<`TMaterialized`, `TQuerySpec`\>

Defined in: [ts-chocolate/src/packlets/library-runtime/materializedLibrary.ts:81](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/library-runtime/materializedLibrary.ts#L81)

Optional orchestrator for find/query support.
