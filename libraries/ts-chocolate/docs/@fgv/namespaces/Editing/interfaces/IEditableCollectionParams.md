[**@fgv/ts-chocolate**](../../../../README.md)

***

[@fgv/ts-chocolate](../../../../README.md) / [Editing](../README.md) / IEditableCollectionParams

# Interface: IEditableCollectionParams\<T, TBaseId\>

Defined in: [ts-chocolate/src/packlets/editing/editableCollection.ts:53](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/editing/editableCollection.ts#L53)

Parameters for creating an editable collection.

## Type Parameters

### T

`T`

Entity type

### TBaseId

`TBaseId` *extends* `string` = `string`

Base ID type (e.g., BaseIngredientId)

## Properties

### collectionId

> `readonly` **collectionId**: [`CollectionId`](../../../../type-aliases/CollectionId.md)

Defined in: [ts-chocolate/src/packlets/editing/editableCollection.ts:57](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/editing/editableCollection.ts#L57)

Collection identifier.

***

### initialItems

> `readonly` **initialItems**: `ReadonlyMap`\<`TBaseId`, `T`\>

Defined in: [ts-chocolate/src/packlets/editing/editableCollection.ts:74](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/editing/editableCollection.ts#L74)

Initial items in the collection.
Map of base ID to entity.

***

### isMutable

> `readonly` **isMutable**: `boolean`

Defined in: [ts-chocolate/src/packlets/editing/editableCollection.ts:68](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/editing/editableCollection.ts#L68)

Whether this collection is mutable.
If false, all mutation operations will fail.

***

### keyConverter

> `readonly` **keyConverter**: [`Converter`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`TBaseId`, `unknown`\>

Defined in: [ts-chocolate/src/packlets/editing/editableCollection.ts:79](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/editing/editableCollection.ts#L79)

Converter for validating base ID keys.

***

### metadata

> `readonly` **metadata**: [`ICollectionSourceMetadata`](../../LibraryData/interfaces/ICollectionSourceMetadata.md)

Defined in: [ts-chocolate/src/packlets/editing/editableCollection.ts:62](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/editing/editableCollection.ts#L62)

Collection metadata (name, description, etc.).

***

### sourceItem?

> `readonly` `optional` **sourceItem**: [`FileTreeItem`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs)

Defined in: [ts-chocolate/src/packlets/editing/editableCollection.ts:91](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/editing/editableCollection.ts#L91)

Optional reference to the source FileTree item for persistence.
When present, enables direct save() functionality.
Collections loaded from FileTree will have this populated.

***

### valueConverter

> `readonly` **valueConverter**: [`Converter`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`T`, `unknown`\>

Defined in: [ts-chocolate/src/packlets/editing/editableCollection.ts:84](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/editing/editableCollection.ts#L84)

Converter for validating values.
