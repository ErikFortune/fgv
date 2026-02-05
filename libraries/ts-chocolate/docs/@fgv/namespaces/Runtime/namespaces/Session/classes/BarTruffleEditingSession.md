[**@fgv/ts-chocolate**](../../../../../../README.md)

***

[@fgv/ts-chocolate](../../../../../../README.md) / [Runtime](../../../README.md) / [Session](../README.md) / BarTruffleEditingSession

# Class: BarTruffleEditingSession

Defined in: [ts-chocolate/src/packlets/runtime/session/barTruffleEditingSession.ts:46](https://github.com/ErikFortune/fgv/blob/4be6f2d0ab84c3f4b78ffd3f9b262279d2ab7172/libraries/ts-chocolate/src/packlets/runtime/session/barTruffleEditingSession.ts#L46)

Editing session for bar truffle confections.
Supports linear count-based scaling with proportional filling adjustment.

## Extends

- [`ConfectionEditingSessionBase`](ConfectionEditingSessionBase.md)\<[`IProducedBarTruffleEntity`](../../../../Entities/interfaces/IProducedBarTruffleEntity.md), [`BarTruffle`](../../../../LibraryRuntime/classes/BarTruffle.md)\>

## Properties

### \_baseConfection

> `protected` `readonly` **\_baseConfection**: [`BarTruffle`](../../../../LibraryRuntime/classes/BarTruffle.md)

Defined in: [ts-chocolate/src/packlets/runtime/session/confectionEditingSessionBase.ts:56](https://github.com/ErikFortune/fgv/blob/4be6f2d0ab84c3f4b78ffd3f9b262279d2ab7172/libraries/ts-chocolate/src/packlets/runtime/session/confectionEditingSessionBase.ts#L56)

#### Inherited from

[`ConfectionEditingSessionBase`](ConfectionEditingSessionBase.md).[`_baseConfection`](ConfectionEditingSessionBase.md#_baseconfection)

***

### \_context

> `protected` `readonly` **\_context**: [`ISessionContext`](../../../interfaces/ISessionContext.md)

Defined in: [ts-chocolate/src/packlets/runtime/session/confectionEditingSessionBase.ts:57](https://github.com/ErikFortune/fgv/blob/4be6f2d0ab84c3f4b78ffd3f9b262279d2ab7172/libraries/ts-chocolate/src/packlets/runtime/session/confectionEditingSessionBase.ts#L57)

#### Inherited from

[`ConfectionEditingSessionBase`](ConfectionEditingSessionBase.md).[`_context`](ConfectionEditingSessionBase.md#_context)

***

### \_fillingSessions

> `protected` `readonly` **\_fillingSessions**: `Map`\<[`SlotId`](../../../../../../type-aliases/SlotId.md), [`EditingSession`](EditingSession.md)\>

Defined in: [ts-chocolate/src/packlets/runtime/session/confectionEditingSessionBase.ts:61](https://github.com/ErikFortune/fgv/blob/4be6f2d0ab84c3f4b78ffd3f9b262279d2ab7172/libraries/ts-chocolate/src/packlets/runtime/session/confectionEditingSessionBase.ts#L61)

#### Inherited from

[`ConfectionEditingSessionBase`](ConfectionEditingSessionBase.md).[`_fillingSessions`](ConfectionEditingSessionBase.md#_fillingsessions)

***

### \_originalSnapshot

> `protected` `readonly` **\_originalSnapshot**: [`IProducedBarTruffleEntity`](../../../../Entities/interfaces/IProducedBarTruffleEntity.md)

Defined in: [ts-chocolate/src/packlets/runtime/session/confectionEditingSessionBase.ts:59](https://github.com/ErikFortune/fgv/blob/4be6f2d0ab84c3f4b78ffd3f9b262279d2ab7172/libraries/ts-chocolate/src/packlets/runtime/session/confectionEditingSessionBase.ts#L59)

#### Inherited from

[`ConfectionEditingSessionBase`](ConfectionEditingSessionBase.md).[`_originalSnapshot`](ConfectionEditingSessionBase.md#_originalsnapshot)

***

### \_produced

> `protected` `readonly` **\_produced**: [`ProducedConfectionBase`](../../../../LibraryRuntime/classes/ProducedConfectionBase.md)\<[`IProducedBarTruffleEntity`](../../../../Entities/interfaces/IProducedBarTruffleEntity.md)\>

Defined in: [ts-chocolate/src/packlets/runtime/session/confectionEditingSessionBase.ts:58](https://github.com/ErikFortune/fgv/blob/4be6f2d0ab84c3f4b78ffd3f9b262279d2ab7172/libraries/ts-chocolate/src/packlets/runtime/session/confectionEditingSessionBase.ts#L58)

#### Inherited from

[`ConfectionEditingSessionBase`](ConfectionEditingSessionBase.md).[`_produced`](ConfectionEditingSessionBase.md#_produced)

***

### \_sessionId

> `protected` `readonly` **\_sessionId**: [`SessionSpec`](../../../../../../type-aliases/SessionSpec.md)

Defined in: [ts-chocolate/src/packlets/runtime/session/confectionEditingSessionBase.ts:60](https://github.com/ErikFortune/fgv/blob/4be6f2d0ab84c3f4b78ffd3f9b262279d2ab7172/libraries/ts-chocolate/src/packlets/runtime/session/confectionEditingSessionBase.ts#L60)

#### Inherited from

[`ConfectionEditingSessionBase`](ConfectionEditingSessionBase.md).[`_sessionId`](ConfectionEditingSessionBase.md#_sessionid)

## Accessors

### baseConfection

#### Get Signature

> **get** **baseConfection**(): `TRuntime`

Defined in: [ts-chocolate/src/packlets/runtime/session/confectionEditingSessionBase.ts:308](https://github.com/ErikFortune/fgv/blob/4be6f2d0ab84c3f4b78ffd3f9b262279d2ab7172/libraries/ts-chocolate/src/packlets/runtime/session/confectionEditingSessionBase.ts#L308)

Gets the base confection.

##### Returns

`TRuntime`

#### Inherited from

[`ConfectionEditingSessionBase`](ConfectionEditingSessionBase.md).[`baseConfection`](ConfectionEditingSessionBase.md#baseconfection)

***

### context

#### Get Signature

> **get** **context**(): [`ISessionContext`](../../../interfaces/ISessionContext.md)

Defined in: [ts-chocolate/src/packlets/runtime/session/confectionEditingSessionBase.ts:284](https://github.com/ErikFortune/fgv/blob/4be6f2d0ab84c3f4b78ffd3f9b262279d2ab7172/libraries/ts-chocolate/src/packlets/runtime/session/confectionEditingSessionBase.ts#L284)

Gets the runtime context.

##### Returns

[`ISessionContext`](../../../interfaces/ISessionContext.md)

#### Inherited from

[`ConfectionEditingSessionBase`](ConfectionEditingSessionBase.md).[`context`](ConfectionEditingSessionBase.md#context)

***

### fillingSessions

#### Get Signature

> **get** **fillingSessions**(): [`IFillingSessionMap`](../type-aliases/IFillingSessionMap.md)

Defined in: [ts-chocolate/src/packlets/runtime/session/confectionEditingSessionBase.ts:276](https://github.com/ErikFortune/fgv/blob/4be6f2d0ab84c3f4b78ffd3f9b262279d2ab7172/libraries/ts-chocolate/src/packlets/runtime/session/confectionEditingSessionBase.ts#L276)

Gets all filling sessions.

##### Returns

[`IFillingSessionMap`](../type-aliases/IFillingSessionMap.md)

#### Inherited from

[`ConfectionEditingSessionBase`](ConfectionEditingSessionBase.md).[`fillingSessions`](ConfectionEditingSessionBase.md#fillingsessions)

***

### produced

#### Get Signature

> **get** **produced**(): [`ProducedConfectionBase`](../../../../LibraryRuntime/classes/ProducedConfectionBase.md)\<`T`\>

Defined in: [ts-chocolate/src/packlets/runtime/session/confectionEditingSessionBase.ts:300](https://github.com/ErikFortune/fgv/blob/4be6f2d0ab84c3f4b78ffd3f9b262279d2ab7172/libraries/ts-chocolate/src/packlets/runtime/session/confectionEditingSessionBase.ts#L300)

Gets the produced confection wrapper.

##### Returns

[`ProducedConfectionBase`](../../../../LibraryRuntime/classes/ProducedConfectionBase.md)\<`T`\>

#### Inherited from

[`ConfectionEditingSessionBase`](ConfectionEditingSessionBase.md).[`produced`](ConfectionEditingSessionBase.md#produced)

***

### sessionId

#### Get Signature

> **get** **sessionId**(): [`SessionSpec`](../../../../../../type-aliases/SessionSpec.md)

Defined in: [ts-chocolate/src/packlets/runtime/session/confectionEditingSessionBase.ts:292](https://github.com/ErikFortune/fgv/blob/4be6f2d0ab84c3f4b78ffd3f9b262279d2ab7172/libraries/ts-chocolate/src/packlets/runtime/session/confectionEditingSessionBase.ts#L292)

Gets the session ID.

##### Returns

[`SessionSpec`](../../../../../../type-aliases/SessionSpec.md)

#### Inherited from

[`ConfectionEditingSessionBase`](ConfectionEditingSessionBase.md).[`sessionId`](ConfectionEditingSessionBase.md#sessionid)

## Methods

### getFillingSession()

> **getFillingSession**(`slotId`): [`EditingSession`](EditingSession.md) \| `undefined`

Defined in: [ts-chocolate/src/packlets/runtime/session/confectionEditingSessionBase.ts:268](https://github.com/ErikFortune/fgv/blob/4be6f2d0ab84c3f4b78ffd3f9b262279d2ab7172/libraries/ts-chocolate/src/packlets/runtime/session/confectionEditingSessionBase.ts#L268)

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

Defined in: [ts-chocolate/src/packlets/runtime/session/confectionEditingSessionBase.ts:251](https://github.com/ErikFortune/fgv/blob/4be6f2d0ab84c3f4b78ffd3f9b262279d2ab7172/libraries/ts-chocolate/src/packlets/runtime/session/confectionEditingSessionBase.ts#L251)

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

Defined in: [ts-chocolate/src/packlets/runtime/session/barTruffleEditingSession.ts:124](https://github.com/ErikFortune/fgv/blob/4be6f2d0ab84c3f4b78ffd3f9b262279d2ab7172/libraries/ts-chocolate/src/packlets/runtime/session/barTruffleEditingSession.ts#L124)

Scales to new yield specification using linear count-based scaling.
All filling sessions scale proportionally by the count ratio.

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

Defined in: [ts-chocolate/src/packlets/runtime/session/confectionEditingSessionBase.ts:228](https://github.com/ErikFortune/fgv/blob/4be6f2d0ab84c3f4b78ffd3f9b262279d2ab7172/libraries/ts-chocolate/src/packlets/runtime/session/confectionEditingSessionBase.ts#L228)

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

### create()

> `static` **create**(`baseConfection`, `context`, `params?`): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`BarTruffleEditingSession`\>

Defined in: [ts-chocolate/src/packlets/runtime/session/barTruffleEditingSession.ts:80](https://github.com/ErikFortune/fgv/blob/4be6f2d0ab84c3f4b78ffd3f9b262279d2ab7172/libraries/ts-chocolate/src/packlets/runtime/session/barTruffleEditingSession.ts#L80)

Factory method for creating a BarTruffleEditingSession.

#### Parameters

##### baseConfection

[`BarTruffle`](../../../../LibraryRuntime/classes/BarTruffle.md)

The source bar truffle confection

##### context

[`ISessionContext`](../../../interfaces/ISessionContext.md)

The runtime context

##### params?

[`IConfectionEditingSessionParams`](../interfaces/IConfectionEditingSessionParams.md)

Optional session parameters

#### Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`BarTruffleEditingSession`\>

Success with BarTruffleEditingSession, or Failure

***

### fromPersistedState()

> `static` **fromPersistedState**(`baseConfection`, `history`, `context`, `params?`): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`BarTruffleEditingSession`\>

Defined in: [ts-chocolate/src/packlets/runtime/session/barTruffleEditingSession.ts:101](https://github.com/ErikFortune/fgv/blob/4be6f2d0ab84c3f4b78ffd3f9b262279d2ab7172/libraries/ts-chocolate/src/packlets/runtime/session/barTruffleEditingSession.ts#L101)

Restores a BarTruffleEditingSession from persisted state.
Note: Child filling sessions are persisted separately and should be accessed
via their persisted session IDs from IPersistedConfectionSession.childSessionIds.

#### Parameters

##### baseConfection

[`BarTruffle`](../../../../LibraryRuntime/classes/BarTruffle.md)

The source bar truffle confection

##### history

[`ISerializedEditingHistoryEntity`](../../../../Entities/namespaces/Session/interfaces/ISerializedEditingHistoryEntity.md)\<[`IProducedBarTruffleEntity`](../../../../Entities/interfaces/IProducedBarTruffleEntity.md)\>

Serialized editing history

##### context

[`ISessionContext`](../../../interfaces/ISessionContext.md)

The runtime context

##### params?

[`IConfectionEditingSessionParams`](../interfaces/IConfectionEditingSessionParams.md)

Optional session parameters

#### Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`BarTruffleEditingSession`\>

Success with restored session, or Failure
