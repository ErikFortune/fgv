[**@fgv/ts-chocolate**](../../../../README.md)

***

[@fgv/ts-chocolate](../../../../README.md) / [Editing](../README.md) / IValidatingEditorContext

# Interface: IValidatingEditorContext\<T, TBaseId, TId\>

Defined in: [ts-chocolate/src/packlets/editing/model.ts:156](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/editing/model.ts#L156)

Editor context with validating wrapper access.
Combines base editor context with a validating property for raw input handling.

## Extends

- [`IEditorContext`](IEditorContext.md)\<`T`, `TBaseId`, `TId`\>

## Type Parameters

### T

`T`

Entity type

### TBaseId

`TBaseId` *extends* `string` = `string`

Base ID type (e.g., BaseIngredientId)

### TId

`TId` *extends* `string` = `string`

Composite ID type (e.g., IngredientId)

## Properties

### clearUnsavedChanges()

> `readonly` **clearUnsavedChanges**: () => `void`

Defined in: [ts-chocolate/src/packlets/editing/model.ts:108](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/editing/model.ts#L108)

Clear the unsaved changes flag.
Typically called after successful export or when user discards changes.

#### Returns

`void`

#### Inherited from

[`IEditorContext`](IEditorContext.md).[`clearUnsavedChanges`](IEditorContext.md#clearunsavedchanges)

***

### copyTo()

> `readonly` **copyTo**: (`id`, `targetCollectionId`) => [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`TId`\>

Defined in: [ts-chocolate/src/packlets/editing/model.ts:82](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/editing/model.ts#L82)

Copy entity to another collection.

#### Parameters

##### id

`TId`

Source entity ID

##### targetCollectionId

[`CollectionId`](../../../../type-aliases/CollectionId.md)

Target collection ID

#### Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`TId`\>

Result containing the new entity ID in target collection or failure

#### Inherited from

[`IEditorContext`](IEditorContext.md).[`copyTo`](IEditorContext.md#copyto)

***

### create()

> `readonly` **create**: (`baseId`, `entity`) => [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`TId`\>

Defined in: [ts-chocolate/src/packlets/editing/model.ts:59](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/editing/model.ts#L59)

Create new entity with specified base ID.

#### Parameters

##### baseId

Pre-validated base identifier, or undefined to auto-generate from entity name

`TBaseId` | `undefined`

##### entity

`T`

Pre-validated entity data

#### Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`TId`\>

Result containing the generated entity ID or failure

#### Inherited from

[`IEditorContext`](IEditorContext.md).[`create`](IEditorContext.md#create)

***

### delete()

> `readonly` **delete**: (`id`) => [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`T`\>

Defined in: [ts-chocolate/src/packlets/editing/model.ts:74](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/editing/model.ts#L74)

Delete entity from collection.

#### Parameters

##### id

`TId`

Entity ID

#### Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`T`\>

Result indicating success or failure

#### Inherited from

[`IEditorContext`](IEditorContext.md).[`delete`](IEditorContext.md#delete)

***

### exists()

> `readonly` **exists**: (`id`) => `boolean`

Defined in: [ts-chocolate/src/packlets/editing/model.ts:89](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/editing/model.ts#L89)

Check if entity exists in collection.

#### Parameters

##### id

`TId`

Entity ID

#### Returns

`boolean`

True if entity exists

#### Inherited from

[`IEditorContext`](IEditorContext.md).[`exists`](IEditorContext.md#exists)

***

### get()

> `readonly` **get**: (`id`) => [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`T`\>

Defined in: [ts-chocolate/src/packlets/editing/model.ts:45](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/editing/model.ts#L45)

Get entity by ID.

#### Parameters

##### id

`TId`

Entity ID

#### Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`T`\>

Result containing the entity or failure

#### Inherited from

[`IEditorContext`](IEditorContext.md).[`get`](IEditorContext.md#get)

***

### getAll()

> `readonly` **getAll**: () => readonly \[`TId`, `T`\][]

Defined in: [ts-chocolate/src/packlets/editing/model.ts:51](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/editing/model.ts#L51)

Get all entities in the collection.

#### Returns

readonly \[`TId`, `T`\][]

Array of [id, entity] tuples

#### Inherited from

[`IEditorContext`](IEditorContext.md).[`getAll`](IEditorContext.md#getall)

***

### hasUnsavedChanges()

> `readonly` **hasUnsavedChanges**: () => `boolean`

Defined in: [ts-chocolate/src/packlets/editing/model.ts:102](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/editing/model.ts#L102)

Check if there are unsaved changes.

#### Returns

`boolean`

True if there are unsaved changes

#### Inherited from

[`IEditorContext`](IEditorContext.md).[`hasUnsavedChanges`](IEditorContext.md#hasunsavedchanges)

***

### update()

> `readonly` **update**: (`id`, `entity`) => [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`T`\>

Defined in: [ts-chocolate/src/packlets/editing/model.ts:67](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/editing/model.ts#L67)

Update existing entity.

#### Parameters

##### id

`TId`

Entity ID

##### entity

`T`

Pre-validated updated entity data

#### Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`T`\>

Result indicating success or failure

#### Inherited from

[`IEditorContext`](IEditorContext.md).[`update`](IEditorContext.md#update)

***

### validate()

> `readonly` **validate**: (`entity`) => [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`IValidationReport`](IValidationReport.md)\>

Defined in: [ts-chocolate/src/packlets/editing/model.ts:96](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/editing/model.ts#L96)

Validate pre-validated entity using semantic validator.

#### Parameters

##### entity

`T`

Pre-validated entity to check semantic rules

#### Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`IValidationReport`](IValidationReport.md)\>

Result containing validation report or failure

#### Inherited from

[`IEditorContext`](IEditorContext.md).[`validate`](IEditorContext.md#validate)

***

### validating

> `readonly` **validating**: [`IEditorContextValidator`](IEditorContextValidator.md)\<`T`, `TBaseId`, `TId`\>

Defined in: [ts-chocolate/src/packlets/editing/model.ts:162](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/editing/model.ts#L162)

Access validating methods that accept raw input.
Methods on this property validate using converters before delegating to base methods.
