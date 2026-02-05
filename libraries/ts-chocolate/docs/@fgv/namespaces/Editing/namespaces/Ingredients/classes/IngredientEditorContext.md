[**@fgv/ts-chocolate**](../../../../../../README.md)

***

[@fgv/ts-chocolate](../../../../../../README.md) / [Editing](../../../README.md) / [Ingredients](../README.md) / IngredientEditorContext

# Class: IngredientEditorContext

Defined in: [ts-chocolate/src/packlets/editing/ingredients/ingredientEditorContext.ts:43](https://github.com/ErikFortune/fgv/blob/4be6f2d0ab84c3f4b78ffd3f9b262279d2ab7172/libraries/ts-chocolate/src/packlets/editing/ingredients/ingredientEditorContext.ts#L43)

Editor context specialized for Ingredient entities.
Extends ValidatingEditorContext to provide both pre-validated (base)
and raw input (validating) methods for ingredient CRUD operations.

## Extends

- [`ValidatingEditorContext`](../../../classes/ValidatingEditorContext.md)\<[`IngredientEntity`](../../../../Entities/type-aliases/IngredientEntity.md), [`BaseIngredientId`](../../../../../../type-aliases/BaseIngredientId.md), [`IngredientId`](../../../../../../type-aliases/IngredientId.md)\>

## Constructors

### Constructor

> `protected` **new IngredientEditorContext**(`params`): `IngredientEditorContext`

Defined in: [ts-chocolate/src/packlets/editing/validatingEditorContext.ts:83](https://github.com/ErikFortune/fgv/blob/4be6f2d0ab84c3f4b78ffd3f9b262279d2ab7172/libraries/ts-chocolate/src/packlets/editing/validatingEditorContext.ts#L83)

Create a validating editor context.

#### Parameters

##### params

[`IValidatingEditorContextParams`](../../../interfaces/IValidatingEditorContextParams.md)\<[`IngredientEntity`](../../../../Entities/type-aliases/IngredientEntity.md), [`BaseIngredientId`](../../../../../../type-aliases/BaseIngredientId.md), [`IngredientId`](../../../../../../type-aliases/IngredientId.md)\>

Creation parameters including converters

#### Returns

`IngredientEditorContext`

#### Inherited from

[`ValidatingEditorContext`](../../../classes/ValidatingEditorContext.md).[`constructor`](../../../classes/ValidatingEditorContext.md#constructor)

## Accessors

### collection

#### Get Signature

> **get** `protected` **collection**(): [`EditableCollection`](../../../classes/EditableCollection.md)\<`T`, `TBaseId`\>

Defined in: [ts-chocolate/src/packlets/editing/validatingEditorContext.ts:129](https://github.com/ErikFortune/fgv/blob/4be6f2d0ab84c3f4b78ffd3f9b262279d2ab7172/libraries/ts-chocolate/src/packlets/editing/validatingEditorContext.ts#L129)

Get the underlying mutable collection.
Useful for derived classes that need direct access.

##### Returns

[`EditableCollection`](../../../classes/EditableCollection.md)\<`T`, `TBaseId`\>

The mutable collection

#### Inherited from

[`ValidatingEditorContext`](../../../classes/ValidatingEditorContext.md).[`collection`](../../../classes/ValidatingEditorContext.md#collection)

***

### validating

#### Get Signature

> **get** **validating**(): [`IEditorContextValidator`](../../../interfaces/IEditorContextValidator.md)\<`T`, `TBaseId`, `TId`\>

Defined in: [ts-chocolate/src/packlets/editing/validatingEditorContext.ts:119](https://github.com/ErikFortune/fgv/blob/4be6f2d0ab84c3f4b78ffd3f9b262279d2ab7172/libraries/ts-chocolate/src/packlets/editing/validatingEditorContext.ts#L119)

Access validating methods that accept raw input.
Methods on this property validate using converters before delegating to base methods.

Usage:
- context.create(baseId, entity) - base method, requires pre-validated TBaseId and T
- context.validating.create(rawId, rawEntity) - validates string and unknown, then delegates

##### Returns

[`IEditorContextValidator`](../../../interfaces/IEditorContextValidator.md)\<`T`, `TBaseId`, `TId`\>

Access validating methods that accept raw input.
Methods on this property validate using converters before delegating to base methods.

#### Inherited from

[`ValidatingEditorContext`](../../../classes/ValidatingEditorContext.md).[`validating`](../../../classes/ValidatingEditorContext.md#validating)

## Methods

### clearUnsavedChanges()

> **clearUnsavedChanges**(): `void`

Defined in: [ts-chocolate/src/packlets/editing/editorContext.ts:297](https://github.com/ErikFortune/fgv/blob/4be6f2d0ab84c3f4b78ffd3f9b262279d2ab7172/libraries/ts-chocolate/src/packlets/editing/editorContext.ts#L297)

Clear the unsaved changes flag.

#### Returns

`void`

#### Inherited from

[`ValidatingEditorContext`](../../../classes/ValidatingEditorContext.md).[`clearUnsavedChanges`](../../../classes/ValidatingEditorContext.md#clearunsavedchanges)

***

### copyTo()

> **copyTo**(`id`, `targetCollectionId`): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`IngredientId`](../../../../../../type-aliases/IngredientId.md)\>

Defined in: [ts-chocolate/src/packlets/editing/editorContext.ts:252](https://github.com/ErikFortune/fgv/blob/4be6f2d0ab84c3f4b78ffd3f9b262279d2ab7172/libraries/ts-chocolate/src/packlets/editing/editorContext.ts#L252)

Copy entity to another collection.
This method must be overridden by derived classes that need copy functionality.

#### Parameters

##### id

[`IngredientId`](../../../../../../type-aliases/IngredientId.md)

Source entity ID

##### targetCollectionId

[`CollectionId`](../../../../../../type-aliases/CollectionId.md)

Target collection ID

#### Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`IngredientId`](../../../../../../type-aliases/IngredientId.md)\>

Result containing the new entity ID in target collection or failure

#### Inherited from

[`ValidatingEditorContext`](../../../classes/ValidatingEditorContext.md).[`copyTo`](../../../classes/ValidatingEditorContext.md#copyto)

***

### create()

> **create**(`baseId`, `entity`): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`IngredientId`](../../../../../../type-aliases/IngredientId.md)\>

Defined in: [ts-chocolate/src/packlets/editing/editorContext.ts:172](https://github.com/ErikFortune/fgv/blob/4be6f2d0ab84c3f4b78ffd3f9b262279d2ab7172/libraries/ts-chocolate/src/packlets/editing/editorContext.ts#L172)

Create new entity with specified base ID.

#### Parameters

##### baseId

Pre-validated base identifier, or undefined to auto-generate from entity name

[`BaseIngredientId`](../../../../../../type-aliases/BaseIngredientId.md) | `undefined`

##### entity

[`IngredientEntity`](../../../../Entities/type-aliases/IngredientEntity.md)

Pre-validated entity data

#### Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`IngredientId`](../../../../../../type-aliases/IngredientId.md)\>

Result containing the generated entity ID or failure

#### Inherited from

[`ValidatingEditorContext`](../../../classes/ValidatingEditorContext.md).[`create`](../../../classes/ValidatingEditorContext.md#create)

***

### delete()

> **delete**(`id`): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`IngredientEntity`](../../../../Entities/type-aliases/IngredientEntity.md)\>

Defined in: [ts-chocolate/src/packlets/editing/editorContext.ts:236](https://github.com/ErikFortune/fgv/blob/4be6f2d0ab84c3f4b78ffd3f9b262279d2ab7172/libraries/ts-chocolate/src/packlets/editing/editorContext.ts#L236)

Delete entity from collection.

#### Parameters

##### id

[`IngredientId`](../../../../../../type-aliases/IngredientId.md)

Entity ID

#### Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`IngredientEntity`](../../../../Entities/type-aliases/IngredientEntity.md)\>

Result indicating success or failure

#### Inherited from

[`ValidatingEditorContext`](../../../classes/ValidatingEditorContext.md).[`delete`](../../../classes/ValidatingEditorContext.md#delete)

***

### exists()

> **exists**(`id`): `boolean`

Defined in: [ts-chocolate/src/packlets/editing/editorContext.ts:261](https://github.com/ErikFortune/fgv/blob/4be6f2d0ab84c3f4b78ffd3f9b262279d2ab7172/libraries/ts-chocolate/src/packlets/editing/editorContext.ts#L261)

Check if entity exists in collection.

#### Parameters

##### id

[`IngredientId`](../../../../../../type-aliases/IngredientId.md)

Entity ID

#### Returns

`boolean`

True if entity exists

#### Inherited from

[`ValidatingEditorContext`](../../../classes/ValidatingEditorContext.md).[`exists`](../../../classes/ValidatingEditorContext.md#exists)

***

### get()

> **get**(`id`): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`IngredientEntity`](../../../../Entities/type-aliases/IngredientEntity.md)\>

Defined in: [ts-chocolate/src/packlets/editing/editorContext.ts:153](https://github.com/ErikFortune/fgv/blob/4be6f2d0ab84c3f4b78ffd3f9b262279d2ab7172/libraries/ts-chocolate/src/packlets/editing/editorContext.ts#L153)

Get entity by ID.

#### Parameters

##### id

[`IngredientId`](../../../../../../type-aliases/IngredientId.md)

Entity ID (composite: collectionId.baseId)

#### Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`IngredientEntity`](../../../../Entities/type-aliases/IngredientEntity.md)\>

Result containing the entity or failure

#### Inherited from

[`ValidatingEditorContext`](../../../classes/ValidatingEditorContext.md).[`get`](../../../classes/ValidatingEditorContext.md#get)

***

### getAll()

> **getAll**(): readonly \[[`IngredientId`](../../../../../../type-aliases/IngredientId.md), [`IngredientEntity`](../../../../Entities/type-aliases/IngredientEntity.md)\][]

Defined in: [ts-chocolate/src/packlets/editing/editorContext.ts:161](https://github.com/ErikFortune/fgv/blob/4be6f2d0ab84c3f4b78ffd3f9b262279d2ab7172/libraries/ts-chocolate/src/packlets/editing/editorContext.ts#L161)

Get all entities in the collection.

#### Returns

readonly \[[`IngredientId`](../../../../../../type-aliases/IngredientId.md), [`IngredientEntity`](../../../../Entities/type-aliases/IngredientEntity.md)\][]

Array of [id, entity] tuples

#### Inherited from

[`ValidatingEditorContext`](../../../classes/ValidatingEditorContext.md).[`getAll`](../../../classes/ValidatingEditorContext.md#getall)

***

### getIngredientCategory()

> **getIngredientCategory**(`ingredient`): `string`

Defined in: [ts-chocolate/src/packlets/editing/ingredients/ingredientEditorContext.ts:90](https://github.com/ErikFortune/fgv/blob/4be6f2d0ab84c3f4b78ffd3f9b262279d2ab7172/libraries/ts-chocolate/src/packlets/editing/ingredients/ingredientEditorContext.ts#L90)

Get the ingredient category.

#### Parameters

##### ingredient

[`IngredientEntity`](../../../../Entities/type-aliases/IngredientEntity.md)

Ingredient to get category from

#### Returns

`string`

Ingredient category

***

### getIngredientName()

> **getIngredientName**(`ingredient`): `string`

Defined in: [ts-chocolate/src/packlets/editing/ingredients/ingredientEditorContext.ts:80](https://github.com/ErikFortune/fgv/blob/4be6f2d0ab84c3f4b78ffd3f9b262279d2ab7172/libraries/ts-chocolate/src/packlets/editing/ingredients/ingredientEditorContext.ts#L80)

Get the ingredient name for display purposes.

#### Parameters

##### ingredient

[`IngredientEntity`](../../../../Entities/type-aliases/IngredientEntity.md)

Ingredient to get name from

#### Returns

`string`

Ingredient name

***

### hasUnsavedChanges()

> **hasUnsavedChanges**(): `boolean`

Defined in: [ts-chocolate/src/packlets/editing/editorContext.ts:290](https://github.com/ErikFortune/fgv/blob/4be6f2d0ab84c3f4b78ffd3f9b262279d2ab7172/libraries/ts-chocolate/src/packlets/editing/editorContext.ts#L290)

Check if there are unsaved changes.

#### Returns

`boolean`

True if there are unsaved changes

#### Inherited from

[`ValidatingEditorContext`](../../../classes/ValidatingEditorContext.md).[`hasUnsavedChanges`](../../../classes/ValidatingEditorContext.md#hasunsavedchanges)

***

### update()

> **update**(`id`, `entity`): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`IngredientEntity`](../../../../Entities/type-aliases/IngredientEntity.md)\>

Defined in: [ts-chocolate/src/packlets/editing/editorContext.ts:210](https://github.com/ErikFortune/fgv/blob/4be6f2d0ab84c3f4b78ffd3f9b262279d2ab7172/libraries/ts-chocolate/src/packlets/editing/editorContext.ts#L210)

Update existing entity.

#### Parameters

##### id

[`IngredientId`](../../../../../../type-aliases/IngredientId.md)

Entity ID

##### entity

[`IngredientEntity`](../../../../Entities/type-aliases/IngredientEntity.md)

Pre-validated updated entity data

#### Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`IngredientEntity`](../../../../Entities/type-aliases/IngredientEntity.md)\>

Result indicating success or failure

#### Inherited from

[`ValidatingEditorContext`](../../../classes/ValidatingEditorContext.md).[`update`](../../../classes/ValidatingEditorContext.md#update)

***

### validate()

> **validate**(`entity`): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`IValidationReport`](../../../interfaces/IValidationReport.md)\>

Defined in: [ts-chocolate/src/packlets/editing/editorContext.ts:272](https://github.com/ErikFortune/fgv/blob/4be6f2d0ab84c3f4b78ffd3f9b262279d2ab7172/libraries/ts-chocolate/src/packlets/editing/editorContext.ts#L272)

Validate pre-validated entity using semantic validator.
For full validation including converter, use validating.validate().

#### Parameters

##### entity

[`IngredientEntity`](../../../../Entities/type-aliases/IngredientEntity.md)

Pre-validated entity to check semantic rules

#### Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`IValidationReport`](../../../interfaces/IValidationReport.md)\>

Result containing validation report or failure

#### Inherited from

[`ValidatingEditorContext`](../../../classes/ValidatingEditorContext.md).[`validate`](../../../classes/ValidatingEditorContext.md#validate)

***

### create()

> `static` **create**\<`T`, `TBaseId`, `TId`\>(`params`): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`EditorContext`](../../../classes/EditorContext.md)\<`T`, `TBaseId`, `TId`\>\>

Defined in: [ts-chocolate/src/packlets/editing/editorContext.ts:130](https://github.com/ErikFortune/fgv/blob/4be6f2d0ab84c3f4b78ffd3f9b262279d2ab7172/libraries/ts-chocolate/src/packlets/editing/editorContext.ts#L130)

Create a new editor context.

#### Type Parameters

##### T

`T`

##### TBaseId

`TBaseId` *extends* `string` = `string`

##### TId

`TId` *extends* `string` = `string`

#### Parameters

##### params

[`IEditorContextParams`](../../../interfaces/IEditorContextParams.md)\<`T`, `TBaseId`, `TId`\>

Creation parameters

#### Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`EditorContext`](../../../classes/EditorContext.md)\<`T`, `TBaseId`, `TId`\>\>

Result containing the editor context or failure

#### Inherited from

[`ValidatingEditorContext`](../../../classes/ValidatingEditorContext.md).[`create`](../../../classes/ValidatingEditorContext.md#create-2)

***

### createFromCollection()

> `static` **createFromCollection**(`collection`): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`IngredientEditorContext`\>

Defined in: [ts-chocolate/src/packlets/editing/ingredients/ingredientEditorContext.ts:54](https://github.com/ErikFortune/fgv/blob/4be6f2d0ab84c3f4b78ffd3f9b262279d2ab7172/libraries/ts-chocolate/src/packlets/editing/ingredients/ingredientEditorContext.ts#L54)

Create an ingredient editor context from a collection.

#### Parameters

##### collection

[`EditableCollection`](../../../classes/EditableCollection.md)\<[`IngredientEntity`](../../../../Entities/type-aliases/IngredientEntity.md), [`BaseIngredientId`](../../../../../../type-aliases/BaseIngredientId.md)\>

Mutable collection of ingredients

#### Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`IngredientEditorContext`\>

Result containing the editor context or failure

***

### createValidating()

> `static` **createValidating**\<`T`, `TBaseId`, `TId`\>(`params`): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`ValidatingEditorContext`](../../../classes/ValidatingEditorContext.md)\<`T`, `TBaseId`, `TId`\>\>

Defined in: [ts-chocolate/src/packlets/editing/validatingEditorContext.ts:97](https://github.com/ErikFortune/fgv/blob/4be6f2d0ab84c3f4b78ffd3f9b262279d2ab7172/libraries/ts-chocolate/src/packlets/editing/validatingEditorContext.ts#L97)

Create a new validating editor context.

#### Type Parameters

##### T

`T`

##### TBaseId

`TBaseId` *extends* `string` = `string`

##### TId

`TId` *extends* `string` = `string`

#### Parameters

##### params

[`IValidatingEditorContextParams`](../../../interfaces/IValidatingEditorContextParams.md)\<`T`, `TBaseId`, `TId`\>

Creation parameters including converters

#### Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`ValidatingEditorContext`](../../../classes/ValidatingEditorContext.md)\<`T`, `TBaseId`, `TId`\>\>

Result containing the validating editor context or failure

#### Inherited from

[`ValidatingEditorContext`](../../../classes/ValidatingEditorContext.md).[`createValidating`](../../../classes/ValidatingEditorContext.md#createvalidating)
