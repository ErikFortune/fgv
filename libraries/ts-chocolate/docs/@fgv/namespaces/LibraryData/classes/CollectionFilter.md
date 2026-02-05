[**@fgv/ts-chocolate**](../../../../README.md)

***

[@fgv/ts-chocolate](../../../../README.md) / [LibraryData](../README.md) / CollectionFilter

# Class: CollectionFilter\<T\>

Defined in: [ts-chocolate/src/packlets/library-data/collectionFilter.ts:66](https://github.com/ErikFortune/fgv/blob/d51b0929f72c9206f7fc8c54016db3ae08502b0f/libraries/ts-chocolate/src/packlets/library-data/collectionFilter.ts#L66)

Generic collection import filter.

## Type Parameters

### T

`T` *extends* `string`

## Constructors

### Constructor

> **new CollectionFilter**\<`T`\>(`params`): `CollectionFilter`\<`T`\>

Defined in: [ts-chocolate/src/packlets/library-data/collectionFilter.ts:77](https://github.com/ErikFortune/fgv/blob/d51b0929f72c9206f7fc8c54016db3ae08502b0f/libraries/ts-chocolate/src/packlets/library-data/collectionFilter.ts#L77)

Constructs a new collection filter.

#### Parameters

##### params

[`ICollectionFilterInitParams`](../interfaces/ICollectionFilterInitParams.md)\<`T`\>

Initialization [parameters](../interfaces/ICollectionFilterInitParams.md) for a
collection filter.

#### Returns

`CollectionFilter`\<`T`\>

## Properties

### errorOnInvalidName

> `readonly` **errorOnInvalidName**: `boolean`

Defined in: [ts-chocolate/src/packlets/library-data/collectionFilter.ts:70](https://github.com/ErikFortune/fgv/blob/d51b0929f72c9206f7fc8c54016db3ae08502b0f/libraries/ts-chocolate/src/packlets/library-data/collectionFilter.ts#L70)

***

### excluded

> `readonly` **excluded**: readonly [`FilterPattern`](../type-aliases/FilterPattern.md)[]

Defined in: [ts-chocolate/src/packlets/library-data/collectionFilter.ts:68](https://github.com/ErikFortune/fgv/blob/d51b0929f72c9206f7fc8c54016db3ae08502b0f/libraries/ts-chocolate/src/packlets/library-data/collectionFilter.ts#L68)

***

### included

> `readonly` **included**: readonly [`FilterPattern`](../type-aliases/FilterPattern.md)[] \| `undefined`

Defined in: [ts-chocolate/src/packlets/library-data/collectionFilter.ts:67](https://github.com/ErikFortune/fgv/blob/d51b0929f72c9206f7fc8c54016db3ae08502b0f/libraries/ts-chocolate/src/packlets/library-data/collectionFilter.ts#L67)

***

### nameConverter

> `readonly` **nameConverter**: [`Converter`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`T`, `unknown`\> \| [`Validator`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`T`, `unknown`\>

Defined in: [ts-chocolate/src/packlets/library-data/collectionFilter.ts:69](https://github.com/ErikFortune/fgv/blob/d51b0929f72c9206f7fc8c54016db3ae08502b0f/libraries/ts-chocolate/src/packlets/library-data/collectionFilter.ts#L69)

## Methods

### filterDirectory()

> **filterDirectory**(`dir`, `params?`): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<readonly [`IFilteredItem`](../interfaces/IFilteredItem.md)\<[`IFileTreeFileItem`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs)\<`string`\>, `T`\>[]\>

Defined in: [ts-chocolate/src/packlets/library-data/collectionFilter.ts:165](https://github.com/ErikFortune/fgv/blob/d51b0929f72c9206f7fc8c54016db3ae08502b0f/libraries/ts-chocolate/src/packlets/library-data/collectionFilter.ts#L165)

Filters a directory in a `FileTree` using this filter's configuration and optionally supplied parameters.

#### Parameters

##### dir

[`FileTreeItem`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs)

Directory to filter.

##### params?

[`IFilterDirectoryParams`](../interfaces/IFilterDirectoryParams.md)

Optional filtering parameters.

#### Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<readonly [`IFilteredItem`](../interfaces/IFilteredItem.md)\<[`IFileTreeFileItem`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs)\<`string`\>, `T`\>[]\>

***

### filterItems()

> **filterItems**\<`TITEM`\>(`items`, `extractName`): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<readonly [`IFilteredItem`](../interfaces/IFilteredItem.md)\<`TITEM`, `T`\>[]\>

Defined in: [ts-chocolate/src/packlets/library-data/collectionFilter.ts:131](https://github.com/ErikFortune/fgv/blob/d51b0929f72c9206f7fc8c54016db3ae08502b0f/libraries/ts-chocolate/src/packlets/library-data/collectionFilter.ts#L131)

Filters items of an arbitrary type based on their extracted names.

#### Type Parameters

##### TITEM

`TITEM`

#### Parameters

##### items

readonly `TITEM`[]

Items to filter.

##### extractName

(`item`) => [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`string`\>

Function to extract the name from an item.

#### Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<readonly [`IFilteredItem`](../interfaces/IFilteredItem.md)\<`TITEM`, `T`\>[]\>

`Success` with the [filtered items](../interfaces/IFilteredItem.md) or `Failure` with error messages.

***

### getFileTreeItemName()

> `static` **getFileTreeItemName**(`item`, `prefix?`): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`string`\>

Defined in: [ts-chocolate/src/packlets/library-data/collectionFilter.ts:200](https://github.com/ErikFortune/fgv/blob/d51b0929f72c9206f7fc8c54016db3ae08502b0f/libraries/ts-chocolate/src/packlets/library-data/collectionFilter.ts#L200)

#### Parameters

##### item

[`FileTreeItem`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs)

##### prefix?

`string`

#### Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`string`\>
