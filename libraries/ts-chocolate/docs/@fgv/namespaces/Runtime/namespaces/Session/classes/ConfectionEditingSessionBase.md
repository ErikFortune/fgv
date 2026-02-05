[**@fgv/ts-chocolate**](../../../../../../README.md)

***

[@fgv/ts-chocolate](../../../../../../README.md) / [Runtime](../../../README.md) / [Session](../README.md) / ConfectionEditingSessionBase

# Abstract Class: ConfectionEditingSessionBase\<T, TRuntime\>

Defined in: [ts-chocolate/src/packlets/runtime/session/confectionEditingSessionBase.ts:52](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/runtime/session/confectionEditingSessionBase.ts#L52)

Abstract base class for confection editing sessions.
Manages filling sessions and provides common editing operations.

Subclasses implement type-specific scaling logic:
- MoldedBonBonEditingSession: Frame-based yield with mold change workflow
- BarTruffleEditingSession: Linear scaling by count
- RolledTruffleEditingSession: Linear scaling by count

## Extended by

- [`MoldedBonBonEditingSession`](MoldedBonBonEditingSession.md)
- [`BarTruffleEditingSession`](BarTruffleEditingSession.md)
- [`RolledTruffleEditingSession`](RolledTruffleEditingSession.md)

## Type Parameters

### T

`T` *extends* [`AnyProducedConfectionEntity`](../../../../Entities/type-aliases/AnyProducedConfectionEntity.md)

### TRuntime

`TRuntime` *extends* [`AnyConfection`](../../../../LibraryRuntime/type-aliases/AnyConfection.md)

## Properties

### \_baseConfection

> `protected` `readonly` **\_baseConfection**: `TRuntime`

Defined in: [ts-chocolate/src/packlets/runtime/session/confectionEditingSessionBase.ts:56](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/runtime/session/confectionEditingSessionBase.ts#L56)

***

### \_context

> `protected` `readonly` **\_context**: [`ISessionContext`](../../../interfaces/ISessionContext.md)

Defined in: [ts-chocolate/src/packlets/runtime/session/confectionEditingSessionBase.ts:57](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/runtime/session/confectionEditingSessionBase.ts#L57)

***

### \_fillingSessions

> `protected` `readonly` **\_fillingSessions**: `Map`\<[`SlotId`](../../../../../../type-aliases/SlotId.md), [`EditingSession`](EditingSession.md)\>

Defined in: [ts-chocolate/src/packlets/runtime/session/confectionEditingSessionBase.ts:61](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/runtime/session/confectionEditingSessionBase.ts#L61)

***

### \_originalSnapshot

> `protected` `readonly` **\_originalSnapshot**: `T`

Defined in: [ts-chocolate/src/packlets/runtime/session/confectionEditingSessionBase.ts:59](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/runtime/session/confectionEditingSessionBase.ts#L59)

***

### \_produced

> `protected` `readonly` **\_produced**: [`ProducedConfectionBase`](../../../../LibraryRuntime/classes/ProducedConfectionBase.md)\<`T`\>

Defined in: [ts-chocolate/src/packlets/runtime/session/confectionEditingSessionBase.ts:58](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/runtime/session/confectionEditingSessionBase.ts#L58)

***

### \_sessionId

> `protected` `readonly` **\_sessionId**: [`SessionSpec`](../../../../../../type-aliases/SessionSpec.md)

Defined in: [ts-chocolate/src/packlets/runtime/session/confectionEditingSessionBase.ts:60](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/runtime/session/confectionEditingSessionBase.ts#L60)

## Accessors

### baseConfection

#### Get Signature

> **get** **baseConfection**(): `TRuntime`

Defined in: [ts-chocolate/src/packlets/runtime/session/confectionEditingSessionBase.ts:308](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/runtime/session/confectionEditingSessionBase.ts#L308)

Gets the base confection.

##### Returns

`TRuntime`

***

### context

#### Get Signature

> **get** **context**(): [`ISessionContext`](../../../interfaces/ISessionContext.md)

Defined in: [ts-chocolate/src/packlets/runtime/session/confectionEditingSessionBase.ts:284](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/runtime/session/confectionEditingSessionBase.ts#L284)

Gets the runtime context.

##### Returns

[`ISessionContext`](../../../interfaces/ISessionContext.md)

***

### fillingSessions

#### Get Signature

> **get** **fillingSessions**(): [`IFillingSessionMap`](../type-aliases/IFillingSessionMap.md)

Defined in: [ts-chocolate/src/packlets/runtime/session/confectionEditingSessionBase.ts:276](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/runtime/session/confectionEditingSessionBase.ts#L276)

Gets all filling sessions.

##### Returns

[`IFillingSessionMap`](../type-aliases/IFillingSessionMap.md)

***

### produced

#### Get Signature

> **get** **produced**(): [`ProducedConfectionBase`](../../../../LibraryRuntime/classes/ProducedConfectionBase.md)\<`T`\>

Defined in: [ts-chocolate/src/packlets/runtime/session/confectionEditingSessionBase.ts:300](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/runtime/session/confectionEditingSessionBase.ts#L300)

Gets the produced confection wrapper.

##### Returns

[`ProducedConfectionBase`](../../../../LibraryRuntime/classes/ProducedConfectionBase.md)\<`T`\>

***

### sessionId

#### Get Signature

> **get** **sessionId**(): [`SessionSpec`](../../../../../../type-aliases/SessionSpec.md)

Defined in: [ts-chocolate/src/packlets/runtime/session/confectionEditingSessionBase.ts:292](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/runtime/session/confectionEditingSessionBase.ts#L292)

Gets the session ID.

##### Returns

[`SessionSpec`](../../../../../../type-aliases/SessionSpec.md)

## Methods

### \_computeSlotTargetWeight()

> `abstract` **\_computeSlotTargetWeight**(`slotId`): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`Measurement`](../../../../../../type-aliases/Measurement.md)\>

Defined in: [ts-chocolate/src/packlets/runtime/session/confectionEditingSessionBase.ts:199](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/runtime/session/confectionEditingSessionBase.ts#L199)

Computes target weight for a specific filling slot based on current yield.
Implementation is type-specific:
- Molded bonbons: Equal division of total cavity weight
- Bar/rolled truffles: Preserve current session weight (linear scaling)

#### Parameters

##### slotId

[`SlotId`](../../../../../../type-aliases/SlotId.md)

The slot identifier

#### Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`Measurement`](../../../../../../type-aliases/Measurement.md)\>

Success with target weight, or Failure

***

### getFillingSession()

> **getFillingSession**(`slotId`): [`EditingSession`](EditingSession.md) \| `undefined`

Defined in: [ts-chocolate/src/packlets/runtime/session/confectionEditingSessionBase.ts:268](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/runtime/session/confectionEditingSessionBase.ts#L268)

Gets the filling session for a specific slot.

#### Parameters

##### slotId

[`SlotId`](../../../../../../type-aliases/SlotId.md)

The slot identifier

#### Returns

[`EditingSession`](EditingSession.md) \| `undefined`

The editing session, or undefined if not found

***

### removeFillingSlot()

> **removeFillingSlot**(`slotId`): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`EditingSession`](EditingSession.md) \| `undefined`\>

Defined in: [ts-chocolate/src/packlets/runtime/session/confectionEditingSessionBase.ts:251](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/runtime/session/confectionEditingSessionBase.ts#L251)

Removes a filling slot.

#### Parameters

##### slotId

[`SlotId`](../../../../../../type-aliases/SlotId.md)

The slot identifier

#### Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`EditingSession`](EditingSession.md) \| `undefined`\>

`Success` with the removed filling session, or `undefined` if none existed; or `Failure`

***

### scaleToYield()

> `abstract` **scaleToYield**(`yieldSpec`): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`IConfectionYield`](../../../../Entities/interfaces/IConfectionYield.md)\>

Defined in: [ts-chocolate/src/packlets/runtime/session/confectionEditingSessionBase.ts:211](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/runtime/session/confectionEditingSessionBase.ts#L211)

Scales to a new yield specification.
Implementation is type-specific:
- Molded bonbons: Frame-based with mold cavity calculation
- Bar/rolled truffles: Linear count-based scaling

#### Parameters

##### yieldSpec

[`AnyConfectionYield`](../../../../Entities/namespaces/Confections/type-aliases/AnyConfectionYield.md)

The new yield specification

#### Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`IConfectionYield`](../../../../Entities/interfaces/IConfectionYield.md)\>

Success with updated yield, or Failure

***

### setFillingSlot()

> **setFillingSlot**(`slotId`, `choice`): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`EditingSession`](EditingSession.md) \| `undefined`\>

Defined in: [ts-chocolate/src/packlets/runtime/session/confectionEditingSessionBase.ts:228](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/runtime/session/confectionEditingSessionBase.ts#L228)

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
