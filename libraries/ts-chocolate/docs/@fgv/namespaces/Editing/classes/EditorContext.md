[**@fgv/ts-chocolate**](../../../../README.md)

***

[@fgv/ts-chocolate](../../../../README.md) / [Editing](../README.md) / EditorContext

# Class: EditorContext\<T, TBaseId, TId\>

Defined in: [ts-chocolate/src/packlets/editing/editorContext.ts:102](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/editing/editorContext.ts#L102)

Base implementation of IEditorContext.
Provides CRUD operations and semantic validation for pre-validated entities.
For raw input handling with converter validation, use ValidatingEditorContext.

## Extended by

- [`ValidatingEditorContext`](ValidatingEditorContext.md)

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

## Implements

- [`IEditorContext`](../interfaces/IEditorContext.md)\<`T`, `TBaseId`, `TId`\>

## Constructors

### Constructor

> `protected` **new EditorContext**\<`T`, `TBaseId`, `TId`\>(`params`): `EditorContext`\<`T`, `TBaseId`, `TId`\>

Defined in: [ts-chocolate/src/packlets/editing/editorContext.ts:118](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/editing/editorContext.ts#L118)

Create an editor context.

#### Parameters

##### params

[`IEditorContextParams`](../interfaces/IEditorContextParams.md)\<`T`, `TBaseId`, `TId`\>

Creation parameters

#### Returns

`EditorContext`\<`T`, `TBaseId`, `TId`\>

## Accessors

### collection

#### Get Signature

> **get** `protected` **collection**(): [`EditableCollection`](EditableCollection.md)\<`T`, `TBaseId`\>

Defined in: [ts-chocolate/src/packlets/editing/editorContext.ts:307](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/editing/editorContext.ts#L307)

Get the underlying mutable collection.
Useful for derived classes that need direct access.

##### Returns

[`EditableCollection`](EditableCollection.md)\<`T`, `TBaseId`\>

The mutable collection

## Methods

### clearUnsavedChanges()

> **clearUnsavedChanges**(): `void`

Defined in: [ts-chocolate/src/packlets/editing/editorContext.ts:297](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/editing/editorContext.ts#L297)

Clear the unsaved changes flag.

#### Returns

`void`

#### Implementation of

[`IEditorContext`](../interfaces/IEditorContext.md).[`clearUnsavedChanges`](../interfaces/IEditorContext.md#clearunsavedchanges)

***

### copyTo()

> **copyTo**(`id`, `targetCollectionId`): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`TId`\>

Defined in: [ts-chocolate/src/packlets/editing/editorContext.ts:252](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/editing/editorContext.ts#L252)

Copy entity to another collection.
This method must be overridden by derived classes that need copy functionality.

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

#### Implementation of

[`IEditorContext`](../interfaces/IEditorContext.md).[`copyTo`](../interfaces/IEditorContext.md#copyto)

***

### create()

> **create**(`baseId`, `entity`): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`TId`\>

Defined in: [ts-chocolate/src/packlets/editing/editorContext.ts:172](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/editing/editorContext.ts#L172)

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

#### Implementation of

[`IEditorContext`](../interfaces/IEditorContext.md).[`create`](../interfaces/IEditorContext.md#create)

***

### delete()

> **delete**(`id`): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`T`\>

Defined in: [ts-chocolate/src/packlets/editing/editorContext.ts:236](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/editing/editorContext.ts#L236)

Delete entity from collection.

#### Parameters

##### id

`TId`

Entity ID

#### Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`T`\>

Result indicating success or failure

#### Implementation of

[`IEditorContext`](../interfaces/IEditorContext.md).[`delete`](../interfaces/IEditorContext.md#delete)

***

### exists()

> **exists**(`id`): `boolean`

Defined in: [ts-chocolate/src/packlets/editing/editorContext.ts:261](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/editing/editorContext.ts#L261)

Check if entity exists in collection.

#### Parameters

##### id

`TId`

Entity ID

#### Returns

`boolean`

True if entity exists

#### Implementation of

[`IEditorContext`](../interfaces/IEditorContext.md).[`exists`](../interfaces/IEditorContext.md#exists)

***

### get()

> **get**(`id`): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`T`\>

Defined in: [ts-chocolate/src/packlets/editing/editorContext.ts:153](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/editing/editorContext.ts#L153)

Get entity by ID.

#### Parameters

##### id

`TId`

Entity ID (composite: collectionId.baseId)

#### Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`T`\>

Result containing the entity or failure

#### Implementation of

[`IEditorContext`](../interfaces/IEditorContext.md).[`get`](../interfaces/IEditorContext.md#get)

***

### getAll()

> **getAll**(): readonly \[`TId`, `T`\][]

Defined in: [ts-chocolate/src/packlets/editing/editorContext.ts:161](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/editing/editorContext.ts#L161)

Get all entities in the collection.

#### Returns

readonly \[`TId`, `T`\][]

Array of [id, entity] tuples

#### Implementation of

[`IEditorContext`](../interfaces/IEditorContext.md).[`getAll`](../interfaces/IEditorContext.md#getall)

***

### hasUnsavedChanges()

> **hasUnsavedChanges**(): `boolean`

Defined in: [ts-chocolate/src/packlets/editing/editorContext.ts:290](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/editing/editorContext.ts#L290)

Check if there are unsaved changes.

#### Returns

`boolean`

True if there are unsaved changes

#### Implementation of

[`IEditorContext`](../interfaces/IEditorContext.md).[`hasUnsavedChanges`](../interfaces/IEditorContext.md#hasunsavedchanges)

***

### update()

> **update**(`id`, `entity`): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`T`\>

Defined in: [ts-chocolate/src/packlets/editing/editorContext.ts:210](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/editing/editorContext.ts#L210)

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

#### Implementation of

[`IEditorContext`](../interfaces/IEditorContext.md).[`update`](../interfaces/IEditorContext.md#update)

***

### validate()

> **validate**(`entity`): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`IValidationReport`](../interfaces/IValidationReport.md)\>

Defined in: [ts-chocolate/src/packlets/editing/editorContext.ts:272](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/editing/editorContext.ts#L272)

Validate pre-validated entity using semantic validator.
For full validation including converter, use validating.validate().

#### Parameters

##### entity

`T`

Pre-validated entity to check semantic rules

#### Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`IValidationReport`](../interfaces/IValidationReport.md)\>

Result containing validation report or failure

#### Implementation of

[`IEditorContext`](../interfaces/IEditorContext.md).[`validate`](../interfaces/IEditorContext.md#validate)

***

### create()

> `static` **create**\<`T`, `TBaseId`, `TId`\>(`params`): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`EditorContext`\<`T`, `TBaseId`, `TId`\>\>

Defined in: [ts-chocolate/src/packlets/editing/editorContext.ts:130](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/editing/editorContext.ts#L130)

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

[`IEditorContextParams`](../interfaces/IEditorContextParams.md)\<`T`, `TBaseId`, `TId`\>

Creation parameters

#### Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`EditorContext`\<`T`, `TBaseId`, `TId`\>\>

Result containing the editor context or failure
