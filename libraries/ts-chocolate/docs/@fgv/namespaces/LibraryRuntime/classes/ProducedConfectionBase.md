[**@fgv/ts-chocolate**](../../../../README.md)

***

[@fgv/ts-chocolate](../../../../README.md) / [LibraryRuntime](../README.md) / ProducedConfectionBase

# Abstract Class: ProducedConfectionBase\<T\>

Defined in: [ts-chocolate/src/packlets/library-runtime/produced/confectionWrapper.ts:92](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/library-runtime/produced/confectionWrapper.ts#L92)

Mutable wrapper base class for IProducedConfection with undo/redo support.
Provides common editing methods and history management.

## Extended by

- [`ProducedMoldedBonBon`](ProducedMoldedBonBon.md)
- [`ProducedBarTruffle`](ProducedBarTruffle.md)
- [`ProducedRolledTruffle`](ProducedRolledTruffle.md)

## Type Parameters

### T

`T` *extends* [`AnyProducedConfectionEntity`](../../Entities/type-aliases/AnyProducedConfectionEntity.md)

## Properties

### \_current

> `protected` **\_current**: `T`

Defined in: [ts-chocolate/src/packlets/library-runtime/produced/confectionWrapper.ts:93](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/library-runtime/produced/confectionWrapper.ts#L93)

***

### \_redoStack

> `protected` **\_redoStack**: `T`[]

Defined in: [ts-chocolate/src/packlets/library-runtime/produced/confectionWrapper.ts:95](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/library-runtime/produced/confectionWrapper.ts#L95)

***

### \_undoStack

> `protected` **\_undoStack**: `T`[]

Defined in: [ts-chocolate/src/packlets/library-runtime/produced/confectionWrapper.ts:94](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/library-runtime/produced/confectionWrapper.ts#L94)

## Accessors

### current

#### Get Signature

> **get** **current**(): `T`

Defined in: [ts-chocolate/src/packlets/library-runtime/produced/confectionWrapper.ts:407](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/library-runtime/produced/confectionWrapper.ts#L407)

Gets the current produced confection.

##### Returns

`T`

***

### fillings

#### Get Signature

> **get** **fillings**(): readonly [`AnyResolvedFillingSlotEntity`](../../Entities/namespaces/Confections/type-aliases/AnyResolvedFillingSlotEntity.md)[] \| `undefined`

Defined in: [ts-chocolate/src/packlets/library-runtime/produced/confectionWrapper.ts:391](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/library-runtime/produced/confectionWrapper.ts#L391)

Gets the fillings as a readonly array.

##### Returns

readonly [`AnyResolvedFillingSlotEntity`](../../Entities/namespaces/Confections/type-aliases/AnyResolvedFillingSlotEntity.md)[] \| `undefined`

***

### notes

#### Get Signature

> **get** **notes**(): readonly [`ICategorizedNote`](../../Model/interfaces/ICategorizedNote.md)[] \| `undefined`

Defined in: [ts-chocolate/src/packlets/library-runtime/produced/confectionWrapper.ts:399](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/library-runtime/produced/confectionWrapper.ts#L399)

Gets the notes as a readonly array.

##### Returns

readonly [`ICategorizedNote`](../../Model/interfaces/ICategorizedNote.md)[] \| `undefined`

***

### procedureId

#### Get Signature

> **get** **procedureId**(): [`ProcedureId`](../../../../type-aliases/ProcedureId.md) \| `undefined`

Defined in: [ts-chocolate/src/packlets/library-runtime/produced/confectionWrapper.ts:415](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/library-runtime/produced/confectionWrapper.ts#L415)

Gets the procedure ID.

##### Returns

[`ProcedureId`](../../../../type-aliases/ProcedureId.md) \| `undefined`

***

### snapshot

#### Get Signature

> **get** **snapshot**(): `T`

Defined in: [ts-chocolate/src/packlets/library-runtime/produced/confectionWrapper.ts:367](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/library-runtime/produced/confectionWrapper.ts#L367)

Gets the current state as an immutable snapshot.

##### Returns

`T`

***

### versionId

#### Get Signature

> **get** **versionId**(): [`ConfectionVersionId`](../../../../type-aliases/ConfectionVersionId.md)

Defined in: [ts-chocolate/src/packlets/library-runtime/produced/confectionWrapper.ts:375](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/library-runtime/produced/confectionWrapper.ts#L375)

Gets the version ID.

##### Returns

[`ConfectionVersionId`](../../../../type-aliases/ConfectionVersionId.md)

***

### yield

#### Get Signature

> **get** **yield**(): [`IConfectionYield`](../../Entities/interfaces/IConfectionYield.md)

Defined in: [ts-chocolate/src/packlets/library-runtime/produced/confectionWrapper.ts:383](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/library-runtime/produced/confectionWrapper.ts#L383)

Gets the yield specification.

##### Returns

[`IConfectionYield`](../../Entities/interfaces/IConfectionYield.md)

## Methods

### \_baseChanges()

> `protected` **\_baseChanges**(`original`): `Partial`\<[`IConfectionChanges`](../interfaces/IConfectionChanges.md)\>

Defined in: [ts-chocolate/src/packlets/library-runtime/produced/confectionWrapper.ts:465](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/library-runtime/produced/confectionWrapper.ts#L465)

Compares base confection properties for equality.

#### Parameters

##### original

`T`

#### Returns

`Partial`\<[`IConfectionChanges`](../interfaces/IConfectionChanges.md)\>

***

### \_deepCopy()

> `abstract` `protected` **\_deepCopy**(`confection`): `T`

Defined in: [ts-chocolate/src/packlets/library-runtime/produced/confectionWrapper.ts:460](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/library-runtime/produced/confectionWrapper.ts#L460)

Creates a deep copy of a produced confection.

#### Parameters

##### confection

`T`

#### Returns

`T`

***

### \_pushUndo()

> `protected` **\_pushUndo**(): `void`

Defined in: [ts-chocolate/src/packlets/library-runtime/produced/confectionWrapper.ts:449](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/library-runtime/produced/confectionWrapper.ts#L449)

Pushes current state to undo stack, maintaining max size.

#### Returns

`void`

***

### canRedo()

> **canRedo**(): `boolean`

Defined in: [ts-chocolate/src/packlets/library-runtime/produced/confectionWrapper.ts:187](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/library-runtime/produced/confectionWrapper.ts#L187)

Checks if redo is available.

#### Returns

`boolean`

True if redo stack is not empty

***

### canUndo()

> **canUndo**(): `boolean`

Defined in: [ts-chocolate/src/packlets/library-runtime/produced/confectionWrapper.ts:178](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/library-runtime/produced/confectionWrapper.ts#L178)

Checks if undo is available.

#### Returns

`boolean`

True if undo stack is not empty

***

### createSnapshot()

> **createSnapshot**(): `T`

Defined in: [ts-chocolate/src/packlets/library-runtime/produced/confectionWrapper.ts:117](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/library-runtime/produced/confectionWrapper.ts#L117)

Creates an immutable snapshot of the current state.

#### Returns

`T`

Immutable copy of current produced confection

***

### getChanges()

> `abstract` **getChanges**(`original`): [`IConfectionChanges`](../interfaces/IConfectionChanges.md)

Defined in: [ts-chocolate/src/packlets/library-runtime/produced/confectionWrapper.ts:440](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/library-runtime/produced/confectionWrapper.ts#L440)

Gets detailed changes between current state and original.

#### Parameters

##### original

`T`

Original produced confection to compare against

#### Returns

[`IConfectionChanges`](../interfaces/IConfectionChanges.md)

Structure describing what changed

***

### getSerializedHistory()

> **getSerializedHistory**(`original`): [`ISerializedEditingHistoryEntity`](../../Entities/namespaces/Session/interfaces/ISerializedEditingHistoryEntity.md)\<`T`\>

Defined in: [ts-chocolate/src/packlets/library-runtime/produced/confectionWrapper.ts:202](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/library-runtime/produced/confectionWrapper.ts#L202)

Gets the serialized editing history for persistence.
Captures current state, original state, and undo/redo stacks.

#### Parameters

##### original

`T`

The original state when session started

#### Returns

[`ISerializedEditingHistoryEntity`](../../Entities/namespaces/Session/interfaces/ISerializedEditingHistoryEntity.md)\<`T`\>

Serialized editing history

***

### hasChanges()

> **hasChanges**(`original`): `boolean`

Defined in: [ts-chocolate/src/packlets/library-runtime/produced/confectionWrapper.ts:430](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/library-runtime/produced/confectionWrapper.ts#L430)

Checks if current state differs from original.
Uses deep equality check.

#### Parameters

##### original

`T`

Original produced confection to compare against

#### Returns

`boolean`

True if changes were detected

***

### redo()

> **redo**(): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`boolean`\>

Defined in: [ts-chocolate/src/packlets/library-runtime/produced/confectionWrapper.ts:162](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/library-runtime/produced/confectionWrapper.ts#L162)

Redoes the last undone change.
Pops from redo stack, pushes current to undo, and restores future state.

#### Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`boolean`\>

Success with true if redo succeeded, Success with false if no future

***

### removeFillingSlot()

> **removeFillingSlot**(`slotId`): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`void`\>

Defined in: [ts-chocolate/src/packlets/library-runtime/produced/confectionWrapper.ts:335](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/library-runtime/produced/confectionWrapper.ts#L335)

Removes a filling slot.
Pushes current state to undo before change, clears redo.

#### Parameters

##### slotId

[`SlotId`](../../../../type-aliases/SlotId.md)

Slot ID to remove

#### Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`void`\>

Success or failure

***

### restoreSnapshot()

> **restoreSnapshot**(`snapshot`): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`void`\>

Defined in: [ts-chocolate/src/packlets/library-runtime/produced/confectionWrapper.ts:128](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/library-runtime/produced/confectionWrapper.ts#L128)

Restores state from a snapshot.
Pushes current state to undo stack and clears redo stack.

#### Parameters

##### snapshot

`T`

Snapshot to restore

#### Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`void`\>

Success or failure

***

### scaleToYield()

> **scaleToYield**(`yieldSpec`): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`IConfectionYield`](../../Entities/interfaces/IConfectionYield.md)\>

Defined in: [ts-chocolate/src/packlets/library-runtime/produced/confectionWrapper.ts:264](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/library-runtime/produced/confectionWrapper.ts#L264)

Scales to a new yield specification.
Pushes current state to undo before change, clears redo.

Note: This method updates the yield in the confection data. Actual filling scaling
must be handled at a higher level (e.g., in sessions) where the filling library is accessible.

#### Parameters

##### yieldSpec

[`IConfectionYield`](../../Entities/interfaces/IConfectionYield.md)

Target yield specification

#### Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`IConfectionYield`](../../Entities/interfaces/IConfectionYield.md)\>

Success with actual achieved yield, or failure

***

### setFillingSlot()

> **setFillingSlot**(`slotId`, `choice`): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`void`\>

Defined in: [ts-chocolate/src/packlets/library-runtime/produced/confectionWrapper.ts:291](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/library-runtime/produced/confectionWrapper.ts#L291)

Sets or updates a filling slot.
Pushes current state to undo before change, clears redo.

#### Parameters

##### slotId

[`SlotId`](../../../../type-aliases/SlotId.md)

Slot ID

##### choice

Filling choice (recipe or ingredient)

\{ `fillingId`: [`FillingId`](../../../../type-aliases/FillingId.md); `type`: `"recipe"`; \} | \{ `ingredientId`: [`IngredientId`](../../../../type-aliases/IngredientId.md); `type`: `"ingredient"`; \}

#### Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`void`\>

Success or failure

***

### setNotes()

> **setNotes**(`notes`): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`void`\>

Defined in: [ts-chocolate/src/packlets/library-runtime/produced/confectionWrapper.ts:222](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/library-runtime/produced/confectionWrapper.ts#L222)

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

Defined in: [ts-chocolate/src/packlets/library-runtime/produced/confectionWrapper.ts:241](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/library-runtime/produced/confectionWrapper.ts#L241)

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

Defined in: [ts-chocolate/src/packlets/library-runtime/produced/confectionWrapper.ts:145](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/library-runtime/produced/confectionWrapper.ts#L145)

Undoes the last change.
Pops from undo stack, pushes current to redo, and restores previous state.

#### Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`boolean`\>

Success with true if undo succeeded, Success with false if no history
