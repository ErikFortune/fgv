[**@fgv/ts-chocolate**](../../../../README.md)

***

[@fgv/ts-chocolate](../../../../README.md) / [LibraryRuntime](../README.md) / IReadOnlyValidatingLibrary

# Interface: IReadOnlyValidatingLibrary\<TK, TV, TSpec\>

Defined in: [ts-chocolate/src/packlets/library-runtime/validatingLibrary.ts:65](https://github.com/ErikFortune/fgv/blob/d51b0929f72c9206f7fc8c54016db3ae08502b0f/libraries/ts-chocolate/src/packlets/library-runtime/validatingLibrary.ts#L65)

Read-only interface for ValidatingLibrary.
Extends IReadOnlyValidatingResultMap with a find method for query-based search.

## Extends

- [`IReadOnlyValidatingResultMap`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`TK`, `TV`\>

## Type Parameters

### TK

`TK` *extends* `string`

### TV

`TV`

### TSpec

`TSpec`

## Properties

### size

> `readonly` **size**: `number`

Defined in: ts-utils/dist/ts-utils.d.ts:2941

#### Inherited from

`Collections.IReadOnlyValidatingResultMap.size`

***

### validating

> `readonly` **validating**: [`IReadOnlyResultMapValidator`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`TK`, `TV`\>

Defined in: ts-utils/dist/ts-utils.d.ts:3020

#### Inherited from

`Collections.IReadOnlyValidatingResultMap.validating`

## Methods

### \[iterator\]()

> **\[iterator\]**(): `IterableIterator`\<[`KeyValueEntry`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`TK`, `TV`\>\>

Defined in: ts-utils/dist/ts-utils.d.ts:2970

Gets an iterator over the map entries.

#### Returns

`IterableIterator`\<[`KeyValueEntry`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`TK`, `TV`\>\>

An iterator over the map entries.

#### Inherited from

`Collections.IReadOnlyValidatingResultMap.[iterator]`

***

### entries()

> **entries**(): `IterableIterator`\<[`KeyValueEntry`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`TK`, `TV`\>\>

Defined in: ts-utils/dist/ts-utils.d.ts:2945

#### Returns

`IterableIterator`\<[`KeyValueEntry`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`TK`, `TV`\>\>

#### Inherited from

`Collections.IReadOnlyValidatingResultMap.entries`

***

### find()

> **find**(`spec`, `options?`): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<readonly `TV`[]\>

Defined in: [ts-chocolate/src/packlets/library-runtime/validatingLibrary.ts:73](https://github.com/ErikFortune/fgv/blob/d51b0929f72c9206f7fc8c54016db3ae08502b0f/libraries/ts-chocolate/src/packlets/library-runtime/validatingLibrary.ts#L73)

Finds entities matching a query specification.

#### Parameters

##### spec

`TSpec`

Query specification

##### options?

[`IFindOptions`](../namespaces/Indexers/interfaces/IFindOptions.md)

Optional find options (aggregation mode)

#### Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<readonly `TV`[]\>

Array of matching entities

***

### forEach()

> **forEach**(`cb`, `arg?`): `void`

Defined in: ts-utils/dist/ts-utils.d.ts:2949

#### Parameters

##### cb

[`ResultMapForEachCb`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)

##### arg?

`unknown`

#### Returns

`void`

#### Inherited from

`Collections.IReadOnlyValidatingResultMap.forEach`

***

### get()

> **get**(`key`): [`DetailedResult`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`TV`, [`ResultMapResultDetail`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\>

Defined in: ts-utils/dist/ts-utils.d.ts:2953

#### Parameters

##### key

`TK`

#### Returns

[`DetailedResult`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`TV`, [`ResultMapResultDetail`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\>

#### Inherited from

`Collections.IReadOnlyValidatingResultMap.get`

***

### has()

> **has**(`key`): `boolean`

Defined in: ts-utils/dist/ts-utils.d.ts:2957

#### Parameters

##### key

`TK`

#### Returns

`boolean`

#### Inherited from

`Collections.IReadOnlyValidatingResultMap.has`

***

### keys()

> **keys**(): `IterableIterator`\<`TK`\>

Defined in: ts-utils/dist/ts-utils.d.ts:2961

#### Returns

`IterableIterator`\<`TK`\>

#### Inherited from

`Collections.IReadOnlyValidatingResultMap.keys`

***

### values()

> **values**(): `IterableIterator`\<`TV`\>

Defined in: ts-utils/dist/ts-utils.d.ts:2965

#### Returns

`IterableIterator`\<`TV`\>

#### Inherited from

`Collections.IReadOnlyValidatingResultMap.values`
