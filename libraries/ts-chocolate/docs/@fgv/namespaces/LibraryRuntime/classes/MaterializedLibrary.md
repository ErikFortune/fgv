[**@fgv/ts-chocolate**](../../../../README.md)

***

[@fgv/ts-chocolate](../../../../README.md) / [LibraryRuntime](../README.md) / MaterializedLibrary

# Class: MaterializedLibrary\<TId, TEntity, TMaterialized, TQuerySpec\>

Defined in: [ts-chocolate/src/packlets/library-runtime/materializedLibrary.ts:106](https://github.com/ErikFortune/fgv/blob/4be6f2d0ab84c3f4b78ffd3f9b262279d2ab7172/libraries/ts-chocolate/src/packlets/library-runtime/materializedLibrary.ts#L106)

A read-only library providing lazily-materialized, cached runtime objects.
Wraps a data-layer library and converts entities to materialized objects on demand.

## Extends

- [`ReadOnlyConvertingResultMap`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`TId`, `TEntity`, `TMaterialized`\>

## Type Parameters

### TId

`TId` *extends* `string`

The ID type (branded string)

### TEntity

`TEntity`

The data-layer entity type

### TMaterialized

`TMaterialized`

The materialized runtime object type

### TQuerySpec

`TQuerySpec` = `never`

The query specification type (for find support)

## Constructors

### Constructor

> **new MaterializedLibrary**\<`TId`, `TEntity`, `TMaterialized`, `TQuerySpec`\>(`params`): `MaterializedLibrary`\<`TId`, `TEntity`, `TMaterialized`, `TQuerySpec`\>

Defined in: [ts-chocolate/src/packlets/library-runtime/materializedLibrary.ts:118](https://github.com/ErikFortune/fgv/blob/4be6f2d0ab84c3f4b78ffd3f9b262279d2ab7172/libraries/ts-chocolate/src/packlets/library-runtime/materializedLibrary.ts#L118)

Creates a new MaterializedLibrary.

#### Parameters

##### params

[`IMaterializedLibraryParams`](../interfaces/IMaterializedLibraryParams.md)\<`TId`, `TEntity`, `TMaterialized`, `TQuerySpec`\>

Parameters including inner library, converter, and optional orchestrator

#### Returns

`MaterializedLibrary`\<`TId`, `TEntity`, `TMaterialized`, `TQuerySpec`\>

#### Overrides

`Collections.ReadOnlyConvertingResultMap<TId, TEntity, TMaterialized>.constructor`

## Properties

### \_cache

> `protected` `readonly` **\_cache**: `Map`\<`TId`, `TMaterialized`\>

Defined in: ts-utils/dist/ts-utils.d.ts:4631

Cache of converted target values.

#### Inherited from

`Collections.ReadOnlyConvertingResultMap._cache`

***

### \_converter

> `protected` `readonly` **\_converter**: [`ConvertingResultMapValueConverter`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`TId`, `TEntity`, `TMaterialized`\>

Defined in: ts-utils/dist/ts-utils.d.ts:4627

The converter function to transform source values to target values.

#### Inherited from

`Collections.ReadOnlyConvertingResultMap._converter`

***

### \_inner

> `protected` `readonly` **\_inner**: [`IReadOnlyResultMap`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`TId`, `TEntity`\>

Defined in: ts-utils/dist/ts-utils.d.ts:4623

The inner map containing source values.

#### Inherited from

`Collections.ReadOnlyConvertingResultMap._inner`

***

### \_logger?

> `protected` `readonly` `optional` **\_logger**: [`ILogger`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)

Defined in: ts-utils/dist/ts-utils.d.ts:4639

Optional logger for warnings.

#### Inherited from

`Collections.ReadOnlyConvertingResultMap._logger`

***

### \_onConversionError

> `protected` `readonly` **\_onConversionError**: [`ConversionErrorHandling`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)

Defined in: ts-utils/dist/ts-utils.d.ts:4635

Error handling behavior for conversion failures during iteration.

#### Inherited from

`Collections.ReadOnlyConvertingResultMap._onConversionError`

## Accessors

### hasFindSupport

#### Get Signature

> **get** **hasFindSupport**(): `boolean`

Defined in: [ts-chocolate/src/packlets/library-runtime/materializedLibrary.ts:144](https://github.com/ErikFortune/fgv/blob/4be6f2d0ab84c3f4b78ffd3f9b262279d2ab7172/libraries/ts-chocolate/src/packlets/library-runtime/materializedLibrary.ts#L144)

Whether find is supported on this library.

##### Returns

`boolean`

***

### size

#### Get Signature

> **get** **size**(): `number`

Defined in: ts-utils/dist/ts-utils.d.ts:4654

The number of entries in the map.

##### Returns

`number`

#### Inherited from

`Collections.ReadOnlyConvertingResultMap.size`

## Methods

### \_clearCache()

> `protected` **\_clearCache**(): `void`

Defined in: ts-utils/dist/ts-utils.d.ts:4724

Clears all entries from the cache.

#### Returns

`void`

#### Inherited from

`Collections.ReadOnlyConvertingResultMap._clearCache`

***

### \_clearCacheEntry()

> `protected` **\_clearCacheEntry**(`key`): `void`

Defined in: ts-utils/dist/ts-utils.d.ts:4720

Clears a single entry from the cache.

#### Parameters

##### key

`TId`

The key to clear from the cache.

#### Returns

`void`

#### Inherited from

`Collections.ReadOnlyConvertingResultMap._clearCacheEntry`

***

### \_convertAndCache()

> `protected` **\_convertAndCache**(`key`, `src`): [`DetailedResult`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`TMaterialized`, [`ResultMapResultDetail`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\>

Defined in: ts-utils/dist/ts-utils.d.ts:4706

Converts a source value to a target value and caches the result.

#### Parameters

##### key

`TId`

The key of the value.

##### src

`TEntity`

The source value to convert.

#### Returns

[`DetailedResult`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`TMaterialized`, [`ResultMapResultDetail`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\>

`Success` with the converted value if successful, `Failure` otherwise.

#### Inherited from

`Collections.ReadOnlyConvertingResultMap._convertAndCache`

***

### \_getOrConvert()

> `protected` **\_getOrConvert**(`key`, `src`): `TMaterialized` \| `undefined`

Defined in: ts-utils/dist/ts-utils.d.ts:4715

Gets a cached value or converts and caches a source value.
Used by iterators. Handles conversion failures according to `_onConversionError`.

#### Parameters

##### key

`TId`

The key of the value.

##### src

`TEntity`

The source value to convert if not cached.

#### Returns

`TMaterialized` \| `undefined`

The converted value, or `undefined` if conversion failed.

#### Throws

Error if `_onConversionError` is `'fail'` and conversion fails.

#### Inherited from

`Collections.ReadOnlyConvertingResultMap._getOrConvert`

***

### \[iterator\]()

> **\[iterator\]**(): `IterableIterator`\<[`KeyValueEntry`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`TId`, `TMaterialized`\>\>

Defined in: ts-utils/dist/ts-utils.d.ts:4694

Gets an iterator over the map entries.

#### Returns

`IterableIterator`\<[`KeyValueEntry`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`TId`, `TMaterialized`\>\>

An iterator over the map entries.

#### Inherited from

`Collections.ReadOnlyConvertingResultMap.[iterator]`

***

### entries()

> **entries**(): `IterableIterator`\<[`KeyValueEntry`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`TId`, `TMaterialized`\>\>

Defined in: ts-utils/dist/ts-utils.d.ts:4673

Returns an iterator over the map entries with converted values.

#### Returns

`IterableIterator`\<[`KeyValueEntry`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`TId`, `TMaterialized`\>\>

An iterator over the map entries.

#### Inherited from

`Collections.ReadOnlyConvertingResultMap.entries`

***

### find()

> **find**(`spec`, `options?`): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<readonly `TMaterialized`[]\>

Defined in: [ts-chocolate/src/packlets/library-runtime/materializedLibrary.ts:134](https://github.com/ErikFortune/fgv/blob/4be6f2d0ab84c3f4b78ffd3f9b262279d2ab7172/libraries/ts-chocolate/src/packlets/library-runtime/materializedLibrary.ts#L134)

Finds materialized objects matching a query specification.

#### Parameters

##### spec

`TQuerySpec`

Query specification

##### options?

[`IFindOptions`](../namespaces/Indexers/interfaces/IFindOptions.md)

Optional find options (aggregation mode)

#### Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<readonly `TMaterialized`[]\>

Array of matching materialized objects

***

### forEach()

> **forEach**(`cb`, `thisArg?`): `void`

Defined in: ts-utils/dist/ts-utils.d.ts:4689

Calls a callback for each entry in the map with converted values.

#### Parameters

##### cb

[`ResultMapForEachCb`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`TId`, `TMaterialized`\>

The callback to call for each entry.

##### thisArg?

`unknown`

Optional `this` argument for the callback.

#### Returns

`void`

#### Inherited from

`Collections.ReadOnlyConvertingResultMap.forEach`

***

### get()

> **get**(`key`): [`DetailedResult`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`TMaterialized`, [`ResultMapResultDetail`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\>

Defined in: ts-utils/dist/ts-utils.d.ts:4662

Gets a converted value from the map by key.

#### Parameters

##### key

`TId`

The key to retrieve.

#### Returns

[`DetailedResult`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`TMaterialized`, [`ResultMapResultDetail`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\>

`Success` with the converted value and detail `exists` if the key was found,
`Failure` with detail `not-found` if the key was not found, or `Failure` with
detail `invalid-value` if conversion failed.

#### Inherited from

`Collections.ReadOnlyConvertingResultMap.get`

***

### getPreferred()

> **getPreferred**(`spec`): [`DetailedResult`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`TMaterialized`, [`ResultMapResultDetail`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\>

Defined in: [ts-chocolate/src/packlets/library-runtime/materializedLibrary.ts:157](https://github.com/ErikFortune/fgv/blob/4be6f2d0ab84c3f4b78ffd3f9b262279d2ab7172/libraries/ts-chocolate/src/packlets/library-runtime/materializedLibrary.ts#L157)

Gets the preferred (or first) materialized item from an IIdsWithPreferred.

#### Parameters

##### spec

[`IIdsWithPreferred`](../../Model/interfaces/IIdsWithPreferred.md)\<`TId`\>

The IIdsWithPreferred specification

#### Returns

[`DetailedResult`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`TMaterialized`, [`ResultMapResultDetail`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\>

DetailedResult with the preferred materialized item

***

### getPreferredRef()

> **getPreferredRef**(`spec`): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<\{ `id`: `TId`; `item`: `TMaterialized`; `notes?`: readonly [`ICategorizedNote`](../../Model/interfaces/ICategorizedNote.md)[]; \}\>

Defined in: [ts-chocolate/src/packlets/library-runtime/materializedLibrary.ts:213](https://github.com/ErikFortune/fgv/blob/4be6f2d0ab84c3f4b78ffd3f9b262279d2ab7172/libraries/ts-chocolate/src/packlets/library-runtime/materializedLibrary.ts#L213)

Gets the preferred (or first) materialized item from an IOptionsWithPreferred<IRefWithNotes>.
Only materializes the primary item - more efficient when alternates aren't needed.

#### Parameters

##### spec

[`IOptionsWithPreferred`](../../Model/interfaces/IOptionsWithPreferred.md)\<[`IRefWithNotes`](../../Model/interfaces/IRefWithNotes.md)\<`TId`\>, `TId`\>

The IOptionsWithPreferred specification with refs

#### Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<\{ `id`: `TId`; `item`: `TMaterialized`; `notes?`: readonly [`ICategorizedNote`](../../Model/interfaces/ICategorizedNote.md)[]; \}\>

Result with the preferred materialized item and its notes

***

### getRefsWithAlternates()

> **getRefsWithAlternates**(`spec`): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`IResolvedRefWithAlternates`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-chocolate/docs)\<`TId`, `TMaterialized`\>\>

Defined in: [ts-chocolate/src/packlets/library-runtime/materializedLibrary.ts:248](https://github.com/ErikFortune/fgv/blob/4be6f2d0ab84c3f4b78ffd3f9b262279d2ab7172/libraries/ts-chocolate/src/packlets/library-runtime/materializedLibrary.ts#L248)

Gets the preferred item and all alternates from an IOptionsWithPreferred containing IRefWithNotes.
Preserves notes from each reference.

#### Parameters

##### spec

[`IOptionsWithPreferred`](../../Model/interfaces/IOptionsWithPreferred.md)\<[`IRefWithNotes`](../../Model/interfaces/IRefWithNotes.md)\<`TId`\>, `TId`\>

The IOptionsWithPreferred specification with refs containing notes

#### Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`IResolvedRefWithAlternates`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-chocolate/docs)\<`TId`, `TMaterialized`\>\>

Result with resolved primary and alternates with their notes

***

### getWithAlternates()

> **getWithAlternates**(`spec`): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`IResolvedWithAlternates`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-chocolate/docs)\<`TMaterialized`, [`IIdsWithPreferred`](../../Model/interfaces/IIdsWithPreferred.md)\<`TId`\>\>\>

Defined in: [ts-chocolate/src/packlets/library-runtime/materializedLibrary.ts:177](https://github.com/ErikFortune/fgv/blob/4be6f2d0ab84c3f4b78ffd3f9b262279d2ab7172/libraries/ts-chocolate/src/packlets/library-runtime/materializedLibrary.ts#L177)

Gets the preferred item and all alternates from an IIdsWithPreferred.
Returns a structured result with the primary item, alternates array, and original entity.

#### Parameters

##### spec

[`IIdsWithPreferred`](../../Model/interfaces/IIdsWithPreferred.md)\<`TId`\>

The IIdsWithPreferred specification

#### Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`IResolvedWithAlternates`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-chocolate/docs)\<`TMaterialized`, [`IIdsWithPreferred`](../../Model/interfaces/IIdsWithPreferred.md)\<`TId`\>\>\>

Result with resolved primary, alternates, and entity

***

### has()

> **has**(`key`): `boolean`

Defined in: ts-utils/dist/ts-utils.d.ts:4668

Checks if the map contains a key.

#### Parameters

##### key

`TId`

The key to check.

#### Returns

`boolean`

`true` if the key exists, `false` otherwise.

#### Inherited from

`Collections.ReadOnlyConvertingResultMap.has`

***

### keys()

> **keys**(): `IterableIterator`\<`TId`\>

Defined in: ts-utils/dist/ts-utils.d.ts:4678

Returns an iterator over the map keys.

#### Returns

`IterableIterator`\<`TId`\>

An iterator over the map keys.

#### Inherited from

`Collections.ReadOnlyConvertingResultMap.keys`

***

### toReadOnly()

> **toReadOnly**(): [`IReadOnlyResultMap`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`TId`, `TMaterialized`\>

Defined in: ts-utils/dist/ts-utils.d.ts:4699

Gets a read-only version of this map.

#### Returns

[`IReadOnlyResultMap`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`TId`, `TMaterialized`\>

A read-only version of this map.

#### Inherited from

`Collections.ReadOnlyConvertingResultMap.toReadOnly`

***

### values()

> **values**(): `IterableIterator`\<`TMaterialized`\>

Defined in: ts-utils/dist/ts-utils.d.ts:4683

Returns an iterator over the converted map values.

#### Returns

`IterableIterator`\<`TMaterialized`\>

An iterator over the map values.

#### Inherited from

`Collections.ReadOnlyConvertingResultMap.values`

***

### create()

> `static` **create**\<`TK`, `TSRC`, `TTARGET`\>(`params`): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`ReadOnlyConvertingResultMap`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`TK`, `TSRC`, `TTARGET`\>\>

Defined in: ts-utils/dist/ts-utils.d.ts:4650

Creates a new [ReadOnlyConvertingResultMap](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs).

#### Type Parameters

##### TK

`TK` *extends* `string`

##### TSRC

`TSRC`

##### TTARGET

`TTARGET`

#### Parameters

##### params

[`IReadOnlyConvertingResultMapConstructorParams`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`TK`, `TSRC`, `TTARGET`\>

Parameters for constructing the map.

#### Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`ReadOnlyConvertingResultMap`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`TK`, `TSRC`, `TTARGET`\>\>

`Success` with the new map, or `Failure` with error details if an error occurred.

#### Inherited from

`Collections.ReadOnlyConvertingResultMap.create`
