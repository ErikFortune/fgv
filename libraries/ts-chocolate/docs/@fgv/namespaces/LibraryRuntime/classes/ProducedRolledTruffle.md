[**@fgv/ts-chocolate**](../../../../README.md)

***

[@fgv/ts-chocolate](../../../../README.md) / [LibraryRuntime](../README.md) / ProducedRolledTruffle

# Class: ProducedRolledTruffle

Defined in: [ts-chocolate/src/packlets/library-runtime/produced/confectionWrapper.ts:1065](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/produced/confectionWrapper.ts#L1065)

Mutable wrapper for IProducedRolledTruffle with undo/redo support.
Provides rolled truffle-specific editing methods.

## Extends

- [`ProducedConfectionBase`](ProducedConfectionBase.md)\<[`IProducedRolledTruffleEntity`](../../Entities/interfaces/IProducedRolledTruffleEntity.md)\>

## Properties

### \_current

> `protected` **\_current**: [`IProducedRolledTruffleEntity`](../../Entities/interfaces/IProducedRolledTruffleEntity.md)

Defined in: [ts-chocolate/src/packlets/library-runtime/produced/confectionWrapper.ts:93](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/produced/confectionWrapper.ts#L93)

#### Inherited from

[`ProducedConfectionBase`](ProducedConfectionBase.md).[`_current`](ProducedConfectionBase.md#_current)

***

### \_redoStack

> `protected` **\_redoStack**: [`IProducedRolledTruffleEntity`](../../Entities/interfaces/IProducedRolledTruffleEntity.md)[]

Defined in: [ts-chocolate/src/packlets/library-runtime/produced/confectionWrapper.ts:95](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/produced/confectionWrapper.ts#L95)

#### Inherited from

[`ProducedConfectionBase`](ProducedConfectionBase.md).[`_redoStack`](ProducedConfectionBase.md#_redostack)

***

### \_undoStack

> `protected` **\_undoStack**: [`IProducedRolledTruffleEntity`](../../Entities/interfaces/IProducedRolledTruffleEntity.md)[]

Defined in: [ts-chocolate/src/packlets/library-runtime/produced/confectionWrapper.ts:94](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/produced/confectionWrapper.ts#L94)

#### Inherited from

[`ProducedConfectionBase`](ProducedConfectionBase.md).[`_undoStack`](ProducedConfectionBase.md#_undostack)

## Accessors

### coatingId

#### Get Signature

> **get** **coatingId**(): [`IngredientId`](../../../../type-aliases/IngredientId.md) \| `undefined`

Defined in: [ts-chocolate/src/packlets/library-runtime/produced/confectionWrapper.ts:1233](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/produced/confectionWrapper.ts#L1233)

Gets the coating ID.

##### Returns

[`IngredientId`](../../../../type-aliases/IngredientId.md) \| `undefined`

***

### current

#### Get Signature

> **get** **current**(): `T`

Defined in: [ts-chocolate/src/packlets/library-runtime/produced/confectionWrapper.ts:407](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/produced/confectionWrapper.ts#L407)

Gets the current produced confection.

##### Returns

`T`

#### Inherited from

[`ProducedConfectionBase`](ProducedConfectionBase.md).[`current`](ProducedConfectionBase.md#current)

***

### enrobingChocolateId

#### Get Signature

> **get** **enrobingChocolateId**(): [`IngredientId`](../../../../type-aliases/IngredientId.md) \| `undefined`

Defined in: [ts-chocolate/src/packlets/library-runtime/produced/confectionWrapper.ts:1225](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/produced/confectionWrapper.ts#L1225)

Gets the enrobing chocolate ID.

##### Returns

[`IngredientId`](../../../../type-aliases/IngredientId.md) \| `undefined`

***

### fillings

#### Get Signature

> **get** **fillings**(): readonly [`AnyResolvedFillingSlotEntity`](../../Entities/namespaces/Confections/type-aliases/AnyResolvedFillingSlotEntity.md)[] \| `undefined`

Defined in: [ts-chocolate/src/packlets/library-runtime/produced/confectionWrapper.ts:391](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/produced/confectionWrapper.ts#L391)

Gets the fillings as a readonly array.

##### Returns

readonly [`AnyResolvedFillingSlotEntity`](../../Entities/namespaces/Confections/type-aliases/AnyResolvedFillingSlotEntity.md)[] \| `undefined`

#### Inherited from

[`ProducedConfectionBase`](ProducedConfectionBase.md).[`fillings`](ProducedConfectionBase.md#fillings)

***

### notes

#### Get Signature

> **get** **notes**(): readonly [`ICategorizedNote`](../../Model/interfaces/ICategorizedNote.md)[] \| `undefined`

Defined in: [ts-chocolate/src/packlets/library-runtime/produced/confectionWrapper.ts:399](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/produced/confectionWrapper.ts#L399)

Gets the notes as a readonly array.

##### Returns

readonly [`ICategorizedNote`](../../Model/interfaces/ICategorizedNote.md)[] \| `undefined`

#### Inherited from

[`ProducedConfectionBase`](ProducedConfectionBase.md).[`notes`](ProducedConfectionBase.md#notes)

***

### procedureId

#### Get Signature

> **get** **procedureId**(): [`ProcedureId`](../../../../type-aliases/ProcedureId.md) \| `undefined`

Defined in: [ts-chocolate/src/packlets/library-runtime/produced/confectionWrapper.ts:415](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/produced/confectionWrapper.ts#L415)

Gets the procedure ID.

##### Returns

[`ProcedureId`](../../../../type-aliases/ProcedureId.md) \| `undefined`

#### Inherited from

[`ProducedConfectionBase`](ProducedConfectionBase.md).[`procedureId`](ProducedConfectionBase.md#procedureid)

***

### snapshot

#### Get Signature

> **get** **snapshot**(): `T`

Defined in: [ts-chocolate/src/packlets/library-runtime/produced/confectionWrapper.ts:367](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/produced/confectionWrapper.ts#L367)

Gets the current state as an immutable snapshot.

##### Returns

`T`

#### Inherited from

[`ProducedConfectionBase`](ProducedConfectionBase.md).[`snapshot`](ProducedConfectionBase.md#snapshot)

***

### versionId

#### Get Signature

> **get** **versionId**(): [`ConfectionVersionId`](../../../../type-aliases/ConfectionVersionId.md)

Defined in: [ts-chocolate/src/packlets/library-runtime/produced/confectionWrapper.ts:375](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/produced/confectionWrapper.ts#L375)

Gets the version ID.

##### Returns

[`ConfectionVersionId`](../../../../type-aliases/ConfectionVersionId.md)

#### Inherited from

[`ProducedConfectionBase`](ProducedConfectionBase.md).[`versionId`](ProducedConfectionBase.md#versionid)

***

### yield

#### Get Signature

> **get** **yield**(): [`IConfectionYield`](../../Entities/interfaces/IConfectionYield.md)

Defined in: [ts-chocolate/src/packlets/library-runtime/produced/confectionWrapper.ts:383](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/produced/confectionWrapper.ts#L383)

Gets the yield specification.

##### Returns

[`IConfectionYield`](../../Entities/interfaces/IConfectionYield.md)

#### Inherited from

[`ProducedConfectionBase`](ProducedConfectionBase.md).[`yield`](ProducedConfectionBase.md#yield)

## Methods

### \_baseChanges()

> `protected` **\_baseChanges**(`original`): `Partial`\<[`IConfectionChanges`](../interfaces/IConfectionChanges.md)\>

Defined in: [ts-chocolate/src/packlets/library-runtime/produced/confectionWrapper.ts:465](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/produced/confectionWrapper.ts#L465)

Compares base confection properties for equality.

#### Parameters

##### original

[`IProducedRolledTruffleEntity`](../../Entities/interfaces/IProducedRolledTruffleEntity.md)

#### Returns

`Partial`\<[`IConfectionChanges`](../interfaces/IConfectionChanges.md)\>

#### Inherited from

[`ProducedConfectionBase`](ProducedConfectionBase.md).[`_baseChanges`](ProducedConfectionBase.md#_basechanges)

***

### \_deepCopy()

> `protected` **\_deepCopy**(`confection`): [`IProducedRolledTruffleEntity`](../../Entities/interfaces/IProducedRolledTruffleEntity.md)

Defined in: [ts-chocolate/src/packlets/library-runtime/produced/confectionWrapper.ts:1269](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/produced/confectionWrapper.ts#L1269)

Creates a deep copy of a produced confection.

#### Parameters

##### confection

[`IProducedRolledTruffleEntity`](../../Entities/interfaces/IProducedRolledTruffleEntity.md)

#### Returns

[`IProducedRolledTruffleEntity`](../../Entities/interfaces/IProducedRolledTruffleEntity.md)

#### Overrides

[`ProducedConfectionBase`](ProducedConfectionBase.md).[`_deepCopy`](ProducedConfectionBase.md#_deepcopy)

***

### \_pushUndo()

> `protected` **\_pushUndo**(): `void`

Defined in: [ts-chocolate/src/packlets/library-runtime/produced/confectionWrapper.ts:449](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/produced/confectionWrapper.ts#L449)

Pushes current state to undo stack, maintaining max size.

#### Returns

`void`

#### Inherited from

[`ProducedConfectionBase`](ProducedConfectionBase.md).[`_pushUndo`](ProducedConfectionBase.md#_pushundo)

***

### canRedo()

> **canRedo**(): `boolean`

Defined in: [ts-chocolate/src/packlets/library-runtime/produced/confectionWrapper.ts:187](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/produced/confectionWrapper.ts#L187)

Checks if redo is available.

#### Returns

`boolean`

True if redo stack is not empty

#### Inherited from

[`ProducedConfectionBase`](ProducedConfectionBase.md).[`canRedo`](ProducedConfectionBase.md#canredo)

***

### canUndo()

> **canUndo**(): `boolean`

Defined in: [ts-chocolate/src/packlets/library-runtime/produced/confectionWrapper.ts:178](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/produced/confectionWrapper.ts#L178)

Checks if undo is available.

#### Returns

`boolean`

True if undo stack is not empty

#### Inherited from

[`ProducedConfectionBase`](ProducedConfectionBase.md).[`canUndo`](ProducedConfectionBase.md#canundo)

***

### createSnapshot()

> **createSnapshot**(): [`IProducedRolledTruffleEntity`](../../Entities/interfaces/IProducedRolledTruffleEntity.md)

Defined in: [ts-chocolate/src/packlets/library-runtime/produced/confectionWrapper.ts:117](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/produced/confectionWrapper.ts#L117)

Creates an immutable snapshot of the current state.

#### Returns

[`IProducedRolledTruffleEntity`](../../Entities/interfaces/IProducedRolledTruffleEntity.md)

Immutable copy of current produced confection

#### Inherited from

[`ProducedConfectionBase`](ProducedConfectionBase.md).[`createSnapshot`](ProducedConfectionBase.md#createsnapshot)

***

### getChanges()

> **getChanges**(`original`): [`IConfectionChanges`](../interfaces/IConfectionChanges.md)

Defined in: [ts-chocolate/src/packlets/library-runtime/produced/confectionWrapper.ts:1241](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/produced/confectionWrapper.ts#L1241)

Gets detailed changes between current state and original.

#### Parameters

##### original

[`IProducedRolledTruffleEntity`](../../Entities/interfaces/IProducedRolledTruffleEntity.md)

Original produced confection to compare against

#### Returns

[`IConfectionChanges`](../interfaces/IConfectionChanges.md)

Structure describing what changed

#### Overrides

[`ProducedConfectionBase`](ProducedConfectionBase.md).[`getChanges`](ProducedConfectionBase.md#getchanges)

***

### getSerializedHistory()

> **getSerializedHistory**(`original`): [`ISerializedEditingHistoryEntity`](../../Entities/namespaces/Session/interfaces/ISerializedEditingHistoryEntity.md)\<[`IProducedRolledTruffleEntity`](../../Entities/interfaces/IProducedRolledTruffleEntity.md)\>

Defined in: [ts-chocolate/src/packlets/library-runtime/produced/confectionWrapper.ts:202](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/produced/confectionWrapper.ts#L202)

Gets the serialized editing history for persistence.
Captures current state, original state, and undo/redo stacks.

#### Parameters

##### original

[`IProducedRolledTruffleEntity`](../../Entities/interfaces/IProducedRolledTruffleEntity.md)

The original state when session started

#### Returns

[`ISerializedEditingHistoryEntity`](../../Entities/namespaces/Session/interfaces/ISerializedEditingHistoryEntity.md)\<[`IProducedRolledTruffleEntity`](../../Entities/interfaces/IProducedRolledTruffleEntity.md)\>

Serialized editing history

#### Inherited from

[`ProducedConfectionBase`](ProducedConfectionBase.md).[`getSerializedHistory`](ProducedConfectionBase.md#getserializedhistory)

***

### hasChanges()

> **hasChanges**(`original`): `boolean`

Defined in: [ts-chocolate/src/packlets/library-runtime/produced/confectionWrapper.ts:430](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/produced/confectionWrapper.ts#L430)

Checks if current state differs from original.
Uses deep equality check.

#### Parameters

##### original

[`IProducedRolledTruffleEntity`](../../Entities/interfaces/IProducedRolledTruffleEntity.md)

Original produced confection to compare against

#### Returns

`boolean`

True if changes were detected

#### Inherited from

[`ProducedConfectionBase`](ProducedConfectionBase.md).[`hasChanges`](ProducedConfectionBase.md#haschanges)

***

### redo()

> **redo**(): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`boolean`\>

Defined in: [ts-chocolate/src/packlets/library-runtime/produced/confectionWrapper.ts:162](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/produced/confectionWrapper.ts#L162)

Redoes the last undone change.
Pops from redo stack, pushes current to undo, and restores future state.

#### Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`boolean`\>

Success with true if redo succeeded, Success with false if no future

#### Inherited from

[`ProducedConfectionBase`](ProducedConfectionBase.md).[`redo`](ProducedConfectionBase.md#redo)

***

### removeFillingSlot()

> **removeFillingSlot**(`slotId`): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`void`\>

Defined in: [ts-chocolate/src/packlets/library-runtime/produced/confectionWrapper.ts:335](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/produced/confectionWrapper.ts#L335)

Removes a filling slot.
Pushes current state to undo before change, clears redo.

#### Parameters

##### slotId

[`SlotId`](../../../../type-aliases/SlotId.md)

Slot ID to remove

#### Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`void`\>

Success or failure

#### Inherited from

[`ProducedConfectionBase`](ProducedConfectionBase.md).[`removeFillingSlot`](ProducedConfectionBase.md#removefillingslot)

***

### restoreSnapshot()

> **restoreSnapshot**(`snapshot`): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`void`\>

Defined in: [ts-chocolate/src/packlets/library-runtime/produced/confectionWrapper.ts:128](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/produced/confectionWrapper.ts#L128)

Restores state from a snapshot.
Pushes current state to undo stack and clears redo stack.

#### Parameters

##### snapshot

[`IProducedRolledTruffleEntity`](../../Entities/interfaces/IProducedRolledTruffleEntity.md)

Snapshot to restore

#### Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`void`\>

Success or failure

#### Inherited from

[`ProducedConfectionBase`](ProducedConfectionBase.md).[`restoreSnapshot`](ProducedConfectionBase.md#restoresnapshot)

***

### scaleToYield()

> **scaleToYield**(`yieldSpec`): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`IConfectionYield`](../../Entities/interfaces/IConfectionYield.md)\>

Defined in: [ts-chocolate/src/packlets/library-runtime/produced/confectionWrapper.ts:264](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/produced/confectionWrapper.ts#L264)

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

#### Inherited from

[`ProducedConfectionBase`](ProducedConfectionBase.md).[`scaleToYield`](ProducedConfectionBase.md#scaletoyield)

***

### setCoating()

> **setCoating**(`coatingId`): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`void`\>

Defined in: [ts-chocolate/src/packlets/library-runtime/produced/confectionWrapper.ts:1205](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/produced/confectionWrapper.ts#L1205)

Sets the coating.
Pushes current state to undo before change, clears redo.

#### Parameters

##### coatingId

Coating ingredient ID or undefined to clear

[`IngredientId`](../../../../type-aliases/IngredientId.md) | `undefined`

#### Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`void`\>

Success or failure

***

### setEnrobingChocolate()

> **setEnrobingChocolate**(`chocolateId`): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`void`\>

Defined in: [ts-chocolate/src/packlets/library-runtime/produced/confectionWrapper.ts:1186](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/produced/confectionWrapper.ts#L1186)

Sets the enrobing chocolate.
Pushes current state to undo before change, clears redo.

#### Parameters

##### chocolateId

Enrobing chocolate ingredient ID or undefined to clear

[`IngredientId`](../../../../type-aliases/IngredientId.md) | `undefined`

#### Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`void`\>

Success or failure

***

### setFillingSlot()

> **setFillingSlot**(`slotId`, `choice`): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`void`\>

Defined in: [ts-chocolate/src/packlets/library-runtime/produced/confectionWrapper.ts:291](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/produced/confectionWrapper.ts#L291)

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

#### Inherited from

[`ProducedConfectionBase`](ProducedConfectionBase.md).[`setFillingSlot`](ProducedConfectionBase.md#setfillingslot)

***

### setNotes()

> **setNotes**(`notes`): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`void`\>

Defined in: [ts-chocolate/src/packlets/library-runtime/produced/confectionWrapper.ts:222](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/produced/confectionWrapper.ts#L222)

Sets the notes.
Pushes current state to undo before change, clears redo.

#### Parameters

##### notes

[`ICategorizedNote`](../../Model/interfaces/ICategorizedNote.md)[]

Categorized notes array

#### Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`void`\>

Success or failure

#### Inherited from

[`ProducedConfectionBase`](ProducedConfectionBase.md).[`setNotes`](ProducedConfectionBase.md#setnotes)

***

### setProcedure()

> **setProcedure**(`id`): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`void`\>

Defined in: [ts-chocolate/src/packlets/library-runtime/produced/confectionWrapper.ts:241](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/produced/confectionWrapper.ts#L241)

Sets the procedure.
Pushes current state to undo before change, clears redo.

#### Parameters

##### id

Procedure ID or undefined to clear

[`ProcedureId`](../../../../type-aliases/ProcedureId.md) | `undefined`

#### Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`void`\>

Success or failure

#### Inherited from

[`ProducedConfectionBase`](ProducedConfectionBase.md).[`setProcedure`](ProducedConfectionBase.md#setprocedure)

***

### undo()

> **undo**(): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`boolean`\>

Defined in: [ts-chocolate/src/packlets/library-runtime/produced/confectionWrapper.ts:145](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/produced/confectionWrapper.ts#L145)

Undoes the last change.
Pops from undo stack, pushes current to redo, and restores previous state.

#### Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`boolean`\>

Success with true if undo succeeded, Success with false if no history

#### Inherited from

[`ProducedConfectionBase`](ProducedConfectionBase.md).[`undo`](ProducedConfectionBase.md#undo)

***

### create()

> `static` **create**(`initial`): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`ProducedRolledTruffle`\>

Defined in: [ts-chocolate/src/packlets/library-runtime/produced/confectionWrapper.ts:1072](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/produced/confectionWrapper.ts#L1072)

Factory method for creating a ProducedRolledTruffle from an existing produced rolled truffle.

#### Parameters

##### initial

[`IProducedRolledTruffleEntity`](../../Entities/interfaces/IProducedRolledTruffleEntity.md)

The initial produced rolled truffle state

#### Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`ProducedRolledTruffle`\>

Success with ProducedRolledTruffle

***

### fromSource()

> `static` **fromSource**(`source`): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`ProducedRolledTruffle`\>

Defined in: [ts-chocolate/src/packlets/library-runtime/produced/confectionWrapper.ts:1082](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/produced/confectionWrapper.ts#L1082)

Factory method for creating a ProducedRolledTruffle from a source version.

#### Parameters

##### source

[`IRolledTruffleVersion`](../interfaces/IRolledTruffleVersion.md)

Source rolled truffle version with runtime wrapper

#### Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`ProducedRolledTruffle`\>

Result containing ProducedRolledTruffle or error

***

### restoreFromHistory()

> `static` **restoreFromHistory**(`history`): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`ProducedRolledTruffle`\>

Defined in: [ts-chocolate/src/packlets/library-runtime/produced/confectionWrapper.ts:1094](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/produced/confectionWrapper.ts#L1094)

Restores a ProducedRolledTruffle from serialized editing history.

#### Parameters

##### history

[`ISerializedEditingHistoryEntity`](../../Entities/namespaces/Session/interfaces/ISerializedEditingHistoryEntity.md)\<[`IProducedRolledTruffleEntity`](../../Entities/interfaces/IProducedRolledTruffleEntity.md)\>

Serialized editing history

#### Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`ProducedRolledTruffle`\>

Result containing ProducedRolledTruffle or error
