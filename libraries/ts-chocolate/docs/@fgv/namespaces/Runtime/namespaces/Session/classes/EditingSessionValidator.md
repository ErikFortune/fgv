[**@fgv/ts-chocolate**](../../../../../../README.md)

***

[@fgv/ts-chocolate](../../../../../../README.md) / [Runtime](../../../README.md) / [Session](../README.md) / EditingSessionValidator

# Class: EditingSessionValidator

Defined in: [ts-chocolate/src/packlets/runtime/session/editingSessionValidator.ts:131](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/runtime/session/editingSessionValidator.ts#L131)

A wrapper for EditingSession that validates and converts weakly-typed inputs
to strongly-typed branded types before delegating to the underlying session.

This allows consumers to use plain strings and numbers instead of
IngredientId and Measurement branded types while still benefiting from
runtime validation.

## Example

```typescript
const session = EditingSession.create(baseRecipe).orThrow();
const validator = new EditingSessionValidator(session);

// Use plain strings and numbers instead of branded types
validator.setIngredient('felchlin.maracaibo-65', 100);
validator.removeIngredient('local.glucose-syrup');
```

## Implements

- [`IEditingSessionValidator`](../interfaces/IEditingSessionValidator.md)

## Constructors

### Constructor

> **new EditingSessionValidator**(`session`): `EditingSessionValidator`

Defined in: [ts-chocolate/src/packlets/runtime/session/editingSessionValidator.ts:138](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/runtime/session/editingSessionValidator.ts#L138)

Creates a new EditingSessionValidator

#### Parameters

##### session

[`EditingSession`](EditingSession.md)

The EditingSession to wrap

#### Returns

`EditingSessionValidator`

## Accessors

### session

#### Get Signature

> **get** **session**(): [`EditingSession`](EditingSession.md)

Defined in: [ts-chocolate/src/packlets/runtime/session/editingSessionValidator.ts:145](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/runtime/session/editingSessionValidator.ts#L145)

The underlying editing session

##### Returns

[`EditingSession`](EditingSession.md)

The underlying editing session

#### Implementation of

[`IEditingSessionValidator`](../interfaces/IEditingSessionValidator.md).[`session`](../interfaces/IEditingSessionValidator.md#session)

## Methods

### removeIngredient()

> **removeIngredient**(`id`): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`void`\>

Defined in: [ts-chocolate/src/packlets/runtime/session/editingSessionValidator.ts:175](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/runtime/session/editingSessionValidator.ts#L175)

Removes an ingredient using a weakly-typed string

#### Parameters

##### id

`string`

Ingredient ID (will be converted)

#### Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`void`\>

Success or Failure

#### Implementation of

[`IEditingSessionValidator`](../interfaces/IEditingSessionValidator.md).[`removeIngredient`](../interfaces/IEditingSessionValidator.md#removeingredient)

***

### scaleToTargetWeight()

> **scaleToTargetWeight**(`targetWeight`): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`Measurement`](../../../../../../type-aliases/Measurement.md)\>

Defined in: [ts-chocolate/src/packlets/runtime/session/editingSessionValidator.ts:186](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/runtime/session/editingSessionValidator.ts#L186)

Scales the filling to achieve a target weight using a weakly-typed number.

#### Parameters

##### targetWeight

`number`

Desired total weight (will be converted)

#### Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`Measurement`](../../../../../../type-aliases/Measurement.md)\>

Success with actual achieved weight, or Failure

#### Implementation of

[`IEditingSessionValidator`](../interfaces/IEditingSessionValidator.md).[`scaleToTargetWeight`](../interfaces/IEditingSessionValidator.md#scaletotargetweight)

***

### setIngredient()

> **setIngredient**(`id`, `amount`, `unit?`, `modifiers?`): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`void`\>

Defined in: [ts-chocolate/src/packlets/runtime/session/editingSessionValidator.ts:157](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/runtime/session/editingSessionValidator.ts#L157)

Sets or updates an ingredient using weakly-typed inputs

#### Parameters

##### id

`string`

Ingredient ID (will be converted)

##### amount

`number`

Amount (will be converted)

##### unit?

[`MeasurementUnit`](../../../../../../type-aliases/MeasurementUnit.md)

Optional measurement unit

##### modifiers?

[`IIngredientModifiers`](../../../../Entities/namespaces/Fillings/interfaces/IIngredientModifiers.md)

Optional ingredient modifiers

#### Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`void`\>

Success or Failure

#### Implementation of

[`IEditingSessionValidator`](../interfaces/IEditingSessionValidator.md).[`setIngredient`](../interfaces/IEditingSessionValidator.md#setingredient)

***

### setProcedure()

> **setProcedure**(`id`): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`void`\>

Defined in: [ts-chocolate/src/packlets/runtime/session/editingSessionValidator.ts:197](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/runtime/session/editingSessionValidator.ts#L197)

Sets the procedure using a weakly-typed string

#### Parameters

##### id

Procedure ID (will be converted) or undefined to clear

`string` | `undefined`

#### Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`void`\>

Success or Failure

#### Implementation of

[`IEditingSessionValidator`](../interfaces/IEditingSessionValidator.md).[`setProcedure`](../interfaces/IEditingSessionValidator.md#setprocedure)

***

### toReadOnly()

> **toReadOnly**(): [`IReadOnlyEditingSessionValidator`](../interfaces/IReadOnlyEditingSessionValidator.md)

Defined in: [ts-chocolate/src/packlets/runtime/session/editingSessionValidator.ts:209](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/runtime/session/editingSessionValidator.ts#L209)

Gets a read-only version of this validator

#### Returns

[`IReadOnlyEditingSessionValidator`](../interfaces/IReadOnlyEditingSessionValidator.md)

#### Implementation of

[`IEditingSessionValidator`](../interfaces/IEditingSessionValidator.md).[`toReadOnly`](../interfaces/IEditingSessionValidator.md#toreadonly)
