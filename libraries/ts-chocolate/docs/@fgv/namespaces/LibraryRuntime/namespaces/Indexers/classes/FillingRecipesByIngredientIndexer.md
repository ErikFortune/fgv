[**@fgv/ts-chocolate**](../../../../../../README.md)

***

[@fgv/ts-chocolate](../../../../../../README.md) / [LibraryRuntime](../../../README.md) / [Indexers](../README.md) / FillingRecipesByIngredientIndexer

# Class: FillingRecipesByIngredientIndexer

Defined in: [ts-chocolate/src/packlets/library-runtime/indexers/fillingRecipesByIngredientIndexer.ts:118](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/library-runtime/indexers/fillingRecipesByIngredientIndexer.ts#L118)

Indexer that finds recipes using a specific ingredient.

Supports filtering by:
- Primary usage only
- Alternate usage only
- Any usage

## Extends

- [`BaseIndexer`](BaseIndexer.md)\<[`FillingId`](../../../../../../type-aliases/FillingId.md), [`IFillingRecipesByIngredientConfig`](../interfaces/IFillingRecipesByIngredientConfig.md)\>

## Constructors

### Constructor

> **new FillingRecipesByIngredientIndexer**(`library`): `FillingRecipesByIngredientIndexer`

Defined in: [ts-chocolate/src/packlets/library-runtime/indexers/fillingRecipesByIngredientIndexer.ts:129](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/library-runtime/indexers/fillingRecipesByIngredientIndexer.ts#L129)

Creates a new FillingRecipesByIngredientIndexer.

#### Parameters

##### library

[`ChocolateLibrary`](../../../../../../classes/ChocolateLibrary.md)

The chocolate library to index

#### Returns

`FillingRecipesByIngredientIndexer`

#### Overrides

[`BaseIndexer`](BaseIndexer.md).[`constructor`](BaseIndexer.md#constructor)

## Properties

### \_isBuilt

> `protected` **\_isBuilt**: `boolean` = `false`

Defined in: [ts-chocolate/src/packlets/library-runtime/indexers/baseIndexer.ts:48](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/library-runtime/indexers/baseIndexer.ts#L48)

Flag indicating if the index has been built.

#### Inherited from

[`BaseIndexer`](BaseIndexer.md).[`_isBuilt`](BaseIndexer.md#_isbuilt)

***

### library

> `readonly` **library**: [`ChocolateLibrary`](../../../../../../classes/ChocolateLibrary.md)

Defined in: [ts-chocolate/src/packlets/library-runtime/indexers/baseIndexer.ts:43](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/library-runtime/indexers/baseIndexer.ts#L43)

The chocolate library being indexed.

#### Inherited from

[`BaseIndexer`](BaseIndexer.md).[`library`](BaseIndexer.md#library)

## Accessors

### \_indexerName

#### Get Signature

> **get** `protected` **\_indexerName**(): `string`

Defined in: [ts-chocolate/src/packlets/library-runtime/indexers/baseIndexer.ts:106](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/library-runtime/indexers/baseIndexer.ts#L106)

Returns the name of this indexer for logging purposes.
Subclasses should override to provide a meaningful name.

##### Returns

`string`

#### Inherited from

[`BaseIndexer`](BaseIndexer.md).[`_indexerName`](BaseIndexer.md#_indexername)

***

### \_logger

#### Get Signature

> **get** `protected` **\_logger**(): [`LogReporter`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`unknown`\>

Defined in: [ts-chocolate/src/packlets/library-runtime/indexers/baseIndexer.ts:53](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/library-runtime/indexers/baseIndexer.ts#L53)

Logger for reporting index operations.

##### Returns

[`LogReporter`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`unknown`\>

#### Inherited from

[`BaseIndexer`](BaseIndexer.md).[`_logger`](BaseIndexer.md#_logger)

## Methods

### \_addToSetIndex()

> `protected` **\_addToSetIndex**\<`TKey`, `TValue`\>(`index`, `key`, `value`): `void`

Defined in: [ts-chocolate/src/packlets/library-runtime/indexers/baseIndexer.ts:136](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/library-runtime/indexers/baseIndexer.ts#L136)

Helper to add a value to a Set-based index.

#### Type Parameters

##### TKey

`TKey`

##### TValue

`TValue`

#### Parameters

##### index

`Map`\<`TKey`, `Set`\<`TValue`\>\>

##### key

`TKey`

##### value

`TValue`

#### Returns

`void`

#### Inherited from

[`BaseIndexer`](BaseIndexer.md).[`_addToSetIndex`](BaseIndexer.md#_addtosetindex)

***

### \_buildIndex()

> `protected` **\_buildIndex**(): `void`

Defined in: [ts-chocolate/src/packlets/library-runtime/indexers/fillingRecipesByIngredientIndexer.ts:134](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/library-runtime/indexers/fillingRecipesByIngredientIndexer.ts#L134)

Builds the internal index structure.
Called lazily on first query or explicitly via warmUp().

#### Returns

`void`

#### Overrides

[`BaseIndexer`](BaseIndexer.md).[`_buildIndex`](BaseIndexer.md#_buildindex)

***

### \_clearIndex()

> `protected` **\_clearIndex**(): `void`

Defined in: [ts-chocolate/src/packlets/library-runtime/indexers/fillingRecipesByIngredientIndexer.ts:158](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/library-runtime/indexers/fillingRecipesByIngredientIndexer.ts#L158)

Clears the internal index structure.
Called when invalidating the index.

#### Returns

`void`

#### Overrides

[`BaseIndexer`](BaseIndexer.md).[`_clearIndex`](BaseIndexer.md#_clearindex)

***

### \_emptyResult()

> `protected` **\_emptyResult**(): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<readonly [`FillingId`](../../../../../../type-aliases/FillingId.md)[]\>

Defined in: [ts-chocolate/src/packlets/library-runtime/indexers/baseIndexer.ts:156](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/library-runtime/indexers/baseIndexer.ts#L156)

Helper to return an empty success result.

#### Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<readonly [`FillingId`](../../../../../../type-aliases/FillingId.md)[]\>

#### Inherited from

[`BaseIndexer`](BaseIndexer.md).[`_emptyResult`](BaseIndexer.md#_emptyresult)

***

### \_ensureBuilt()

> `protected` **\_ensureBuilt**(): `void`

Defined in: [ts-chocolate/src/packlets/library-runtime/indexers/baseIndexer.ts:92](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/library-runtime/indexers/baseIndexer.ts#L92)

Ensures the index is built before querying.

#### Returns

`void`

#### Inherited from

[`BaseIndexer`](BaseIndexer.md).[`_ensureBuilt`](BaseIndexer.md#_ensurebuilt)

***

### \_findInternal()

> `protected` **\_findInternal**(`config`): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<readonly [`FillingId`](../../../../../../type-aliases/FillingId.md)[]\>

Defined in: [ts-chocolate/src/packlets/library-runtime/indexers/fillingRecipesByIngredientIndexer.ts:163](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/library-runtime/indexers/fillingRecipesByIngredientIndexer.ts#L163)

Executes the query against the built index.

#### Parameters

##### config

[`IFillingRecipesByIngredientConfig`](../interfaces/IFillingRecipesByIngredientConfig.md)

The query configuration

#### Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<readonly [`FillingId`](../../../../../../type-aliases/FillingId.md)[]\>

Array of matching IDs

#### Overrides

[`BaseIndexer`](BaseIndexer.md).[`_findInternal`](BaseIndexer.md#_findinternal)

***

### \_getFromSetIndex()

> `protected` **\_getFromSetIndex**\<`TKey`, `TValue`\>(`index`, `key`): readonly `TValue`[]

Defined in: [ts-chocolate/src/packlets/library-runtime/indexers/baseIndexer.ts:148](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/library-runtime/indexers/baseIndexer.ts#L148)

Helper to get values from a Set-based index as an array.

#### Type Parameters

##### TKey

`TKey`

##### TValue

`TValue`

#### Parameters

##### index

`Map`\<`TKey`, `Set`\<`TValue`\>\>

##### key

`TKey`

#### Returns

readonly `TValue`[]

#### Inherited from

[`BaseIndexer`](BaseIndexer.md).[`_getFromSetIndex`](BaseIndexer.md#_getfromsetindex)

***

### find()

> **find**(`config`): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<readonly [`FillingId`](../../../../../../type-aliases/FillingId.md)[]\>

Defined in: [ts-chocolate/src/packlets/library-runtime/indexers/baseIndexer.ts:70](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/library-runtime/indexers/baseIndexer.ts#L70)

Finds IDs matching the given configuration.

#### Parameters

##### config

[`IFillingRecipesByIngredientConfig`](../interfaces/IFillingRecipesByIngredientConfig.md)

The indexer-specific configuration

#### Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<readonly [`FillingId`](../../../../../../type-aliases/FillingId.md)[]\>

Array of IDs, or Failure on error

#### Inherited from

[`BaseIndexer`](BaseIndexer.md).[`find`](BaseIndexer.md#find)

***

### invalidate()

> **invalidate**(): `void`

Defined in: [ts-chocolate/src/packlets/library-runtime/indexers/baseIndexer.ts:79](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/library-runtime/indexers/baseIndexer.ts#L79)

Invalidates any cached index data.
Called when underlying library data changes.

#### Returns

`void`

#### Inherited from

[`BaseIndexer`](BaseIndexer.md).[`invalidate`](BaseIndexer.md#invalidate)

***

### warmUp()

> **warmUp**(): `void`

Defined in: [ts-chocolate/src/packlets/library-runtime/indexers/baseIndexer.ts:85](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/library-runtime/indexers/baseIndexer.ts#L85)

Pre-builds the index for efficient queries.
Called during warmup.

#### Returns

`void`

#### Inherited from

[`BaseIndexer`](BaseIndexer.md).[`warmUp`](BaseIndexer.md#warmup)
