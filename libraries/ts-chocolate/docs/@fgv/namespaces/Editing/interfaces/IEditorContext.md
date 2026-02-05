[**@fgv/ts-chocolate**](../../../../README.md)

***

[@fgv/ts-chocolate](../../../../README.md) / [Editing](../README.md) / IEditorContext

# Interface: IEditorContext\<T, TBaseId, TId\>

Defined in: [ts-chocolate/src/packlets/editing/model.ts:39](https://github.com/ErikFortune/fgv/blob/4be6f2d0ab84c3f4b78ffd3f9b262279d2ab7172/libraries/ts-chocolate/src/packlets/editing/model.ts#L39)

Generic editor context for entity collections.
Provides CRUD operations and validation for pre-validated entities in a collection.
For raw input handling, use [Editing.IValidatingEditorContext](IValidatingEditorContext.md).

## Extended by

- [`IValidatingEditorContext`](IValidatingEditorContext.md)

## Type Parameters

### T

`T`

Entity type (Ingredient, IFillingRecipe, etc.)

### TBaseId

`TBaseId` *extends* `string` = `string`

Base ID type (e.g., BaseIngredientId)

### TId

`TId` *extends* `string` = `string`

Composite ID type (e.g., IngredientId)

## Properties

### clearUnsavedChanges()

> `readonly` **clearUnsavedChanges**: () => `void`

Defined in: [ts-chocolate/src/packlets/editing/model.ts:108](https://github.com/ErikFortune/fgv/blob/4be6f2d0ab84c3f4b78ffd3f9b262279d2ab7172/libraries/ts-chocolate/src/packlets/editing/model.ts#L108)

Clear the unsaved changes flag.
Typically called after successful export or when user discards changes.

#### Returns

`void`

***

### copyTo()

> `readonly` **copyTo**: (`id`, `targetCollectionId`) => [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`TId`\>

Defined in: [ts-chocolate/src/packlets/editing/model.ts:82](https://github.com/ErikFortune/fgv/blob/4be6f2d0ab84c3f4b78ffd3f9b262279d2ab7172/libraries/ts-chocolate/src/packlets/editing/model.ts#L82)

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

***

### create()

> `readonly` **create**: (`baseId`, `entity`) => [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`TId`\>

Defined in: [ts-chocolate/src/packlets/editing/model.ts:59](https://github.com/ErikFortune/fgv/blob/4be6f2d0ab84c3f4b78ffd3f9b262279d2ab7172/libraries/ts-chocolate/src/packlets/editing/model.ts#L59)

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

***

### delete()

> `readonly` **delete**: (`id`) => [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`T`\>

Defined in: [ts-chocolate/src/packlets/editing/model.ts:74](https://github.com/ErikFortune/fgv/blob/4be6f2d0ab84c3f4b78ffd3f9b262279d2ab7172/libraries/ts-chocolate/src/packlets/editing/model.ts#L74)

Delete entity from collection.

#### Parameters

##### id

`TId`

Entity ID

#### Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`T`\>

Result indicating success or failure

***

### exists()

> `readonly` **exists**: (`id`) => `boolean`

Defined in: [ts-chocolate/src/packlets/editing/model.ts:89](https://github.com/ErikFortune/fgv/blob/4be6f2d0ab84c3f4b78ffd3f9b262279d2ab7172/libraries/ts-chocolate/src/packlets/editing/model.ts#L89)

Check if entity exists in collection.

#### Parameters

##### id

`TId`

Entity ID

#### Returns

`boolean`

True if entity exists

***

### get()

> `readonly` **get**: (`id`) => [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`T`\>

Defined in: [ts-chocolate/src/packlets/editing/model.ts:45](https://github.com/ErikFortune/fgv/blob/4be6f2d0ab84c3f4b78ffd3f9b262279d2ab7172/libraries/ts-chocolate/src/packlets/editing/model.ts#L45)

Get entity by ID.

#### Parameters

##### id

`TId`

Entity ID

#### Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`T`\>

Result containing the entity or failure

***

### getAll()

> `readonly` **getAll**: () => readonly \[`TId`, `T`\][]

Defined in: [ts-chocolate/src/packlets/editing/model.ts:51](https://github.com/ErikFortune/fgv/blob/4be6f2d0ab84c3f4b78ffd3f9b262279d2ab7172/libraries/ts-chocolate/src/packlets/editing/model.ts#L51)

Get all entities in the collection.

#### Returns

readonly \[`TId`, `T`\][]

Array of [id, entity] tuples

***

### hasUnsavedChanges()

> `readonly` **hasUnsavedChanges**: () => `boolean`

Defined in: [ts-chocolate/src/packlets/editing/model.ts:102](https://github.com/ErikFortune/fgv/blob/4be6f2d0ab84c3f4b78ffd3f9b262279d2ab7172/libraries/ts-chocolate/src/packlets/editing/model.ts#L102)

Check if there are unsaved changes.

#### Returns

`boolean`

True if there are unsaved changes

***

### update()

> `readonly` **update**: (`id`, `entity`) => [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`T`\>

Defined in: [ts-chocolate/src/packlets/editing/model.ts:67](https://github.com/ErikFortune/fgv/blob/4be6f2d0ab84c3f4b78ffd3f9b262279d2ab7172/libraries/ts-chocolate/src/packlets/editing/model.ts#L67)

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

***

### validate()

> `readonly` **validate**: (`entity`) => [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`IValidationReport`](IValidationReport.md)\>

Defined in: [ts-chocolate/src/packlets/editing/model.ts:96](https://github.com/ErikFortune/fgv/blob/4be6f2d0ab84c3f4b78ffd3f9b262279d2ab7172/libraries/ts-chocolate/src/packlets/editing/model.ts#L96)

Validate pre-validated entity using semantic validator.

#### Parameters

##### entity

`T`

Pre-validated entity to check semantic rules

#### Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`IValidationReport`](IValidationReport.md)\>

Result containing validation report or failure
