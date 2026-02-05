[**@fgv/ts-chocolate**](../../../../../../README.md)

***

[@fgv/ts-chocolate](../../../../../../README.md) / [Runtime](../../../README.md) / [Session](../README.md) / EditingSession

# Class: EditingSession

Defined in: [ts-chocolate/src/packlets/runtime/session/editingSession.ts:74](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/runtime/session/editingSession.ts#L74)

A mutable editing session for modifying filling recipe versions.

Core architecture:
- Wraps an IRuntimeFillingRecipeVersion (immutable source)
- Uses RuntimeProducedFilling for mutable editing with undo/redo
- Tracks original snapshot for change detection
- Provides save operations that integrate with library

## Accessors

### baseRecipe

#### Get Signature

> **get** **baseRecipe**(): [`IFillingRecipeVersion`](../../../../LibraryRuntime/interfaces/IFillingRecipeVersion.md)

Defined in: [ts-chocolate/src/packlets/runtime/session/editingSession.ts:452](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/runtime/session/editingSession.ts#L452)

The base recipe version being edited.

##### Returns

[`IFillingRecipeVersion`](../../../../LibraryRuntime/interfaces/IFillingRecipeVersion.md)

***

### hasChanges

#### Get Signature

> **get** **hasChanges**(): `boolean`

Defined in: [ts-chocolate/src/packlets/runtime/session/editingSession.ts:476](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/runtime/session/editingSession.ts#L476)

Whether the session has unsaved changes.

##### Returns

`boolean`

***

### produced

#### Get Signature

> **get** **produced**(): [`ProducedFilling`](../../../../LibraryRuntime/classes/ProducedFilling.md)

Defined in: [ts-chocolate/src/packlets/runtime/session/editingSession.ts:460](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/runtime/session/editingSession.ts#L460)

The produced filling wrapper with undo/redo support.

##### Returns

[`ProducedFilling`](../../../../LibraryRuntime/classes/ProducedFilling.md)

***

### sessionId

#### Get Signature

> **get** **sessionId**(): [`SessionSpec`](../../../../../../type-aliases/SessionSpec.md)

Defined in: [ts-chocolate/src/packlets/runtime/session/editingSession.ts:444](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/runtime/session/editingSession.ts#L444)

Unique session identifier.

##### Returns

[`SessionSpec`](../../../../../../type-aliases/SessionSpec.md)

***

### targetWeight

#### Get Signature

> **get** **targetWeight**(): [`Measurement`](../../../../../../type-aliases/Measurement.md)

Defined in: [ts-chocolate/src/packlets/runtime/session/editingSession.ts:468](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/runtime/session/editingSession.ts#L468)

Current target weight for this filling.

##### Returns

[`Measurement`](../../../../../../type-aliases/Measurement.md)

## Methods

### analyzeSaveOptions()

> **analyzeSaveOptions**(): [`ISaveAnalysis`](../interfaces/ISaveAnalysis.md)

Defined in: [ts-chocolate/src/packlets/runtime/session/editingSession.ts:232](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/runtime/session/editingSession.ts#L232)

Analyzes current changes and recommends save options.

#### Returns

[`ISaveAnalysis`](../interfaces/ISaveAnalysis.md)

Analysis of changes and available save options

***

### canRedo()

> **canRedo**(): `boolean`

Defined in: [ts-chocolate/src/packlets/runtime/session/editingSession.ts:219](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/runtime/session/editingSession.ts#L219)

Checks if redo is available.

#### Returns

`boolean`

True if redo stack is not empty

***

### canUndo()

> **canUndo**(): `boolean`

Defined in: [ts-chocolate/src/packlets/runtime/session/editingSession.ts:210](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/runtime/session/editingSession.ts#L210)

Checks if undo is available.

#### Returns

`boolean`

True if undo stack is not empty

***

### redo()

> **redo**(): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`boolean`\>

Defined in: [ts-chocolate/src/packlets/runtime/session/editingSession.ts:201](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/runtime/session/editingSession.ts#L201)

Redoes the last undone change.

#### Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`boolean`\>

Success with true if redo succeeded, Success with false if no future

***

### removeIngredient()

> **removeIngredient**(`id`): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`void`\>

Defined in: [ts-chocolate/src/packlets/runtime/session/editingSession.ts:147](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/runtime/session/editingSession.ts#L147)

Removes an ingredient from the filling.

#### Parameters

##### id

[`IngredientId`](../../../../../../type-aliases/IngredientId.md)

Ingredient ID to remove

#### Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`void`\>

Success or failure

***

### saveAsAlternatives()

> **saveAsAlternatives**(`options`): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`ISaveResult`](../interfaces/ISaveResult.md)\>

Defined in: [ts-chocolate/src/packlets/runtime/session/editingSession.ts:290](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/runtime/session/editingSession.ts#L290)

Saves by adding ingredients as alternatives to existing version.
Requires that the collection is mutable and ingredients changed.

#### Parameters

##### options

[`ISaveAlternativesOptions`](../interfaces/ISaveAlternativesOptions.md)

Save options including version spec

#### Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`ISaveResult`](../interfaces/ISaveResult.md)\>

Result with save result containing journal entry

***

### saveAsNewRecipe()

> **saveAsNewRecipe**(`options`): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`ISaveResult`](../interfaces/ISaveResult.md)\>

Defined in: [ts-chocolate/src/packlets/runtime/session/editingSession.ts:316](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/runtime/session/editingSession.ts#L316)

Saves as an entirely new recipe with new ID.
Use when collection is immutable or creating a derivative recipe.

#### Parameters

##### options

[`ISaveNewRecipeOptions`](../interfaces/ISaveNewRecipeOptions.md)

Save options including new ID, version spec, and base weight

#### Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`ISaveResult`](../interfaces/ISaveResult.md)\>

Result with save result containing journal entry

***

### saveAsNewVersion()

> **saveAsNewVersion**(`options`): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`ISaveResult`](../interfaces/ISaveResult.md)\>

Defined in: [ts-chocolate/src/packlets/runtime/session/editingSession.ts:264](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/runtime/session/editingSession.ts#L264)

Saves as a new version of the original recipe.
Requires that the collection is mutable.

#### Parameters

##### options

[`ISaveVersionOptions`](../interfaces/ISaveVersionOptions.md)

Save options including version spec and base weight

#### Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`ISaveResult`](../interfaces/ISaveResult.md)\>

Result with save result containing journal entry and version spec

***

### scaleToTargetWeight()

> **scaleToTargetWeight**(`targetWeight`): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`Measurement`](../../../../../../type-aliases/Measurement.md)\>

Defined in: [ts-chocolate/src/packlets/runtime/session/editingSession.ts:159](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/runtime/session/editingSession.ts#L159)

Scales the filling to achieve a target weight.
Weight-contributing ingredients (g, mL) are scaled proportionally.
Non-weight ingredients (tsp, Tbsp, pinch, etc.) remain unchanged.

#### Parameters

##### targetWeight

[`Measurement`](../../../../../../type-aliases/Measurement.md)

Desired total weight

#### Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`Measurement`](../../../../../../type-aliases/Measurement.md)\>

Success with actual achieved weight, or failure

***

### setIngredient()

> **setIngredient**(`id`, `amount`, `unit?`, `modifiers?`): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`void`\>

Defined in: [ts-chocolate/src/packlets/runtime/session/editingSession.ts:132](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/runtime/session/editingSession.ts#L132)

Sets or updates an ingredient in the filling.

#### Parameters

##### id

[`IngredientId`](../../../../../../type-aliases/IngredientId.md)

Ingredient ID

##### amount

[`Measurement`](../../../../../../type-aliases/Measurement.md)

Amount of ingredient

##### unit?

[`MeasurementUnit`](../../../../../../type-aliases/MeasurementUnit.md)

Optional measurement unit (default: 'g')

##### modifiers?

[`IIngredientModifiers`](../../../../Entities/namespaces/Fillings/interfaces/IIngredientModifiers.md)

Optional ingredient modifiers (spoonLevel, toTaste)

#### Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`void`\>

Success or failure

***

### setNotes()

> **setNotes**(`notes`): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`void`\>

Defined in: [ts-chocolate/src/packlets/runtime/session/editingSession.ts:169](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/runtime/session/editingSession.ts#L169)

Sets the notes for the filling.

#### Parameters

##### notes

[`ICategorizedNote`](../../../../Model/interfaces/ICategorizedNote.md)[]

Categorized notes array

#### Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`void`\>

Success or failure

***

### setProcedure()

> **setProcedure**(`id`): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`void`\>

Defined in: [ts-chocolate/src/packlets/runtime/session/editingSession.ts:179](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/runtime/session/editingSession.ts#L179)

Sets the procedure for the filling.

#### Parameters

##### id

Procedure ID or undefined to clear

[`ProcedureId`](../../../../../../type-aliases/ProcedureId.md) | `undefined`

#### Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`void`\>

Success or failure

***

### toEditJournalEntry()

> **toEditJournalEntry**(`notes?`): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`IFillingEditJournalEntryEntity`](../../../../Entities/interfaces/IFillingEditJournalEntryEntity.md)\>

Defined in: [ts-chocolate/src/packlets/runtime/session/editingSession.ts:341](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/runtime/session/editingSession.ts#L341)

Creates an edit journal entry from this session.
Records the original version and any modifications made.

#### Parameters

##### notes?

[`ICategorizedNote`](../../../../Model/interfaces/ICategorizedNote.md)[]

Optional notes to include in the journal entry

#### Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`IFillingEditJournalEntryEntity`](../../../../Entities/interfaces/IFillingEditJournalEntryEntity.md)\>

Result with journal entry

***

### toPersistedState()

> **toPersistedState**(`options`): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`IFillingSessionEntity`](../../../../Entities/interfaces/IFillingSessionEntity.md)\>

Defined in: [ts-chocolate/src/packlets/runtime/session/editingSession.ts:380](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/runtime/session/editingSession.ts#L380)

Creates a persisted session state from this editing session.
Captures the complete editing state including undo/redo history.

#### Parameters

##### options

Persistence options including collection ID

###### baseId?

[`BaseSessionId`](../../../../../../type-aliases/BaseSessionId.md)

###### collectionId

[`CollectionId`](../../../../../../type-aliases/CollectionId.md)

###### label?

`string`

###### notes?

[`ICategorizedNote`](../../../../Model/interfaces/ICategorizedNote.md)[]

###### status?

[`PersistedSessionStatus`](../../../../Entities/type-aliases/PersistedSessionStatus.md)

#### Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`IFillingSessionEntity`](../../../../Entities/interfaces/IFillingSessionEntity.md)\>

Result with persisted filling session

***

### toProductionJournalEntry()

> **toProductionJournalEntry**(`notes?`): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`IFillingProductionJournalEntryEntity`](../../../../Entities/interfaces/IFillingProductionJournalEntryEntity.md)\>

Defined in: [ts-chocolate/src/packlets/runtime/session/editingSession.ts:352](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/runtime/session/editingSession.ts#L352)

Creates a production journal entry from this session.
Records the produced filling with resolved concrete choices.

#### Parameters

##### notes?

[`ICategorizedNote`](../../../../Model/interfaces/ICategorizedNote.md)[]

Optional notes to include in the journal entry

#### Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`IFillingProductionJournalEntryEntity`](../../../../Entities/interfaces/IFillingProductionJournalEntryEntity.md)\>

Result with production journal entry

***

### undo()

> **undo**(): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`boolean`\>

Defined in: [ts-chocolate/src/packlets/runtime/session/editingSession.ts:192](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/runtime/session/editingSession.ts#L192)

Undoes the last change.

#### Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`boolean`\>

Success with true if undo succeeded, Success with false if no history

***

### create()

> `static` **create**(`baseRecipe`, `initialScale?`): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`EditingSession`\>

Defined in: [ts-chocolate/src/packlets/runtime/session/editingSession.ts:108](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/runtime/session/editingSession.ts#L108)

Creates a new EditingSession from a base recipe version.

#### Parameters

##### baseRecipe

[`IFillingRecipeVersion`](../../../../LibraryRuntime/interfaces/IFillingRecipeVersion.md)

Source recipe version to edit

##### initialScale?

`number`

Optional initial scale factor (default: 1.0)

#### Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`EditingSession`\>

Result with new EditingSession or error

***

### fromPersistedState()

> `static` **fromPersistedState**(`data`, `baseRecipe`): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`EditingSession`\>

Defined in: [ts-chocolate/src/packlets/runtime/session/editingSession.ts:417](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/runtime/session/editingSession.ts#L417)

Restores an editing session from a persisted state.
Restores the complete editing state including undo/redo history.

#### Parameters

##### data

[`IFillingSessionEntity`](../../../../Entities/interfaces/IFillingSessionEntity.md)

Persisted session data

##### baseRecipe

[`IFillingRecipeVersion`](../../../../LibraryRuntime/interfaces/IFillingRecipeVersion.md)

Runtime recipe version to associate with the session

#### Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`EditingSession`\>

Result with restored EditingSession
