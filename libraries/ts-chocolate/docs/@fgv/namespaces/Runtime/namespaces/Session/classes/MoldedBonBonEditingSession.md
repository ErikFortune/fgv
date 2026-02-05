[**@fgv/ts-chocolate**](../../../../../../README.md)

***

[@fgv/ts-chocolate](../../../../../../README.md) / [Runtime](../../../README.md) / [Session](../README.md) / MoldedBonBonEditingSession

# Class: MoldedBonBonEditingSession

Defined in: [ts-chocolate/src/packlets/runtime/session/moldedBonBonEditingSession.ts:46](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/runtime/session/moldedBonBonEditingSession.ts#L46)

Editing session for molded bonbon confections.
Supports frame-based yield specification and mold change workflow.

## Extends

- [`ConfectionEditingSessionBase`](ConfectionEditingSessionBase.md)\<[`IProducedMoldedBonBonEntity`](../../../../Entities/interfaces/IProducedMoldedBonBonEntity.md), [`MoldedBonBon`](../../../../LibraryRuntime/classes/MoldedBonBon.md)\>

## Properties

### \_baseConfection

> `protected` `readonly` **\_baseConfection**: [`MoldedBonBon`](../../../../LibraryRuntime/classes/MoldedBonBon.md)

Defined in: [ts-chocolate/src/packlets/runtime/session/confectionEditingSessionBase.ts:56](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/runtime/session/confectionEditingSessionBase.ts#L56)

#### Inherited from

[`ConfectionEditingSessionBase`](ConfectionEditingSessionBase.md).[`_baseConfection`](ConfectionEditingSessionBase.md#_baseconfection)

***

### \_context

> `protected` `readonly` **\_context**: [`ISessionContext`](../../../interfaces/ISessionContext.md)

Defined in: [ts-chocolate/src/packlets/runtime/session/confectionEditingSessionBase.ts:57](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/runtime/session/confectionEditingSessionBase.ts#L57)

#### Inherited from

[`ConfectionEditingSessionBase`](ConfectionEditingSessionBase.md).[`_context`](ConfectionEditingSessionBase.md#_context)

***

### \_fillingSessions

> `protected` `readonly` **\_fillingSessions**: `Map`\<[`SlotId`](../../../../../../type-aliases/SlotId.md), [`EditingSession`](EditingSession.md)\>

Defined in: [ts-chocolate/src/packlets/runtime/session/confectionEditingSessionBase.ts:61](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/runtime/session/confectionEditingSessionBase.ts#L61)

#### Inherited from

[`ConfectionEditingSessionBase`](ConfectionEditingSessionBase.md).[`_fillingSessions`](ConfectionEditingSessionBase.md#_fillingsessions)

***

### \_originalSnapshot

> `protected` `readonly` **\_originalSnapshot**: [`IProducedMoldedBonBonEntity`](../../../../Entities/interfaces/IProducedMoldedBonBonEntity.md)

Defined in: [ts-chocolate/src/packlets/runtime/session/confectionEditingSessionBase.ts:59](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/runtime/session/confectionEditingSessionBase.ts#L59)

#### Inherited from

[`ConfectionEditingSessionBase`](ConfectionEditingSessionBase.md).[`_originalSnapshot`](ConfectionEditingSessionBase.md#_originalsnapshot)

***

### \_produced

> `protected` `readonly` **\_produced**: [`ProducedConfectionBase`](../../../../LibraryRuntime/classes/ProducedConfectionBase.md)\<[`IProducedMoldedBonBonEntity`](../../../../Entities/interfaces/IProducedMoldedBonBonEntity.md)\>

Defined in: [ts-chocolate/src/packlets/runtime/session/confectionEditingSessionBase.ts:58](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/runtime/session/confectionEditingSessionBase.ts#L58)

#### Inherited from

[`ConfectionEditingSessionBase`](ConfectionEditingSessionBase.md).[`_produced`](ConfectionEditingSessionBase.md#_produced)

***

### \_sessionId

> `protected` `readonly` **\_sessionId**: [`SessionSpec`](../../../../../../type-aliases/SessionSpec.md)

Defined in: [ts-chocolate/src/packlets/runtime/session/confectionEditingSessionBase.ts:60](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/runtime/session/confectionEditingSessionBase.ts#L60)

#### Inherited from

[`ConfectionEditingSessionBase`](ConfectionEditingSessionBase.md).[`_sessionId`](ConfectionEditingSessionBase.md#_sessionid)

## Accessors

### baseConfection

#### Get Signature

> **get** **baseConfection**(): `TRuntime`

Defined in: [ts-chocolate/src/packlets/runtime/session/confectionEditingSessionBase.ts:308](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/runtime/session/confectionEditingSessionBase.ts#L308)

Gets the base confection.

##### Returns

`TRuntime`

#### Inherited from

[`ConfectionEditingSessionBase`](ConfectionEditingSessionBase.md).[`baseConfection`](ConfectionEditingSessionBase.md#baseconfection)

***

### context

#### Get Signature

> **get** **context**(): [`ISessionContext`](../../../interfaces/ISessionContext.md)

Defined in: [ts-chocolate/src/packlets/runtime/session/confectionEditingSessionBase.ts:284](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/runtime/session/confectionEditingSessionBase.ts#L284)

Gets the runtime context.

##### Returns

[`ISessionContext`](../../../interfaces/ISessionContext.md)

#### Inherited from

[`ConfectionEditingSessionBase`](ConfectionEditingSessionBase.md).[`context`](ConfectionEditingSessionBase.md#context)

***

### currentMold

#### Get Signature

> **get** **currentMold**(): [`IMold`](../../../../LibraryRuntime/interfaces/IMold.md)

Defined in: [ts-chocolate/src/packlets/runtime/session/moldedBonBonEditingSession.ts:377](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/runtime/session/moldedBonBonEditingSession.ts#L377)

Gets the current mold.

##### Returns

[`IMold`](../../../../LibraryRuntime/interfaces/IMold.md)

***

### fillingSessions

#### Get Signature

> **get** **fillingSessions**(): [`IFillingSessionMap`](../type-aliases/IFillingSessionMap.md)

Defined in: [ts-chocolate/src/packlets/runtime/session/confectionEditingSessionBase.ts:276](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/runtime/session/confectionEditingSessionBase.ts#L276)

Gets all filling sessions.

##### Returns

[`IFillingSessionMap`](../type-aliases/IFillingSessionMap.md)

#### Inherited from

[`ConfectionEditingSessionBase`](ConfectionEditingSessionBase.md).[`fillingSessions`](ConfectionEditingSessionBase.md#fillingsessions)

***

### pendingMoldChange

#### Get Signature

> **get** **pendingMoldChange**(): [`IMoldChangeAnalysis`](../interfaces/IMoldChangeAnalysis.md) \| `undefined`

Defined in: [ts-chocolate/src/packlets/runtime/session/moldedBonBonEditingSession.ts:275](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/runtime/session/moldedBonBonEditingSession.ts#L275)

Gets pending mold change analysis, if any.

##### Returns

[`IMoldChangeAnalysis`](../interfaces/IMoldChangeAnalysis.md) \| `undefined`

***

### produced

#### Get Signature

> **get** **produced**(): [`ProducedConfectionBase`](../../../../LibraryRuntime/classes/ProducedConfectionBase.md)\<`T`\>

Defined in: [ts-chocolate/src/packlets/runtime/session/confectionEditingSessionBase.ts:300](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/runtime/session/confectionEditingSessionBase.ts#L300)

Gets the produced confection wrapper.

##### Returns

[`ProducedConfectionBase`](../../../../LibraryRuntime/classes/ProducedConfectionBase.md)\<`T`\>

#### Inherited from

[`ConfectionEditingSessionBase`](ConfectionEditingSessionBase.md).[`produced`](ConfectionEditingSessionBase.md#produced)

***

### sessionId

#### Get Signature

> **get** **sessionId**(): [`SessionSpec`](../../../../../../type-aliases/SessionSpec.md)

Defined in: [ts-chocolate/src/packlets/runtime/session/confectionEditingSessionBase.ts:292](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/runtime/session/confectionEditingSessionBase.ts#L292)

Gets the session ID.

##### Returns

[`SessionSpec`](../../../../../../type-aliases/SessionSpec.md)

#### Inherited from

[`ConfectionEditingSessionBase`](ConfectionEditingSessionBase.md).[`sessionId`](ConfectionEditingSessionBase.md#sessionid)

## Methods

### analyzeMoldChange()

> **analyzeMoldChange**(`moldId`): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`IMoldChangeAnalysis`](../interfaces/IMoldChangeAnalysis.md)\>

Defined in: [ts-chocolate/src/packlets/runtime/session/moldedBonBonEditingSession.ts:209](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/runtime/session/moldedBonBonEditingSession.ts#L209)

Analyzes impact of changing to a new mold.
Returns analysis for user review before confirmation.

#### Parameters

##### moldId

[`MoldId`](../../../../../../type-aliases/MoldId.md)

The new mold ID

#### Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`IMoldChangeAnalysis`](../interfaces/IMoldChangeAnalysis.md)\>

Success with analysis, or Failure if mold not found

***

### cancelMoldChange()

> **cancelMoldChange**(): `void`

Defined in: [ts-chocolate/src/packlets/runtime/session/moldedBonBonEditingSession.ts:267](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/runtime/session/moldedBonBonEditingSession.ts#L267)

Cancels pending mold change.

#### Returns

`void`

***

### confirmMoldChange()

> **confirmMoldChange**(): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`undefined`\>

Defined in: [ts-chocolate/src/packlets/runtime/session/moldedBonBonEditingSession.ts:236](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/runtime/session/moldedBonBonEditingSession.ts#L236)

Confirms pending mold change and rescales fillings.
Call analyzeMoldChange() first to set up the pending change.

#### Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`undefined`\>

Success with undefined, or Failure if no pending change or update fails

***

### getFillingSession()

> **getFillingSession**(`slotId`): [`EditingSession`](EditingSession.md) \| `undefined`

Defined in: [ts-chocolate/src/packlets/runtime/session/confectionEditingSessionBase.ts:268](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/runtime/session/confectionEditingSessionBase.ts#L268)

Gets the filling session for a specific slot.

#### Parameters

##### slotId

[`SlotId`](../../../../../../type-aliases/SlotId.md)

The slot identifier

#### Returns

[`EditingSession`](EditingSession.md) \| `undefined`

The editing session, or undefined if not found

#### Inherited from

[`ConfectionEditingSessionBase`](ConfectionEditingSessionBase.md).[`getFillingSession`](ConfectionEditingSessionBase.md#getfillingsession)

***

### removeFillingSlot()

> **removeFillingSlot**(`slotId`): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`EditingSession`](EditingSession.md) \| `undefined`\>

Defined in: [ts-chocolate/src/packlets/runtime/session/confectionEditingSessionBase.ts:251](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/runtime/session/confectionEditingSessionBase.ts#L251)

Removes a filling slot.

#### Parameters

##### slotId

[`SlotId`](../../../../../../type-aliases/SlotId.md)

The slot identifier

#### Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`EditingSession`](EditingSession.md) \| `undefined`\>

`Success` with the removed filling session, or `undefined` if none existed; or `Failure`

#### Inherited from

[`ConfectionEditingSessionBase`](ConfectionEditingSessionBase.md).[`removeFillingSlot`](ConfectionEditingSessionBase.md#removefillingslot)

***

### scaleToYield()

> **scaleToYield**(`yieldSpec`): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`IConfectionYield`](../../../../Entities/interfaces/IConfectionYield.md)\>

Defined in: [ts-chocolate/src/packlets/runtime/session/moldedBonBonEditingSession.ts:162](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/runtime/session/moldedBonBonEditingSession.ts#L162)

Scales to new yield specification.
Handles both frame-based and legacy count-based yield.

#### Parameters

##### yieldSpec

[`AnyConfectionYield`](../../../../Entities/namespaces/Confections/type-aliases/AnyConfectionYield.md)

The new yield specification

#### Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`IConfectionYield`](../../../../Entities/interfaces/IConfectionYield.md)\>

Success with updated yield, or Failure

#### Overrides

[`ConfectionEditingSessionBase`](ConfectionEditingSessionBase.md).[`scaleToYield`](ConfectionEditingSessionBase.md#scaletoyield)

***

### setFillingSlot()

> **setFillingSlot**(`slotId`, `choice`): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`EditingSession`](EditingSession.md) \| `undefined`\>

Defined in: [ts-chocolate/src/packlets/runtime/session/confectionEditingSessionBase.ts:228](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/runtime/session/confectionEditingSessionBase.ts#L228)

Sets or updates a filling slot.
Creates/updates filling session if recipe slot.

#### Parameters

##### slotId

[`SlotId`](../../../../../../type-aliases/SlotId.md)

The slot identifier

##### choice

Recipe or ingredient choice

\{ `fillingId`: [`FillingId`](../../../../../../type-aliases/FillingId.md); `type`: `"recipe"`; \} | \{ `ingredientId`: [`IngredientId`](../../../../../../type-aliases/IngredientId.md); `type`: `"ingredient"`; \}

#### Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`EditingSession`](EditingSession.md) \| `undefined`\>

`Success` with the new or updated filling session, or `undefined` for ingredient slots; or `Failure`

#### Inherited from

[`ConfectionEditingSessionBase`](ConfectionEditingSessionBase.md).[`setFillingSlot`](ConfectionEditingSessionBase.md#setfillingslot)

***

### setFrames()

> **setFrames**(`frames`, `bufferPercentage`): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`IMoldedBonBonYield`](../../../../Entities/namespaces/Confections/interfaces/IMoldedBonBonYield.md)\>

Defined in: [ts-chocolate/src/packlets/runtime/session/moldedBonBonEditingSession.ts:131](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/runtime/session/moldedBonBonEditingSession.ts#L131)

Sets frames and buffer percentage for yield calculation.
Count is computed as: frames × cavitiesPerFrame

#### Parameters

##### frames

`number`

Number of frames to produce

##### bufferPercentage

`number` = `0.1`

Buffer overfill (e.g., 0.1 for 10%)

#### Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`IMoldedBonBonYield`](../../../../Entities/namespaces/Confections/interfaces/IMoldedBonBonYield.md)\>

Success with computed yield, or Failure if invalid

***

### create()

> `static` **create**(`baseConfection`, `context`, `params?`): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`MoldedBonBonEditingSession`\>

Defined in: [ts-chocolate/src/packlets/runtime/session/moldedBonBonEditingSession.ts:86](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/runtime/session/moldedBonBonEditingSession.ts#L86)

Factory method for creating a MoldedBonBonEditingSession.

#### Parameters

##### baseConfection

[`MoldedBonBon`](../../../../LibraryRuntime/classes/MoldedBonBon.md)

The source molded bonbon confection

##### context

[`ISessionContext`](../../../interfaces/ISessionContext.md)

The runtime context

##### params?

[`IConfectionEditingSessionParams`](../interfaces/IConfectionEditingSessionParams.md)

Optional session parameters

#### Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`MoldedBonBonEditingSession`\>

Success with MoldedBonBonEditingSession, or Failure

***

### fromPersistedState()

> `static` **fromPersistedState**(`baseConfection`, `history`, `context`, `params?`): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`MoldedBonBonEditingSession`\>

Defined in: [ts-chocolate/src/packlets/runtime/session/moldedBonBonEditingSession.ts:107](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/runtime/session/moldedBonBonEditingSession.ts#L107)

Restores a MoldedBonBonEditingSession from persisted state.
Note: Child filling sessions are persisted separately and should be accessed
via their persisted session IDs from IPersistedConfectionSession.childSessionIds.

#### Parameters

##### baseConfection

[`MoldedBonBon`](../../../../LibraryRuntime/classes/MoldedBonBon.md)

The source molded bonbon confection

##### history

[`ISerializedEditingHistoryEntity`](../../../../Entities/namespaces/Session/interfaces/ISerializedEditingHistoryEntity.md)\<[`IProducedMoldedBonBonEntity`](../../../../Entities/interfaces/IProducedMoldedBonBonEntity.md)\>

Serialized editing history

##### context

[`ISessionContext`](../../../interfaces/ISessionContext.md)

The runtime context

##### params?

[`IConfectionEditingSessionParams`](../interfaces/IConfectionEditingSessionParams.md)

Optional session parameters

#### Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`MoldedBonBonEditingSession`\>

Success with restored session, or Failure
