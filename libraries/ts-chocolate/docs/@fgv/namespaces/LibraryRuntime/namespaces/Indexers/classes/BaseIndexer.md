[**@fgv/ts-chocolate**](../../../../../../README.md)

***

[@fgv/ts-chocolate](../../../../../../README.md) / [LibraryRuntime](../../../README.md) / [Indexers](../README.md) / BaseIndexer

# Abstract Class: BaseIndexer\<TId, TConfig\>

Defined in: [ts-chocolate/src/packlets/library-runtime/indexers/baseIndexer.ts:39](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/library-runtime/indexers/baseIndexer.ts#L39)

Abstract base class for indexers providing common functionality.

Subclasses must implement:
- `_buildIndex()`: Build the internal index structure
- `_findInternal(config)`: Execute the query against the index

## Extended by

- [`FillingRecipesByIngredientIndexer`](FillingRecipesByIngredientIndexer.md)
- [`FillingRecipesByTagIndexer`](FillingRecipesByTagIndexer.md)
- [`IngredientsByTagIndexer`](IngredientsByTagIndexer.md)
- [`FillingRecipesByChocolateTypeIndexer`](FillingRecipesByChocolateTypeIndexer.md)
- [`FillingRecipesByCategoryIndexer`](FillingRecipesByCategoryIndexer.md)

## Type Parameters

### TId

`TId`

### TConfig

`TConfig`

## Implements

- [`IIndexer`](../interfaces/IIndexer.md)\<`TId`, `TConfig`\>

## Constructors

### Constructor

> `protected` **new BaseIndexer**\<`TId`, `TConfig`\>(`library`): `BaseIndexer`\<`TId`, `TConfig`\>

Defined in: [ts-chocolate/src/packlets/library-runtime/indexers/baseIndexer.ts:61](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/library-runtime/indexers/baseIndexer.ts#L61)

Creates a new indexer with optional logging.

#### Parameters

##### library

[`ChocolateLibrary`](../../../../../../classes/ChocolateLibrary.md)

The library to index.

#### Returns

`BaseIndexer`\<`TId`, `TConfig`\>

## Properties

### \_isBuilt

> `protected` **\_isBuilt**: `boolean` = `false`

Defined in: [ts-chocolate/src/packlets/library-runtime/indexers/baseIndexer.ts:48](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/library-runtime/indexers/baseIndexer.ts#L48)

Flag indicating if the index has been built.

***

### library

> `readonly` **library**: [`ChocolateLibrary`](../../../../../../classes/ChocolateLibrary.md)

Defined in: [ts-chocolate/src/packlets/library-runtime/indexers/baseIndexer.ts:43](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/library-runtime/indexers/baseIndexer.ts#L43)

The chocolate library being indexed.

## Accessors

### \_indexerName

#### Get Signature

> **get** `protected` **\_indexerName**(): `string`

Defined in: [ts-chocolate/src/packlets/library-runtime/indexers/baseIndexer.ts:106](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/library-runtime/indexers/baseIndexer.ts#L106)

Returns the name of this indexer for logging purposes.
Subclasses should override to provide a meaningful name.

##### Returns

`string`

***

### \_logger

#### Get Signature

> **get** `protected` **\_logger**(): [`LogReporter`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`unknown`\>

Defined in: [ts-chocolate/src/packlets/library-runtime/indexers/baseIndexer.ts:53](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/library-runtime/indexers/baseIndexer.ts#L53)

Logger for reporting index operations.

##### Returns

[`LogReporter`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`unknown`\>

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

***

### \_buildIndex()

> `abstract` `protected` **\_buildIndex**(): `void`

Defined in: [ts-chocolate/src/packlets/library-runtime/indexers/baseIndexer.ts:114](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/library-runtime/indexers/baseIndexer.ts#L114)

Builds the internal index structure.
Called lazily on first query or explicitly via warmUp().

#### Returns

`void`

***

### \_clearIndex()

> `abstract` `protected` **\_clearIndex**(): `void`

Defined in: [ts-chocolate/src/packlets/library-runtime/indexers/baseIndexer.ts:120](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/library-runtime/indexers/baseIndexer.ts#L120)

Clears the internal index structure.
Called when invalidating the index.

#### Returns

`void`

***

### \_emptyResult()

> `protected` **\_emptyResult**(): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<readonly `TId`[]\>

Defined in: [ts-chocolate/src/packlets/library-runtime/indexers/baseIndexer.ts:156](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/library-runtime/indexers/baseIndexer.ts#L156)

Helper to return an empty success result.

#### Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<readonly `TId`[]\>

***

### \_ensureBuilt()

> `protected` **\_ensureBuilt**(): `void`

Defined in: [ts-chocolate/src/packlets/library-runtime/indexers/baseIndexer.ts:92](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/library-runtime/indexers/baseIndexer.ts#L92)

Ensures the index is built before querying.

#### Returns

`void`

***

### \_findInternal()

> `abstract` `protected` **\_findInternal**(`config`): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<readonly `TId`[]\>

Defined in: [ts-chocolate/src/packlets/library-runtime/indexers/baseIndexer.ts:127](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/library-runtime/indexers/baseIndexer.ts#L127)

Executes the query against the built index.

#### Parameters

##### config

`TConfig`

The query configuration

#### Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<readonly `TId`[]\>

Array of matching IDs

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

***

### find()

> **find**(`config`): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<readonly `TId`[]\>

Defined in: [ts-chocolate/src/packlets/library-runtime/indexers/baseIndexer.ts:70](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/library-runtime/indexers/baseIndexer.ts#L70)

Finds IDs matching the given configuration.

#### Parameters

##### config

`TConfig`

The indexer-specific configuration

#### Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<readonly `TId`[]\>

Array of IDs, or Failure on error

#### Implementation of

[`IIndexer`](../interfaces/IIndexer.md).[`find`](../interfaces/IIndexer.md#find)

***

### invalidate()

> **invalidate**(): `void`

Defined in: [ts-chocolate/src/packlets/library-runtime/indexers/baseIndexer.ts:79](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/library-runtime/indexers/baseIndexer.ts#L79)

Invalidates any cached index data.
Called when underlying library data changes.

#### Returns

`void`

#### Implementation of

[`IIndexer`](../interfaces/IIndexer.md).[`invalidate`](../interfaces/IIndexer.md#invalidate)

***

### warmUp()

> **warmUp**(): `void`

Defined in: [ts-chocolate/src/packlets/library-runtime/indexers/baseIndexer.ts:85](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/library-runtime/indexers/baseIndexer.ts#L85)

Pre-builds the index for efficient queries.
Called during warmup.

#### Returns

`void`

#### Implementation of

[`IIndexer`](../interfaces/IIndexer.md).[`warmUp`](../interfaces/IIndexer.md#warmup)
