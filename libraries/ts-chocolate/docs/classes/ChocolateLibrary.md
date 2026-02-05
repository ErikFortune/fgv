[**@fgv/ts-chocolate**](../README.md)

***

[@fgv/ts-chocolate](../README.md) / ChocolateLibrary

# Class: ChocolateLibrary

Defined in: [ts-chocolate/src/packlets/library-runtime/chocolateLibrary.ts:153](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/library-runtime/chocolateLibrary.ts#L153)

Main entry point for the chocolate library

Provides unified access to:
- Ingredient management (multi-source with built-ins)
- Recipe management (multi-source)
- Molds, procedures, tasks, and confections

## Properties

### logger

> `readonly` **logger**: [`LogReporter`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`unknown`\>

Defined in: [ts-chocolate/src/packlets/library-runtime/chocolateLibrary.ts:164](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/library-runtime/chocolateLibrary.ts#L164)

Logger used by this library and its sub-libraries.

## Accessors

### confections

#### Get Signature

> **get** **confections**(): [`ConfectionsLibrary`](../@fgv/namespaces/Entities/classes/ConfectionsLibrary.md)

Defined in: [ts-chocolate/src/packlets/library-runtime/chocolateLibrary.ts:321](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/library-runtime/chocolateLibrary.ts#L321)

The [confections library](../@fgv/namespaces/Entities/classes/ConfectionsLibrary.md).

##### Returns

[`ConfectionsLibrary`](../@fgv/namespaces/Entities/classes/ConfectionsLibrary.md)

***

### fillings

#### Get Signature

> **get** **fillings**(): [`FillingsLibrary`](../@fgv/namespaces/Entities/classes/FillingsLibrary.md)

Defined in: [ts-chocolate/src/packlets/library-runtime/chocolateLibrary.ts:293](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/library-runtime/chocolateLibrary.ts#L293)

The [fillings library](../@fgv/namespaces/Entities/classes/FillingsLibrary.md).

##### Returns

[`FillingsLibrary`](../@fgv/namespaces/Entities/classes/FillingsLibrary.md)

***

### ingredients

#### Get Signature

> **get** **ingredients**(): [`IngredientsLibrary`](../@fgv/namespaces/Entities/classes/IngredientsLibrary.md)

Defined in: [ts-chocolate/src/packlets/library-runtime/chocolateLibrary.ts:286](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/library-runtime/chocolateLibrary.ts#L286)

The [ingredients library](../@fgv/namespaces/Entities/classes/IngredientsLibrary.md).

##### Returns

[`IngredientsLibrary`](../@fgv/namespaces/Entities/classes/IngredientsLibrary.md)

***

### molds

#### Get Signature

> **get** **molds**(): [`MoldsLibrary`](../@fgv/namespaces/Entities/classes/MoldsLibrary.md)

Defined in: [ts-chocolate/src/packlets/library-runtime/chocolateLibrary.ts:300](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/library-runtime/chocolateLibrary.ts#L300)

The [molds library](../@fgv/namespaces/Entities/classes/MoldsLibrary.md).

##### Returns

[`MoldsLibrary`](../@fgv/namespaces/Entities/classes/MoldsLibrary.md)

***

### procedures

#### Get Signature

> **get** **procedures**(): [`ProceduresLibrary`](../@fgv/namespaces/Entities/classes/ProceduresLibrary.md)

Defined in: [ts-chocolate/src/packlets/library-runtime/chocolateLibrary.ts:307](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/library-runtime/chocolateLibrary.ts#L307)

The [procedures library](../@fgv/namespaces/Entities/classes/ProceduresLibrary.md).

##### Returns

[`ProceduresLibrary`](../@fgv/namespaces/Entities/classes/ProceduresLibrary.md)

***

### tasks

#### Get Signature

> **get** **tasks**(): [`TasksLibrary`](../@fgv/namespaces/Entities/classes/TasksLibrary.md)

Defined in: [ts-chocolate/src/packlets/library-runtime/chocolateLibrary.ts:314](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/library-runtime/chocolateLibrary.ts#L314)

The [tasks library](../@fgv/namespaces/Entities/classes/TasksLibrary.md).

##### Returns

[`TasksLibrary`](../@fgv/namespaces/Entities/classes/TasksLibrary.md)

## Methods

### getEditableConfections()

> **getEditableConfections**(`collectionId`): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`EditableCollection`](../@fgv/namespaces/Editing/classes/EditableCollection.md)\<[`AnyConfectionEntity`](../@fgv/namespaces/Entities/type-aliases/AnyConfectionEntity.md), [`BaseConfectionId`](../type-aliases/BaseConfectionId.md)\>\>

Defined in: [ts-chocolate/src/packlets/library-runtime/chocolateLibrary.ts:418](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/library-runtime/chocolateLibrary.ts#L418)

Get an editable confections collection with persistence enabled.

#### Parameters

##### collectionId

[`CollectionId`](../type-aliases/CollectionId.md)

ID of the collection to make editable

#### Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`EditableCollection`](../@fgv/namespaces/Editing/classes/EditableCollection.md)\<[`AnyConfectionEntity`](../@fgv/namespaces/Entities/type-aliases/AnyConfectionEntity.md), [`BaseConfectionId`](../type-aliases/BaseConfectionId.md)\>\>

Result containing EditableCollection with persistence, or Failure

***

### getEditableFillings()

> **getEditableFillings**(`collectionId`): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`EditableCollection`](../@fgv/namespaces/Editing/classes/EditableCollection.md)\<[`IFillingRecipeEntity`](../@fgv/namespaces/Entities/interfaces/IFillingRecipeEntity.md), [`BaseFillingId`](../type-aliases/BaseFillingId.md)\>\>

Defined in: [ts-chocolate/src/packlets/library-runtime/chocolateLibrary.ts:352](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/library-runtime/chocolateLibrary.ts#L352)

Get an editable fillings collection with persistence enabled.

#### Parameters

##### collectionId

[`CollectionId`](../type-aliases/CollectionId.md)

ID of the collection to make editable

#### Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`EditableCollection`](../@fgv/namespaces/Editing/classes/EditableCollection.md)\<[`IFillingRecipeEntity`](../@fgv/namespaces/Entities/interfaces/IFillingRecipeEntity.md), [`BaseFillingId`](../type-aliases/BaseFillingId.md)\>\>

Result containing EditableCollection with persistence, or Failure

***

### getEditableIngredients()

> **getEditableIngredients**(`collectionId`): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`EditableCollection`](../@fgv/namespaces/Editing/classes/EditableCollection.md)\<[`IngredientEntity`](../@fgv/namespaces/Entities/type-aliases/IngredientEntity.md), [`BaseIngredientId`](../type-aliases/BaseIngredientId.md)\>\>

Defined in: [ts-chocolate/src/packlets/library-runtime/chocolateLibrary.ts:335](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/library-runtime/chocolateLibrary.ts#L335)

Get an editable ingredients collection with persistence enabled.

#### Parameters

##### collectionId

[`CollectionId`](../type-aliases/CollectionId.md)

ID of the collection to make editable

#### Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`EditableCollection`](../@fgv/namespaces/Editing/classes/EditableCollection.md)\<[`IngredientEntity`](../@fgv/namespaces/Entities/type-aliases/IngredientEntity.md), [`BaseIngredientId`](../type-aliases/BaseIngredientId.md)\>\>

Result containing EditableCollection with persistence, or Failure

***

### getEditableMolds()

> **getEditableMolds**(`collectionId`): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`EditableCollection`](../@fgv/namespaces/Editing/classes/EditableCollection.md)\<[`IMoldEntity`](../@fgv/namespaces/Entities/interfaces/IMoldEntity.md), [`BaseMoldId`](../type-aliases/BaseMoldId.md)\>\>

Defined in: [ts-chocolate/src/packlets/library-runtime/chocolateLibrary.ts:369](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/library-runtime/chocolateLibrary.ts#L369)

Get an editable molds collection with persistence enabled.

#### Parameters

##### collectionId

[`CollectionId`](../type-aliases/CollectionId.md)

ID of the collection to make editable

#### Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`EditableCollection`](../@fgv/namespaces/Editing/classes/EditableCollection.md)\<[`IMoldEntity`](../@fgv/namespaces/Entities/interfaces/IMoldEntity.md), [`BaseMoldId`](../type-aliases/BaseMoldId.md)\>\>

Result containing EditableCollection with persistence, or Failure

***

### getEditableProcedures()

> **getEditableProcedures**(`collectionId`): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`EditableCollection`](../@fgv/namespaces/Editing/classes/EditableCollection.md)\<[`IProcedureEntity`](../@fgv/namespaces/Entities/interfaces/IProcedureEntity.md), [`BaseProcedureId`](../type-aliases/BaseProcedureId.md)\>\>

Defined in: [ts-chocolate/src/packlets/library-runtime/chocolateLibrary.ts:384](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/library-runtime/chocolateLibrary.ts#L384)

Get an editable procedures collection with persistence enabled.

#### Parameters

##### collectionId

[`CollectionId`](../type-aliases/CollectionId.md)

ID of the collection to make editable

#### Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`EditableCollection`](../@fgv/namespaces/Editing/classes/EditableCollection.md)\<[`IProcedureEntity`](../@fgv/namespaces/Entities/interfaces/IProcedureEntity.md), [`BaseProcedureId`](../type-aliases/BaseProcedureId.md)\>\>

Result containing EditableCollection with persistence, or Failure

***

### getEditableTasks()

> **getEditableTasks**(`collectionId`): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`EditableCollection`](../@fgv/namespaces/Editing/classes/EditableCollection.md)\<[`IRawTaskEntity`](../@fgv/namespaces/Entities/interfaces/IRawTaskEntity.md), [`BaseTaskId`](../type-aliases/BaseTaskId.md)\>\>

Defined in: [ts-chocolate/src/packlets/library-runtime/chocolateLibrary.ts:401](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/library-runtime/chocolateLibrary.ts#L401)

Get an editable tasks collection with persistence enabled.

#### Parameters

##### collectionId

[`CollectionId`](../type-aliases/CollectionId.md)

ID of the collection to make editable

#### Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`EditableCollection`](../@fgv/namespaces/Editing/classes/EditableCollection.md)\<[`IRawTaskEntity`](../@fgv/namespaces/Entities/interfaces/IRawTaskEntity.md), [`BaseTaskId`](../type-aliases/BaseTaskId.md)\>\>

Result containing EditableCollection with persistence, or Failure

***

### create()

> `static` **create**(`params?`): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`ChocolateLibrary`\>

Defined in: [ts-chocolate/src/packlets/library-runtime/chocolateLibrary.ts:192](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/library-runtime/chocolateLibrary.ts#L192)

Creates a new ChocolateLibrary instance.

#### Parameters

##### params?

[`IChocolateLibraryCreateParams`](../@fgv/namespaces/LibraryRuntime/interfaces/IChocolateLibraryCreateParams.md)

Optional [creation parameters](../@fgv/namespaces/LibraryRuntime/interfaces/IChocolateLibraryCreateParams.md)

#### Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`ChocolateLibrary`\>

`Success` with new instance, or `Failure` with error message
