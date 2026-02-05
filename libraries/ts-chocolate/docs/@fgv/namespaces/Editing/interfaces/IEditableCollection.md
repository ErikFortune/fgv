[**@fgv/ts-chocolate**](../../../../README.md)

***

[@fgv/ts-chocolate](../../../../README.md) / [Editing](../README.md) / IEditableCollection

# Interface: IEditableCollection\<T, TBaseId, TId\>

Defined in: [ts-chocolate/src/packlets/editing/model.ts:209](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/editing/model.ts#L209)

Editable collection wrapper.
Wraps a ValidatingResultMap with metadata and export functionality
for entity editing workflows.

## Extends

- [`ValidatingResultMap`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`TBaseId`, `T`\>

## Type Parameters

### T

`T`

Entity type

### TBaseId

`TBaseId` *extends* `string` = `string`

Base ID type (e.g., BaseIngredientId)

### TId

`TId` *extends* `string` = `string`

Composite ID type (e.g., IngredientId, for type compatibility)

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

Defined in: [ts-chocolate/src/packlets/editing/model.ts:214](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/editing/model.ts#L214)

Collection identifier.

***

### export()

> `readonly` **export**: () => [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`ICollectionSourceFile`](../../LibraryData/interfaces/ICollectionSourceFile.md)\<`T`\>\>

Defined in: [ts-chocolate/src/packlets/editing/model.ts:251](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/editing/model.ts#L251)

Export collection to ICollectionSourceFile format.

#### Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`ICollectionSourceFile`](../../LibraryData/interfaces/ICollectionSourceFile.md)\<`T`\>\>

Result containing collection source file or failure

***

### isMutable

> `readonly` **isMutable**: `boolean`

Defined in: [ts-chocolate/src/packlets/editing/model.ts:225](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/editing/model.ts#L225)

Whether this collection is mutable.
Immutable collections cannot be modified.

***

### items

> `readonly` **items**: `ReadonlyMap`\<`TBaseId`, `T`\>

Defined in: [ts-chocolate/src/packlets/editing/model.ts:231](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/editing/model.ts#L231)

All items in the collection.
Map of base ID to entity.

***

### metadata

> `readonly` **metadata**: [`ICollectionSourceMetadata`](../../LibraryData/interfaces/ICollectionSourceMetadata.md)

Defined in: [ts-chocolate/src/packlets/editing/model.ts:219](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/editing/model.ts#L219)

Collection metadata (name, description, etc.).

***

### remove()

> `readonly` **remove**: (`baseId`) => [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`T`\>

Defined in: [ts-chocolate/src/packlets/editing/model.ts:238](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/editing/model.ts#L238)

Remove item from collection.

#### Parameters

##### baseId

`TBaseId`

Base identifier of item to remove

#### Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`T`\>

Result indicating success or failure

***

### updateMetadata()

> `readonly` **updateMetadata**: (`metadata`) => [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`void`\>

Defined in: [ts-chocolate/src/packlets/editing/model.ts:245](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/editing/model.ts#L245)

Update collection metadata.

#### Parameters

##### metadata

`Partial`\<[`ICollectionSourceMetadata`](../../LibraryData/interfaces/ICollectionSourceMetadata.md)\>

Partial metadata to update

#### Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`void`\>

Result indicating success or failure

***

### validating

> `readonly` **validating**: [`ResultMapValidator`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`TBaseId`, `T`\>

Defined in: ts-utils/dist/ts-utils.d.ts:5749

A [ResultMapValidator](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs) which validates keys and values
before inserting them into this collection.

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

Defined in: ts-utils/dist/ts-utils.d.ts:4906

Sets a key/value pair in the map if the key does not already exist.

#### Parameters

##### key

`TBaseId`

The key to set.

##### value

`T`

The value to set.

#### Returns

[`DetailedResult`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`T`, [`ResultMapResultDetail`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\>

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

> **delete**(`key`): [`DetailedResult`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`T`, [`ResultMapResultDetail`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\>

Defined in: ts-utils/dist/ts-utils.d.ts:4918

Deletes a key from the map.

#### Parameters

##### key

`TBaseId`

The key to delete.

#### Returns

[`DetailedResult`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`T`, [`ResultMapResultDetail`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\>

`Success` with the previous value and the detail 'deleted'
if the key was found and deleted, `Failure` with detail 'not-found'
if the key was not found, or with detail 'invalid-key' if the key is invalid.

#### Inherited from

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

### set()

> **set**(`key`, `value`): [`DetailedResult`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`T`, [`ResultMapResultDetail`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\>

Defined in: ts-utils/dist/ts-utils.d.ts:4980

Sets a key/value pair in the map.

#### Parameters

##### key

`TBaseId`

The key to set.

##### value

`T`

The value to set.

#### Returns

[`DetailedResult`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`T`, [`ResultMapResultDetail`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\>

`Success` with the new value and the detail `updated` if the
key was found and updated, `Success` with the new value and detail
`added` if the key was not found and added.  Fails with detail
'invalid-key' or 'invalid-value' and an error message if either is invalid.

#### Inherited from

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

Defined in: ts-utils/dist/ts-utils.d.ts:4995

Updates an existing key in the map - the map is not updated if the key does
not exist.

#### Parameters

##### key

`TBaseId`

The key to update.

##### value

`T`

The value to set.

#### Returns

[`DetailedResult`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`T`, [`ResultMapResultDetail`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\>

`Success` with the value and detail 'exists' if the key was found
and the value updated, `Failure` an error message and with detail `not-found`
if the key was not found, or with detail 'invalid-key' or 'invalid-value'
if either is invalid.

#### Inherited from

`ValidatingResultMap.update`

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
