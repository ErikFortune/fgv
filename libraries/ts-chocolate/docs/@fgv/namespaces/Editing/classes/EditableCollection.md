[**@fgv/ts-chocolate**](../../../../README.md)

***

[@fgv/ts-chocolate](../../../../README.md) / [Editing](../README.md) / EditableCollection

# Class: EditableCollection\<T, TBaseId\>

Defined in: [ts-chocolate/src/packlets/editing/editableCollection.ts:110](https://github.com/ErikFortune/fgv/blob/4be6f2d0ab84c3f4b78ffd3f9b262279d2ab7172/libraries/ts-chocolate/src/packlets/editing/editableCollection.ts#L110)

An extension of ValidatingResultMap that adds collection metadata,
mutability control, and export functionality for entity editing workflows.

Inherits all ValidatingResultMap functionality but gates mutation
operations behind an isMutable check.

## Type Param

Composite ID type (e.g., IngredientId)

## Extends

- [`ValidatingResultMap`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`TBaseId`, `T`\>

## Type Parameters

### T

`T`

Entity type

### TBaseId

`TBaseId` *extends* `string` = `string`

Base ID type (e.g., BaseIngredientId)

## Properties

### \_inner

> `readonly` **\_inner**: `Map`\<`TBaseId`, `T`\>

Defined in: ts-utils/dist/ts-utils.d.ts:4871

Protected raw access to the inner `Map<TK, TV>` object.

#### Inherited from

`ValidatingResultMap._inner`

***

### collectionId

> `readonly` **collectionId**: [`CollectionId`](../../../../type-aliases/CollectionId.md)

Defined in: [ts-chocolate/src/packlets/editing/editableCollection.ts:114](https://github.com/ErikFortune/fgv/blob/4be6f2d0ab84c3f4b78ffd3f9b262279d2ab7172/libraries/ts-chocolate/src/packlets/editing/editableCollection.ts#L114)

Collection identifier.

***

### isMutable

> `readonly` **isMutable**: `boolean`

Defined in: [ts-chocolate/src/packlets/editing/editableCollection.ts:119](https://github.com/ErikFortune/fgv/blob/4be6f2d0ab84c3f4b78ffd3f9b262279d2ab7172/libraries/ts-chocolate/src/packlets/editing/editableCollection.ts#L119)

Whether collection is mutable.

***

### sourceItem?

> `readonly` `optional` **sourceItem**: [`FileTreeItem`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs)

Defined in: [ts-chocolate/src/packlets/editing/editableCollection.ts:124](https://github.com/ErikFortune/fgv/blob/4be6f2d0ab84c3f4b78ffd3f9b262279d2ab7172/libraries/ts-chocolate/src/packlets/editing/editableCollection.ts#L124)

Optional reference to the source FileTree item for persistence.

***

### validating

> `readonly` **validating**: [`ResultMapValidator`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`TBaseId`, `T`\>

Defined in: ts-utils/dist/ts-utils.d.ts:5749

A [ResultMapValidator](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs) which validates keys and values
before inserting them into this collection.

#### Inherited from

`ValidatingResultMap.validating`

## Accessors

### metadata

#### Get Signature

> **get** **metadata**(): [`ICollectionSourceMetadata`](../../LibraryData/interfaces/ICollectionSourceMetadata.md)

Defined in: [ts-chocolate/src/packlets/editing/editableCollection.ts:375](https://github.com/ErikFortune/fgv/blob/4be6f2d0ab84c3f4b78ffd3f9b262279d2ab7172/libraries/ts-chocolate/src/packlets/editing/editableCollection.ts#L375)

Collection metadata.

##### Returns

[`ICollectionSourceMetadata`](../../LibraryData/interfaces/ICollectionSourceMetadata.md)

***

### size

#### Get Signature

> **get** **size**(): `number`

Defined in: ts-utils/dist/ts-utils.d.ts:4984

Returns the number of entries in the map.

##### Returns

`number`

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

> **\[iterator\]**(): `IterableIterator`\<[`KeyValueEntry`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`TBaseId`, `T`\>\>

Defined in: ts-utils/dist/ts-utils.d.ts:5005

Gets an iterator over the map entries.

#### Returns

`IterableIterator`\<[`KeyValueEntry`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`TBaseId`, `T`\>\>

An iterator over the map entries.

#### Inherited from

`ValidatingResultMap.[iterator]`

***

### add()

> **add**(`key`, `value`): [`DetailedResult`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`T`, [`ResultMapResultDetail`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\>

Defined in: [ts-chocolate/src/packlets/editing/editableCollection.ts:550](https://github.com/ErikFortune/fgv/blob/4be6f2d0ab84c3f4b78ffd3f9b262279d2ab7172/libraries/ts-chocolate/src/packlets/editing/editableCollection.ts#L550)

Add item only if key doesn't exist.
Fails if collection is immutable.

#### Parameters

##### key

`TBaseId`

##### value

`T`

#### Returns

[`DetailedResult`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`T`, [`ResultMapResultDetail`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\>

#### Overrides

`ValidatingResultMap.add`

***

### canSave()

> **canSave**(): `boolean`

Defined in: [ts-chocolate/src/packlets/editing/editableCollection.ts:455](https://github.com/ErikFortune/fgv/blob/4be6f2d0ab84c3f4b78ffd3f9b262279d2ab7172/libraries/ts-chocolate/src/packlets/editing/editableCollection.ts#L455)

Check if this collection can be saved to its source file.
Returns true if the collection has a sourceItem and the FileTree supports persistence.

#### Returns

`boolean`

True if the collection can be saved, false otherwise

***

### clear()

> **clear**(): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`boolean`\>

Defined in: [ts-chocolate/src/packlets/editing/editableCollection.ts:574](https://github.com/ErikFortune/fgv/blob/4be6f2d0ab84c3f4b78ffd3f9b262279d2ab7172/libraries/ts-chocolate/src/packlets/editing/editableCollection.ts#L574)

Clear all items from collection.
Fails if collection is immutable.

#### Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`boolean`\>

#### Overrides

`ValidatingResultMap.clear`

***

### delete()

> **delete**(`key`): [`DetailedResult`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`T`, [`ResultMapResultDetail`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\>

Defined in: [ts-chocolate/src/packlets/editing/editableCollection.ts:566](https://github.com/ErikFortune/fgv/blob/4be6f2d0ab84c3f4b78ffd3f9b262279d2ab7172/libraries/ts-chocolate/src/packlets/editing/editableCollection.ts#L566)

Delete item from collection.
Fails if collection is immutable.

#### Parameters

##### key

`TBaseId`

#### Returns

[`DetailedResult`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`T`, [`ResultMapResultDetail`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\>

#### Overrides

`ValidatingResultMap.delete`

***

### entries()

> **entries**(): `IterableIterator`\<[`KeyValueEntry`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`TBaseId`, `T`\>\>

Defined in: ts-utils/dist/ts-utils.d.ts:4923

Returns an iterator over the map entries.

#### Returns

`IterableIterator`\<[`KeyValueEntry`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`TBaseId`, `T`\>\>

An iterator over the map entries.

#### Inherited from

`ValidatingResultMap.entries`

***

### export()

> **export**(): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`ICollectionSourceFile`](../../LibraryData/interfaces/ICollectionSourceFile.md)\<`T`\>\>

Defined in: [ts-chocolate/src/packlets/editing/editableCollection.ts:400](https://github.com/ErikFortune/fgv/blob/4be6f2d0ab84c3f4b78ffd3f9b262279d2ab7172/libraries/ts-chocolate/src/packlets/editing/editableCollection.ts#L400)

Export collection to ICollectionSourceFile format.

#### Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`ICollectionSourceFile`](../../LibraryData/interfaces/ICollectionSourceFile.md)\<`T`\>\>

Result containing collection source file or failure

***

### forEach()

> **forEach**(`cb`, `arg?`): `void`

Defined in: ts-utils/dist/ts-utils.d.ts:4929

Calls a function for each entry in the map.

#### Parameters

##### cb

[`ResultMapForEachCb`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`TBaseId`, `T`\>

The function to call for each entry.

##### arg?

`unknown`

An optional argument to pass to the callback.

#### Returns

`void`

#### Inherited from

`ValidatingResultMap.forEach`

***

### get()

> **get**(`key`): [`DetailedResult`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`T`, [`ResultMapResultDetail`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\>

Defined in: ts-utils/dist/ts-utils.d.ts:4937

Gets a value from the map.

#### Parameters

##### key

`TBaseId`

The key to retrieve.

#### Returns

[`DetailedResult`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`T`, [`ResultMapResultDetail`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\>

`Success` with the value and detail `exists` if the key was found,
`Failure` with detail `not-found` if the key was not found or with detail
`invalid-key` if the key is invalid.

#### Inherited from

`ValidatingResultMap.get`

***

### getOrAdd()

#### Call Signature

> **getOrAdd**(`key`, `value`): [`DetailedResult`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`T`, [`ResultMapResultDetail`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\>

Defined in: ts-utils/dist/ts-utils.d.ts:4948

Gets a value from the map, or adds a supplied value it if it does not exist.

##### Parameters

###### key

`TBaseId`

The key to be retrieved or created.

###### value

`T`

The value to add if the key does not exist.

##### Returns

[`DetailedResult`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`T`, [`ResultMapResultDetail`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\>

`Success` with the value and detail `exists` if the key was found,
`Success` with the value and detail `added` if the key was not found and added.
Fails with detail 'invalid-key' or 'invalid-value' and an error message if either
is invalid.

##### Inherited from

`ValidatingResultMap.getOrAdd`

#### Call Signature

> **getOrAdd**(`key`, `factory`): [`DetailedResult`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`T`, [`ResultMapResultDetail`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\>

Defined in: ts-utils/dist/ts-utils.d.ts:4959

Gets a value from the map, or adds a value created by a factory function if it does not exist.

##### Parameters

###### key

`TBaseId`

The key of the element to be retrieved or created.

###### factory

[`ResultMapValueFactory`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`TBaseId`, `T`\>

A [factory function](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs) to create the value if
the key does not exist.

##### Returns

[`DetailedResult`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`T`, [`ResultMapResultDetail`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\>

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

`TBaseId`

The key to check.

#### Returns

`boolean`

`true` if the key exists, `false` otherwise.

#### Inherited from

`ValidatingResultMap.has`

***

### isDirty()

> **isDirty**(): `boolean`

Defined in: [ts-chocolate/src/packlets/editing/editableCollection.ts:470](https://github.com/ErikFortune/fgv/blob/4be6f2d0ab84c3f4b78ffd3f9b262279d2ab7172/libraries/ts-chocolate/src/packlets/editing/editableCollection.ts#L470)

Check if the source file has unsaved changes.
Only applicable if the collection has a persistent FileTree source.
Note: This method is not currently implementable without access to the FileTree instance.
Returns false for now - dirty tracking should be done at a higher level.

#### Returns

`boolean`

False (dirty tracking not available at collection level)

***

### keys()

> **keys**(): `IterableIterator`\<`TBaseId`\>

Defined in: ts-utils/dist/ts-utils.d.ts:4970

Returns an iterator over the map keys.

#### Returns

`IterableIterator`\<`TBaseId`\>

An iterator over the map keys.

#### Inherited from

`ValidatingResultMap.keys`

***

### save()

> **save**(): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`void`\>

Defined in: [ts-chocolate/src/packlets/editing/editableCollection.ts:481](https://github.com/ErikFortune/fgv/blob/4be6f2d0ab84c3f4b78ffd3f9b262279d2ab7172/libraries/ts-chocolate/src/packlets/editing/editableCollection.ts#L481)

Save the collection to its source file using FileTree persistence.
Requires a sourceItem with a mutable FileTree.

#### Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`void`\>

Result indicating success or failure

***

### serialize()

> **serialize**(`format`, `options?`): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`string`\>

Defined in: [ts-chocolate/src/packlets/editing/editableCollection.ts:439](https://github.com/ErikFortune/fgv/blob/4be6f2d0ab84c3f4b78ffd3f9b262279d2ab7172/libraries/ts-chocolate/src/packlets/editing/editableCollection.ts#L439)

Serialize collection to string based on format.

#### Parameters

##### format

Export format ('yaml' or 'json')

`"json"` | `"yaml"`

##### options?

[`IExportOptions`](../interfaces/IExportOptions.md)

Optional export options

#### Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`string`\>

Result containing serialized string or failure

***

### serializeToJson()

> **serializeToJson**(`options?`): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`string`\>

Defined in: [ts-chocolate/src/packlets/editing/editableCollection.ts:429](https://github.com/ErikFortune/fgv/blob/4be6f2d0ab84c3f4b78ffd3f9b262279d2ab7172/libraries/ts-chocolate/src/packlets/editing/editableCollection.ts#L429)

Serialize collection to JSON string.

#### Parameters

##### options?

[`IExportOptions`](../interfaces/IExportOptions.md)

Optional export options

#### Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`string`\>

Result containing JSON string or failure

***

### serializeToYaml()

> **serializeToYaml**(`options?`): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`string`\>

Defined in: [ts-chocolate/src/packlets/editing/editableCollection.ts:420](https://github.com/ErikFortune/fgv/blob/4be6f2d0ab84c3f4b78ffd3f9b262279d2ab7172/libraries/ts-chocolate/src/packlets/editing/editableCollection.ts#L420)

Serialize collection to YAML string.

#### Parameters

##### options?

[`IExportOptions`](../interfaces/IExportOptions.md)

Optional export options

#### Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`string`\>

Result containing YAML string or failure

***

### set()

> **set**(`key`, `value`): [`DetailedResult`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`T`, [`ResultMapResultDetail`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\>

Defined in: [ts-chocolate/src/packlets/editing/editableCollection.ts:542](https://github.com/ErikFortune/fgv/blob/4be6f2d0ab84c3f4b78ffd3f9b262279d2ab7172/libraries/ts-chocolate/src/packlets/editing/editableCollection.ts#L542)

Add or update item in collection.
Fails if collection is immutable.

#### Parameters

##### key

`TBaseId`

##### value

`T`

#### Returns

[`DetailedResult`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`T`, [`ResultMapResultDetail`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\>

#### Overrides

`ValidatingResultMap.set`

***

### toReadOnly()

> **toReadOnly**(): [`IReadOnlyValidatingResultMap`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`TBaseId`, `T`\>

Defined in: ts-utils/dist/ts-utils.d.ts:5765

Gets a read-only version of this map.

#### Returns

[`IReadOnlyValidatingResultMap`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`TBaseId`, `T`\>

#### Inherited from

`ValidatingResultMap.toReadOnly`

***

### update()

> **update**(`key`, `value`): [`DetailedResult`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`T`, [`ResultMapResultDetail`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\>

Defined in: [ts-chocolate/src/packlets/editing/editableCollection.ts:558](https://github.com/ErikFortune/fgv/blob/4be6f2d0ab84c3f4b78ffd3f9b262279d2ab7172/libraries/ts-chocolate/src/packlets/editing/editableCollection.ts#L558)

Update item only if key exists.
Fails if collection is immutable.

#### Parameters

##### key

`TBaseId`

##### value

`T`

#### Returns

[`DetailedResult`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`T`, [`ResultMapResultDetail`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\>

#### Overrides

`ValidatingResultMap.update`

***

### updateMetadata()

> **updateMetadata**(`metadata`): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`void`\>

Defined in: [ts-chocolate/src/packlets/editing/editableCollection.ts:384](https://github.com/ErikFortune/fgv/blob/4be6f2d0ab84c3f4b78ffd3f9b262279d2ab7172/libraries/ts-chocolate/src/packlets/editing/editableCollection.ts#L384)

Update collection metadata.

#### Parameters

##### metadata

`Partial`\<[`ICollectionSourceMetadata`](../../LibraryData/interfaces/ICollectionSourceMetadata.md)\>

Partial metadata to update

#### Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`void`\>

Result indicating success or failure

***

### values()

> **values**(): `IterableIterator`\<`T`\>

Defined in: ts-utils/dist/ts-utils.d.ts:5000

Returns an iterator over the map values.

#### Returns

`IterableIterator`\<`T`\>

An iterator over the map values.

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

### createEditable()

> `static` **createEditable**\<`T`, `TBaseId`\>(`params`): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`EditableCollection`\<`T`, `TBaseId`\>\>

Defined in: [ts-chocolate/src/packlets/editing/editableCollection.ts:151](https://github.com/ErikFortune/fgv/blob/4be6f2d0ab84c3f4b78ffd3f9b262279d2ab7172/libraries/ts-chocolate/src/packlets/editing/editableCollection.ts#L151)

Create a new editable collection.

#### Type Parameters

##### T

`T`

##### TBaseId

`TBaseId` *extends* `string` = `string`

#### Parameters

##### params

[`IEditableCollectionParams`](../interfaces/IEditableCollectionParams.md)\<`T`, `TBaseId`\>

Creation parameters

#### Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`EditableCollection`\<`T`, `TBaseId`\>\>

Result containing the editable collection or failure

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

***

### fromJson()

> `static` **fromJson**\<`T`, `TBaseId`\>(`content`, `params`): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`EditableCollection`\<`T`, `TBaseId`\>\>

Defined in: [ts-chocolate/src/packlets/editing/editableCollection.ts:248](https://github.com/ErikFortune/fgv/blob/4be6f2d0ab84c3f4b78ffd3f9b262279d2ab7172/libraries/ts-chocolate/src/packlets/editing/editableCollection.ts#L248)

Parse a JSON string and create an editable collection.

#### Type Parameters

##### T

`T`

##### TBaseId

`TBaseId` *extends* `string` = `string`

#### Parameters

##### content

`string`

JSON string content

##### params

`Omit`\<[`IEditableCollectionParams`](../interfaces/IEditableCollectionParams.md)\<`T`, `TBaseId`\>, `"initialItems"`\>

Collection creation parameters (without initialItems)

#### Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`EditableCollection`\<`T`, `TBaseId`\>\>

Result containing EditableCollection or failure

***

### fromLibrary()

> `static` **fromLibrary**\<`T`, `TBaseId`, `TItem`\>(`library`, `collectionId`, `keyConverter`, `valueConverter`): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`EditableCollection`\<`T`, `TBaseId`\>\>

Defined in: [ts-chocolate/src/packlets/editing/editableCollection.ts:333](https://github.com/ErikFortune/fgv/blob/4be6f2d0ab84c3f4b78ffd3f9b262279d2ab7172/libraries/ts-chocolate/src/packlets/editing/editableCollection.ts#L333)

Create an editable collection from a SubLibrary collection with persistence enabled.

This convenience method automatically retrieves the sourceItem from the library
to enable direct save() functionality.

#### Type Parameters

##### T

`T`

##### TBaseId

`TBaseId` *extends* `string`

##### TItem

`TItem`

#### Parameters

##### library

[`SubLibraryBase`](../../LibraryData/classes/SubLibraryBase.md)\<`string`, `TBaseId`, `TItem`\>

The SubLibrary containing the collection

##### collectionId

[`CollectionId`](../../../../type-aliases/CollectionId.md)

ID of the collection to make editable

##### keyConverter

[`Converter`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`TBaseId`, `unknown`\>

Converter for validating item keys

##### valueConverter

[`Converter`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`T`, `unknown`\>

Converter for validating item values

#### Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`EditableCollection`\<`T`, `TBaseId`\>\>

Result containing EditableCollection with persistence, or Failure

***

### fromYaml()

> `static` **fromYaml**\<`T`, `TBaseId`\>(`content`, `params`): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`EditableCollection`\<`T`, `TBaseId`\>\>

Defined in: [ts-chocolate/src/packlets/editing/editableCollection.ts:218](https://github.com/ErikFortune/fgv/blob/4be6f2d0ab84c3f4b78ffd3f9b262279d2ab7172/libraries/ts-chocolate/src/packlets/editing/editableCollection.ts#L218)

Parse a YAML string and create an editable collection.

#### Type Parameters

##### T

`T`

##### TBaseId

`TBaseId` *extends* `string` = `string`

#### Parameters

##### content

`string`

YAML string content

##### params

`Omit`\<[`IEditableCollectionParams`](../interfaces/IEditableCollectionParams.md)\<`T`, `TBaseId`\>, `"initialItems"`\>

Collection creation parameters (without initialItems)

#### Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`EditableCollection`\<`T`, `TBaseId`\>\>

Result containing EditableCollection or failure

***

### parse()

> `static` **parse**\<`T`, `TBaseId`\>(`content`, `params`): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`EditableCollection`\<`T`, `TBaseId`\>\>

Defined in: [ts-chocolate/src/packlets/editing/editableCollection.ts:279](https://github.com/ErikFortune/fgv/blob/4be6f2d0ab84c3f4b78ffd3f9b262279d2ab7172/libraries/ts-chocolate/src/packlets/editing/editableCollection.ts#L279)

Parse content (auto-detecting format) and create an editable collection.
Tries JSON first if content looks like JSON, otherwise tries YAML with JSON fallback.

#### Type Parameters

##### T

`T`

##### TBaseId

`TBaseId` *extends* `string` = `string`

#### Parameters

##### content

`string`

String content to parse (YAML or JSON)

##### params

`Omit`\<[`IEditableCollectionParams`](../interfaces/IEditableCollectionParams.md)\<`T`, `TBaseId`\>, `"initialItems"`\>

Collection creation parameters (without initialItems)

#### Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`EditableCollection`\<`T`, `TBaseId`\>\>

Result containing EditableCollection or failure

***

### validateStructure()

> `static` **validateStructure**(`data`): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`true`\>

Defined in: [ts-chocolate/src/packlets/editing/editableCollection.ts:187](https://github.com/ErikFortune/fgv/blob/4be6f2d0ab84c3f4b78ffd3f9b262279d2ab7172/libraries/ts-chocolate/src/packlets/editing/editableCollection.ts#L187)

Validate collection structure.

#### Parameters

##### data

`unknown`

Collection data to validate

#### Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`true`\>

Result of true if valid, or failure with error message
