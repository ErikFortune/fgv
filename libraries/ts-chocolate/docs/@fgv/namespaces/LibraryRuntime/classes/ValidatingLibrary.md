[**@fgv/ts-chocolate**](../../../../README.md)

***

[@fgv/ts-chocolate](../../../../README.md) / [LibraryRuntime](../README.md) / ValidatingLibrary

# Class: ValidatingLibrary\<TK, TV, TSpec, TOrchEntity\>

Defined in: [ts-chocolate/src/packlets/library-runtime/validatingLibrary.ts:104](https://github.com/ErikFortune/fgv/blob/4be6f2d0ab84c3f4b78ffd3f9b262279d2ab7172/libraries/ts-chocolate/src/packlets/library-runtime/validatingLibrary.ts#L104)

A ValidatingResultMap with integrated find functionality.
Combines map-based access (get, has, values) with query-based search (find).

This provides a symmetric API where both `library.get(id)` and
`library.find({ byTag: {...} })` work together naturally.

## Extends

- [`ValidatingResultMap`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`TK`, `TV`\>

## Type Parameters

### TK

`TK` *extends* `string`

The key type (branded string ID)

### TV

`TV`

The value type stored in the map

### TSpec

`TSpec`

The query specification type

### TOrchEntity

`TOrchEntity` = `TV`

The orchestrator's entity type (defaults to TV, may be a supertype)

## Implements

- [`IReadOnlyValidatingLibrary`](../interfaces/IReadOnlyValidatingLibrary.md)\<`TK`, `TV`, `TSpec`\>

## Constructors

### Constructor

> **new ValidatingLibrary**\<`TK`, `TV`, `TSpec`, `TOrchEntity`\>(`params`): `ValidatingLibrary`\<`TK`, `TV`, `TSpec`, `TOrchEntity`\>

Defined in: [ts-chocolate/src/packlets/library-runtime/validatingLibrary.ts:114](https://github.com/ErikFortune/fgv/blob/4be6f2d0ab84c3f4b78ffd3f9b262279d2ab7172/libraries/ts-chocolate/src/packlets/library-runtime/validatingLibrary.ts#L114)

Creates a new ValidatingLibrary.

#### Parameters

##### params

[`IValidatingLibraryParams`](../interfaces/IValidatingLibraryParams.md)\<`TK`, `TV`, `TSpec`, `TOrchEntity`\>

Parameters including converters and orchestrator

#### Returns

`ValidatingLibrary`\<`TK`, `TV`, `TSpec`, `TOrchEntity`\>

#### Overrides

`ValidatingResultMap<TK, TV>.constructor`

## Properties

### \_inner

> `readonly` **\_inner**: `Map`\<`TK`, `TV`\>

Defined in: ts-utils/dist/ts-utils.d.ts:4871

Protected raw access to the inner `Map<TK, TV>` object.

#### Inherited from

`ValidatingResultMap._inner`

***

### validating

> `readonly` **validating**: [`ResultMapValidator`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`TK`, `TV`\>

Defined in: ts-utils/dist/ts-utils.d.ts:5749

A [ResultMapValidator](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs) which validates keys and values
before inserting them into this collection.

#### Implementation of

[`IReadOnlyValidatingLibrary`](../interfaces/IReadOnlyValidatingLibrary.md).[`validating`](../interfaces/IReadOnlyValidatingLibrary.md#validating)

#### Inherited from

`ValidatingResultMap.validating`

## Accessors

### size

#### Get Signature

> **get** **size**(): `number`

Defined in: ts-utils/dist/ts-utils.d.ts:4984

Returns the number of entries in the map.

##### Returns

`number`

#### Implementation of

[`IReadOnlyValidatingLibrary`](../interfaces/IReadOnlyValidatingLibrary.md).[`size`](../interfaces/IReadOnlyValidatingLibrary.md#size)

#### Inherited from

`ValidatingResultMap.size`

## Methods

### \_isResultMapValueFactory()

> **\_isResultMapValueFactory**\<`TK`, `TV`\>(`value`): `value is ResultMapValueFactory<TK, TV>`

Defined in: ts-utils/dist/ts-utils.d.ts:5018

Determines if a value is a [ResultMapValueFactory](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs).

#### Type Parameters

##### TK

`TK` *extends* `string`

##### TV

`TV`

#### Parameters

##### value

The value to check.

`TV` | [`ResultMapValueFactory`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`TK`, `TV`\>

#### Returns

`value is ResultMapValueFactory<TK, TV>`

`true` if the value is a [ResultMapValueFactory](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs),
`false` otherwise.

#### Inherited from

`ValidatingResultMap._isResultMapValueFactory`

***

### \[iterator\]()

> **\[iterator\]**(): `IterableIterator`\<[`KeyValueEntry`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`TK`, `TV`\>\>

Defined in: ts-utils/dist/ts-utils.d.ts:5005

Gets an iterator over the map entries.

#### Returns

`IterableIterator`\<[`KeyValueEntry`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`TK`, `TV`\>\>

An iterator over the map entries.

#### Implementation of

[`IReadOnlyValidatingLibrary`](../interfaces/IReadOnlyValidatingLibrary.md).[`[iterator]`](../interfaces/IReadOnlyValidatingLibrary.md#iterator)

#### Inherited from

`ValidatingResultMap.[iterator]`

***

### add()

> **add**(`key`, `value`): [`DetailedResult`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`TV`, [`ResultMapResultDetail`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\>

Defined in: ts-utils/dist/ts-utils.d.ts:4906

Sets a key/value pair in the map if the key does not already exist.

#### Parameters

##### key

`TK`

The key to set.

##### value

`TV`

The value to set.

#### Returns

[`DetailedResult`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`TV`, [`ResultMapResultDetail`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\>

`Success` with the value and detail `added` if the key was added,
`Failure` with detail `exists` if the key already exists. Fails with detail
'invalid-key' or 'invalid-value' and an error message if either is invalid.

#### Inherited from

`ValidatingResultMap.add`

***

### clear()

> **clear**(): `void`

Defined in: ts-utils/dist/ts-utils.d.ts:4910

Clears the map.

#### Returns

`void`

#### Inherited from

`ValidatingResultMap.clear`

***

### delete()

> **delete**(`key`): [`DetailedResult`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`TV`, [`ResultMapResultDetail`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\>

Defined in: ts-utils/dist/ts-utils.d.ts:4918

Deletes a key from the map.

#### Parameters

##### key

`TK`

The key to delete.

#### Returns

[`DetailedResult`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`TV`, [`ResultMapResultDetail`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\>

`Success` with the previous value and the detail 'deleted'
if the key was found and deleted, `Failure` with detail 'not-found'
if the key was not found, or with detail 'invalid-key' if the key is invalid.

#### Inherited from

`ValidatingResultMap.delete`

***

### entries()

> **entries**(): `IterableIterator`\<[`KeyValueEntry`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`TK`, `TV`\>\>

Defined in: ts-utils/dist/ts-utils.d.ts:4923

Returns an iterator over the map entries.

#### Returns

`IterableIterator`\<[`KeyValueEntry`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`TK`, `TV`\>\>

An iterator over the map entries.

#### Implementation of

[`IReadOnlyValidatingLibrary`](../interfaces/IReadOnlyValidatingLibrary.md).[`entries`](../interfaces/IReadOnlyValidatingLibrary.md#entries)

#### Inherited from

`ValidatingResultMap.entries`

***

### find()

> **find**(`spec`, `options?`): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<readonly `TV`[]\>

Defined in: [ts-chocolate/src/packlets/library-runtime/validatingLibrary.ts:125](https://github.com/ErikFortune/fgv/blob/4be6f2d0ab84c3f4b78ffd3f9b262279d2ab7172/libraries/ts-chocolate/src/packlets/library-runtime/validatingLibrary.ts#L125)

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

#### Implementation of

[`IReadOnlyValidatingLibrary`](../interfaces/IReadOnlyValidatingLibrary.md).[`find`](../interfaces/IReadOnlyValidatingLibrary.md#find)

***

### forEach()

> **forEach**(`cb`, `arg?`): `void`

Defined in: ts-utils/dist/ts-utils.d.ts:4929

Calls a function for each entry in the map.

#### Parameters

##### cb

[`ResultMapForEachCb`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`TK`, `TV`\>

The function to call for each entry.

##### arg?

`unknown`

An optional argument to pass to the callback.

#### Returns

`void`

#### Implementation of

[`IReadOnlyValidatingLibrary`](../interfaces/IReadOnlyValidatingLibrary.md).[`forEach`](../interfaces/IReadOnlyValidatingLibrary.md#foreach)

#### Inherited from

`ValidatingResultMap.forEach`

***

### get()

> **get**(`key`): [`DetailedResult`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`TV`, [`ResultMapResultDetail`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\>

Defined in: ts-utils/dist/ts-utils.d.ts:4937

Gets a value from the map.

#### Parameters

##### key

`TK`

The key to retrieve.

#### Returns

[`DetailedResult`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`TV`, [`ResultMapResultDetail`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\>

`Success` with the value and detail `exists` if the key was found,
`Failure` with detail `not-found` if the key was not found or with detail
`invalid-key` if the key is invalid.

#### Implementation of

[`IReadOnlyValidatingLibrary`](../interfaces/IReadOnlyValidatingLibrary.md).[`get`](../interfaces/IReadOnlyValidatingLibrary.md#get)

#### Inherited from

`ValidatingResultMap.get`

***

### getOrAdd()

#### Call Signature

> **getOrAdd**(`key`, `value`): [`DetailedResult`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`TV`, [`ResultMapResultDetail`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\>

Defined in: ts-utils/dist/ts-utils.d.ts:4948

Gets a value from the map, or adds a supplied value it if it does not exist.

##### Parameters

###### key

`TK`

The key to be retrieved or created.

###### value

`TV`

The value to add if the key does not exist.

##### Returns

[`DetailedResult`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`TV`, [`ResultMapResultDetail`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\>

`Success` with the value and detail `exists` if the key was found,
`Success` with the value and detail `added` if the key was not found and added.
Fails with detail 'invalid-key' or 'invalid-value' and an error message if either
is invalid.

##### Inherited from

`ValidatingResultMap.getOrAdd`

#### Call Signature

> **getOrAdd**(`key`, `factory`): [`DetailedResult`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`TV`, [`ResultMapResultDetail`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\>

Defined in: ts-utils/dist/ts-utils.d.ts:4959

Gets a value from the map, or adds a value created by a factory function if it does not exist.

##### Parameters

###### key

`TK`

The key of the element to be retrieved or created.

###### factory

[`ResultMapValueFactory`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`TK`, `TV`\>

A [factory function](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs) to create the value if
the key does not exist.

##### Returns

[`DetailedResult`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`TV`, [`ResultMapResultDetail`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\>

`Success` with the value and detail `exists` if the key was found, `Success` with
the value and detail `added` if the key was not found and added. Fails with detail 'invalid-key'
or 'invalid-value' and an error message if either is invalid.

##### Inherited from

`ValidatingResultMap.getOrAdd`

***

### has()

> **has**(`key`): `boolean`

Defined in: ts-utils/dist/ts-utils.d.ts:4965

Returns `true` if the map contains a key.

#### Parameters

##### key

`TK`

The key to check.

#### Returns

`boolean`

`true` if the key exists, `false` otherwise.

#### Implementation of

[`IReadOnlyValidatingLibrary`](../interfaces/IReadOnlyValidatingLibrary.md).[`has`](../interfaces/IReadOnlyValidatingLibrary.md#has)

#### Inherited from

`ValidatingResultMap.has`

***

### keys()

> **keys**(): `IterableIterator`\<`TK`\>

Defined in: ts-utils/dist/ts-utils.d.ts:4970

Returns an iterator over the map keys.

#### Returns

`IterableIterator`\<`TK`\>

An iterator over the map keys.

#### Implementation of

[`IReadOnlyValidatingLibrary`](../interfaces/IReadOnlyValidatingLibrary.md).[`keys`](../interfaces/IReadOnlyValidatingLibrary.md#keys)

#### Inherited from

`ValidatingResultMap.keys`

***

### set()

> **set**(`key`, `value`): [`DetailedResult`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`TV`, [`ResultMapResultDetail`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\>

Defined in: ts-utils/dist/ts-utils.d.ts:4980

Sets a key/value pair in the map.

#### Parameters

##### key

`TK`

The key to set.

##### value

`TV`

The value to set.

#### Returns

[`DetailedResult`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`TV`, [`ResultMapResultDetail`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\>

`Success` with the new value and the detail `updated` if the
key was found and updated, `Success` with the new value and detail
`added` if the key was not found and added.  Fails with detail
'invalid-key' or 'invalid-value' and an error message if either is invalid.

#### Inherited from

`ValidatingResultMap.set`

***

### toReadOnly()

> **toReadOnly**(): [`IReadOnlyValidatingLibrary`](../interfaces/IReadOnlyValidatingLibrary.md)\<`TK`, `TV`, `TSpec`\>

Defined in: [ts-chocolate/src/packlets/library-runtime/validatingLibrary.ts:139](https://github.com/ErikFortune/fgv/blob/4be6f2d0ab84c3f4b78ffd3f9b262279d2ab7172/libraries/ts-chocolate/src/packlets/library-runtime/validatingLibrary.ts#L139)

Gets a read-only view of this library.

#### Returns

[`IReadOnlyValidatingLibrary`](../interfaces/IReadOnlyValidatingLibrary.md)\<`TK`, `TV`, `TSpec`\>

#### Overrides

`ValidatingResultMap.toReadOnly`

***

### update()

> **update**(`key`, `value`): [`DetailedResult`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`TV`, [`ResultMapResultDetail`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\>

Defined in: ts-utils/dist/ts-utils.d.ts:4995

Updates an existing key in the map - the map is not updated if the key does
not exist.

#### Parameters

##### key

`TK`

The key to update.

##### value

`TV`

The value to set.

#### Returns

[`DetailedResult`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`TV`, [`ResultMapResultDetail`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\>

`Success` with the value and detail 'exists' if the key was found
and the value updated, `Failure` an error message and with detail `not-found`
if the key was not found, or with detail 'invalid-key' or 'invalid-value'
if either is invalid.

#### Inherited from

`ValidatingResultMap.update`

***

### values()

> **values**(): `IterableIterator`\<`TV`\>

Defined in: ts-utils/dist/ts-utils.d.ts:5000

Returns an iterator over the map values.

#### Returns

`IterableIterator`\<`TV`\>

An iterator over the map values.

#### Implementation of

[`IReadOnlyValidatingLibrary`](../interfaces/IReadOnlyValidatingLibrary.md).[`values`](../interfaces/IReadOnlyValidatingLibrary.md#values)

#### Inherited from

`ValidatingResultMap.values`

***

### create()

#### Call Signature

> `static` **create**\<`TK`, `TV`\>(`elements`): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`ResultMap`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`TK`, `TV`\>\>

Defined in: ts-utils/dist/ts-utils.d.ts:4889

Creates a new [ResultMap](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs).

##### Type Parameters

###### TK

`TK` *extends* `string` = `string`

###### TV

`TV` = `unknown`

##### Parameters

###### elements

`Iterable`\<[`KeyValueEntry`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`TK`, `TV`\>\>

An optional iterable to initialize the map.

##### Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`ResultMap`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`TK`, `TV`\>\>

`Success` with the new map, or `Failure` with error details
if an error occurred.

##### Inherited from

`ValidatingResultMap.create`

#### Call Signature

> `static` **create**\<`TK`, `TV`\>(`params?`): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`ResultMap`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`TK`, `TV`\>\>

Defined in: ts-utils/dist/ts-utils.d.ts:4897

Creates a new [ResultMap](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs).

##### Type Parameters

###### TK

`TK` *extends* `string` = `string`

###### TV

`TV` = `unknown`

##### Parameters

###### params?

[`IResultMapConstructorParams`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`TK`, `TV`\>

An optional set of parameters to configure the map.

##### Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`ResultMap`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`TK`, `TV`\>\>

`Success` with the new map, or `Failure` with error details
if an error occurred.

##### Inherited from

`ValidatingResultMap.create`

***

### createValidatingResultMap()

> `static` **createValidatingResultMap**\<`TK`, `TV`\>(`params`): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`ValidatingResultMap`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`TK`, `TV`\>\>

Defined in: ts-utils/dist/ts-utils.d.ts:5761

Creates a new [ValidatingResultMap](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs) instance.

#### Type Parameters

##### TK

`TK` *extends* `string` = `string`

##### TV

`TV` = `unknown`

#### Parameters

##### params

[`IValidatingResultMapConstructorParams`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`TK`, `TV`\>

Required parameters for constructing the map.

#### Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`ValidatingResultMap`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`TK`, `TV`\>\>

`Success` with the new map if successful, `Failure` otherwise.

#### Inherited from

`ValidatingResultMap.createValidatingResultMap`
