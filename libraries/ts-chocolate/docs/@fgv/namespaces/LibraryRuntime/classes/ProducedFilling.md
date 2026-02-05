[**@fgv/ts-chocolate**](../../../../README.md)

***

[@fgv/ts-chocolate](../../../../README.md) / [LibraryRuntime](../README.md) / ProducedFilling

# Class: ProducedFilling

Defined in: [ts-chocolate/src/packlets/library-runtime/produced/fillingWrapper.ts:68](https://github.com/ErikFortune/fgv/blob/d51b0929f72c9206f7fc8c54016db3ae08502b0f/libraries/ts-chocolate/src/packlets/library-runtime/produced/fillingWrapper.ts#L68)

Mutable wrapper for IProducedFilling with undo/redo support.
Provides editing methods that maintain history for undo/redo operations.

## Accessors

### ingredients

#### Get Signature

> **get** **ingredients**(): readonly [`IProducedFillingIngredientEntity`](../../Entities/namespaces/Fillings/interfaces/IProducedFillingIngredientEntity.md)[]

Defined in: [ts-chocolate/src/packlets/library-runtime/produced/fillingWrapper.ts:483](https://github.com/ErikFortune/fgv/blob/d51b0929f72c9206f7fc8c54016db3ae08502b0f/libraries/ts-chocolate/src/packlets/library-runtime/produced/fillingWrapper.ts#L483)

Gets the ingredients as a readonly array.

##### Returns

readonly [`IProducedFillingIngredientEntity`](../../Entities/namespaces/Fillings/interfaces/IProducedFillingIngredientEntity.md)[]

***

### snapshot

#### Get Signature

> **get** **snapshot**(): [`IProducedFillingEntity`](../../Entities/interfaces/IProducedFillingEntity.md)

Defined in: [ts-chocolate/src/packlets/library-runtime/produced/fillingWrapper.ts:459](https://github.com/ErikFortune/fgv/blob/d51b0929f72c9206f7fc8c54016db3ae08502b0f/libraries/ts-chocolate/src/packlets/library-runtime/produced/fillingWrapper.ts#L459)

Gets the current state as an immutable snapshot.

##### Returns

[`IProducedFillingEntity`](../../Entities/interfaces/IProducedFillingEntity.md)

***

### targetWeight

#### Get Signature

> **get** **targetWeight**(): [`Measurement`](../../../../type-aliases/Measurement.md)

Defined in: [ts-chocolate/src/packlets/library-runtime/produced/fillingWrapper.ts:475](https://github.com/ErikFortune/fgv/blob/d51b0929f72c9206f7fc8c54016db3ae08502b0f/libraries/ts-chocolate/src/packlets/library-runtime/produced/fillingWrapper.ts#L475)

Gets the target weight.

##### Returns

[`Measurement`](../../../../type-aliases/Measurement.md)

***

### versionId

#### Get Signature

> **get** **versionId**(): [`FillingVersionId`](../../../../type-aliases/FillingVersionId.md)

Defined in: [ts-chocolate/src/packlets/library-runtime/produced/fillingWrapper.ts:467](https://github.com/ErikFortune/fgv/blob/d51b0929f72c9206f7fc8c54016db3ae08502b0f/libraries/ts-chocolate/src/packlets/library-runtime/produced/fillingWrapper.ts#L467)

Gets the version ID.

##### Returns

[`FillingVersionId`](../../../../type-aliases/FillingVersionId.md)

## Methods

### canRedo()

> **canRedo**(): `boolean`

Defined in: [ts-chocolate/src/packlets/library-runtime/produced/fillingWrapper.ts:282](https://github.com/ErikFortune/fgv/blob/d51b0929f72c9206f7fc8c54016db3ae08502b0f/libraries/ts-chocolate/src/packlets/library-runtime/produced/fillingWrapper.ts#L282)

Checks if redo is available.

#### Returns

`boolean`

True if redo stack is not empty

***

### canUndo()

> **canUndo**(): `boolean`

Defined in: [ts-chocolate/src/packlets/library-runtime/produced/fillingWrapper.ts:273](https://github.com/ErikFortune/fgv/blob/d51b0929f72c9206f7fc8c54016db3ae08502b0f/libraries/ts-chocolate/src/packlets/library-runtime/produced/fillingWrapper.ts#L273)

Checks if undo is available.

#### Returns

`boolean`

True if undo stack is not empty

***

### createSnapshot()

> **createSnapshot**(): [`IProducedFillingEntity`](../../Entities/interfaces/IProducedFillingEntity.md)

Defined in: [ts-chocolate/src/packlets/library-runtime/produced/fillingWrapper.ts:194](https://github.com/ErikFortune/fgv/blob/d51b0929f72c9206f7fc8c54016db3ae08502b0f/libraries/ts-chocolate/src/packlets/library-runtime/produced/fillingWrapper.ts#L194)

Creates an immutable snapshot of the current state.

#### Returns

[`IProducedFillingEntity`](../../Entities/interfaces/IProducedFillingEntity.md)

Immutable copy of current produced filling

***

### getChanges()

> **getChanges**(`original`): [`IFillingChanges`](../interfaces/IFillingChanges.md)

Defined in: [ts-chocolate/src/packlets/library-runtime/produced/fillingWrapper.ts:508](https://github.com/ErikFortune/fgv/blob/d51b0929f72c9206f7fc8c54016db3ae08502b0f/libraries/ts-chocolate/src/packlets/library-runtime/produced/fillingWrapper.ts#L508)

Gets detailed changes between current state and original.

#### Parameters

##### original

[`IProducedFillingEntity`](../../Entities/interfaces/IProducedFillingEntity.md)

Original produced filling to compare against

#### Returns

[`IFillingChanges`](../interfaces/IFillingChanges.md)

Structure describing what changed

***

### getSerializedHistory()

> **getSerializedHistory**(`original`): [`ISerializedEditingHistoryEntity`](../../Entities/namespaces/Session/interfaces/ISerializedEditingHistoryEntity.md)\<[`IProducedFillingEntity`](../../Entities/interfaces/IProducedFillingEntity.md)\>

Defined in: [ts-chocolate/src/packlets/library-runtime/produced/fillingWrapper.ts:219](https://github.com/ErikFortune/fgv/blob/d51b0929f72c9206f7fc8c54016db3ae08502b0f/libraries/ts-chocolate/src/packlets/library-runtime/produced/fillingWrapper.ts#L219)

Serializes the complete editing history for persistence.
Includes current state, original state, and undo/redo stacks.

#### Parameters

##### original

[`IProducedFillingEntity`](../../Entities/interfaces/IProducedFillingEntity.md)

Original state when editing started (for change detection on restore)

#### Returns

[`ISerializedEditingHistoryEntity`](../../Entities/namespaces/Session/interfaces/ISerializedEditingHistoryEntity.md)\<[`IProducedFillingEntity`](../../Entities/interfaces/IProducedFillingEntity.md)\>

Serialized editing history

***

### hasChanges()

> **hasChanges**(`original`): `boolean`

Defined in: [ts-chocolate/src/packlets/library-runtime/produced/fillingWrapper.ts:498](https://github.com/ErikFortune/fgv/blob/d51b0929f72c9206f7fc8c54016db3ae08502b0f/libraries/ts-chocolate/src/packlets/library-runtime/produced/fillingWrapper.ts#L498)

Checks if current state differs from original.
Uses deep equality check.

#### Parameters

##### original

[`IProducedFillingEntity`](../../Entities/interfaces/IProducedFillingEntity.md)

Original produced filling to compare against

#### Returns

`boolean`

True if changes were detected

***

### redo()

> **redo**(): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`boolean`\>

Defined in: [ts-chocolate/src/packlets/library-runtime/produced/fillingWrapper.ts:257](https://github.com/ErikFortune/fgv/blob/d51b0929f72c9206f7fc8c54016db3ae08502b0f/libraries/ts-chocolate/src/packlets/library-runtime/produced/fillingWrapper.ts#L257)

Redoes the last undone change.
Pops from redo stack, pushes current to undo, and restores future state.

#### Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`boolean`\>

Success with true if redo succeeded, Success with false if no future

***

### removeIngredient()

> **removeIngredient**(`id`): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`void`\>

Defined in: [ts-chocolate/src/packlets/library-runtime/produced/fillingWrapper.ts:344](https://github.com/ErikFortune/fgv/blob/d51b0929f72c9206f7fc8c54016db3ae08502b0f/libraries/ts-chocolate/src/packlets/library-runtime/produced/fillingWrapper.ts#L344)

Removes an ingredient.
Pushes current state to undo before change, clears redo.

#### Parameters

##### id

[`IngredientId`](../../../../type-aliases/IngredientId.md)

Ingredient ID to remove

#### Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`void`\>

Success or failure

***

### restoreSnapshot()

> **restoreSnapshot**(`snapshot`): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`void`\>

Defined in: [ts-chocolate/src/packlets/library-runtime/produced/fillingWrapper.ts:205](https://github.com/ErikFortune/fgv/blob/d51b0929f72c9206f7fc8c54016db3ae08502b0f/libraries/ts-chocolate/src/packlets/library-runtime/produced/fillingWrapper.ts#L205)

Restores state from a snapshot.
Pushes current state to undo stack and clears redo stack.

#### Parameters

##### snapshot

[`IProducedFillingEntity`](../../Entities/interfaces/IProducedFillingEntity.md)

Snapshot to restore

#### Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`void`\>

Success or failure

***

### scaleToTargetWeight()

> **scaleToTargetWeight**(`targetWeight`): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`Measurement`](../../../../type-aliases/Measurement.md)\>

Defined in: [ts-chocolate/src/packlets/library-runtime/produced/fillingWrapper.ts:370](https://github.com/ErikFortune/fgv/blob/d51b0929f72c9206f7fc8c54016db3ae08502b0f/libraries/ts-chocolate/src/packlets/library-runtime/produced/fillingWrapper.ts#L370)

Scales all weight-contributing ingredients to achieve a target weight.
Non-weight-contributing ingredients (tsp, Tbsp, pinch, seeds, pods) remain unchanged.
Pushes current state to undo before change, clears redo.

#### Parameters

##### targetWeight

[`Measurement`](../../../../type-aliases/Measurement.md)

Desired total weight

#### Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`Measurement`](../../../../type-aliases/Measurement.md)\>

Success with actual achieved weight, or failure

***

### setIngredient()

> **setIngredient**(`id`, `amount`, `unit?`, `modifiers?`): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`void`\>

Defined in: [ts-chocolate/src/packlets/library-runtime/produced/fillingWrapper.ts:300](https://github.com/ErikFortune/fgv/blob/d51b0929f72c9206f7fc8c54016db3ae08502b0f/libraries/ts-chocolate/src/packlets/library-runtime/produced/fillingWrapper.ts#L300)

Sets or updates an ingredient.
Pushes current state to undo before change, clears redo.

#### Parameters

##### id

[`IngredientId`](../../../../type-aliases/IngredientId.md)

Ingredient ID

##### amount

[`Measurement`](../../../../type-aliases/Measurement.md)

Amount of ingredient

##### unit?

[`MeasurementUnit`](../../../../type-aliases/MeasurementUnit.md)

Optional measurement unit (default: 'g')

##### modifiers?

[`IIngredientModifiers`](../../Entities/namespaces/Fillings/interfaces/IIngredientModifiers.md)

Optional ingredient modifiers

#### Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`void`\>

Success or failure

***

### setNotes()

> **setNotes**(`notes`): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`void`\>

Defined in: [ts-chocolate/src/packlets/library-runtime/produced/fillingWrapper.ts:420](https://github.com/ErikFortune/fgv/blob/d51b0929f72c9206f7fc8c54016db3ae08502b0f/libraries/ts-chocolate/src/packlets/library-runtime/produced/fillingWrapper.ts#L420)

Sets the notes.
Pushes current state to undo before change, clears redo.

#### Parameters

##### notes

[`ICategorizedNote`](../../Model/interfaces/ICategorizedNote.md)[]

Categorized notes array

#### Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`void`\>

Success or failure

***

### setProcedure()

> **setProcedure**(`id`): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`void`\>

Defined in: [ts-chocolate/src/packlets/library-runtime/produced/fillingWrapper.ts:439](https://github.com/ErikFortune/fgv/blob/d51b0929f72c9206f7fc8c54016db3ae08502b0f/libraries/ts-chocolate/src/packlets/library-runtime/produced/fillingWrapper.ts#L439)

Sets the procedure.
Pushes current state to undo before change, clears redo.

#### Parameters

##### id

Procedure ID or undefined to clear

[`ProcedureId`](../../../../type-aliases/ProcedureId.md) | `undefined`

#### Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`void`\>

Success or failure

***

### undo()

> **undo**(): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`boolean`\>

Defined in: [ts-chocolate/src/packlets/library-runtime/produced/fillingWrapper.ts:240](https://github.com/ErikFortune/fgv/blob/d51b0929f72c9206f7fc8c54016db3ae08502b0f/libraries/ts-chocolate/src/packlets/library-runtime/produced/fillingWrapper.ts#L240)

Undoes the last change.
Pops from undo stack, pushes current to redo, and restores previous state.

#### Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`boolean`\>

Success with true if undo succeeded, Success with false if no history

***

### create()

> `static` **create**(`initial`): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`ProducedFilling`\>

Defined in: [ts-chocolate/src/packlets/library-runtime/produced/fillingWrapper.ts:90](https://github.com/ErikFortune/fgv/blob/d51b0929f72c9206f7fc8c54016db3ae08502b0f/libraries/ts-chocolate/src/packlets/library-runtime/produced/fillingWrapper.ts#L90)

Factory method for creating a ProducedFilling from an existing produced filling.

#### Parameters

##### initial

[`IProducedFillingEntity`](../../Entities/interfaces/IProducedFillingEntity.md)

The initial produced filling state

#### Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`ProducedFilling`\>

Success with ProducedFilling

***

### fromSource()

> `static` **fromSource**(`source`, `scaleFactor`): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`ProducedFilling`\>

Defined in: [ts-chocolate/src/packlets/library-runtime/produced/fillingWrapper.ts:101](https://github.com/ErikFortune/fgv/blob/d51b0929f72c9206f7fc8c54016db3ae08502b0f/libraries/ts-chocolate/src/packlets/library-runtime/produced/fillingWrapper.ts#L101)

Factory method for creating a ProducedFilling from a source recipe version.

#### Parameters

##### source

[`IFillingRecipeVersion`](../interfaces/IFillingRecipeVersion.md)

Source filling recipe version with runtime wrapper

##### scaleFactor

`number` = `1.0`

Optional scale factor (default: 1.0)

#### Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`ProducedFilling`\>

Result containing ProducedFilling or error

***

### restoreFromHistory()

> `static` **restoreFromHistory**(`history`): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`ProducedFilling`\>

Defined in: [ts-chocolate/src/packlets/library-runtime/produced/fillingWrapper.ts:117](https://github.com/ErikFortune/fgv/blob/d51b0929f72c9206f7fc8c54016db3ae08502b0f/libraries/ts-chocolate/src/packlets/library-runtime/produced/fillingWrapper.ts#L117)

Factory method for restoring a ProducedFilling from serialized history.
Restores the complete editing state including undo/redo stacks.

#### Parameters

##### history

[`ISerializedEditingHistoryEntity`](../../Entities/namespaces/Session/interfaces/ISerializedEditingHistoryEntity.md)\<[`IProducedFillingEntity`](../../Entities/interfaces/IProducedFillingEntity.md)\>

Serialized editing history

#### Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`ProducedFilling`\>

Result containing ProducedFilling or error
