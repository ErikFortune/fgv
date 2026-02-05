[**@fgv/ts-chocolate**](../../../../../../README.md)

***

[@fgv/ts-chocolate](../../../../../../README.md) / [Runtime](../../../README.md) / [Session](../README.md) / IEditingSessionValidator

# Interface: IEditingSessionValidator

Defined in: [ts-chocolate/src/packlets/runtime/session/editingSessionValidator.ts:63](https://github.com/ErikFortune/fgv/blob/4be6f2d0ab84c3f4b78ffd3f9b262279d2ab7172/libraries/ts-chocolate/src/packlets/runtime/session/editingSessionValidator.ts#L63)

Full interface for EditingSessionValidator.
Provides validated mutating operations using weakly-typed inputs.

## Extends

- [`IReadOnlyEditingSessionValidator`](IReadOnlyEditingSessionValidator.md)

## Properties

### session

> `readonly` **session**: [`EditingSession`](../classes/EditingSession.md)

Defined in: [ts-chocolate/src/packlets/runtime/session/editingSessionValidator.ts:51](https://github.com/ErikFortune/fgv/blob/4be6f2d0ab84c3f4b78ffd3f9b262279d2ab7172/libraries/ts-chocolate/src/packlets/runtime/session/editingSessionValidator.ts#L51)

The underlying editing session

#### Inherited from

[`IReadOnlyEditingSessionValidator`](IReadOnlyEditingSessionValidator.md).[`session`](IReadOnlyEditingSessionValidator.md#session)

## Methods

### removeIngredient()

> **removeIngredient**(`id`): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`void`\>

Defined in: [ts-chocolate/src/packlets/runtime/session/editingSessionValidator.ts:84](https://github.com/ErikFortune/fgv/blob/4be6f2d0ab84c3f4b78ffd3f9b262279d2ab7172/libraries/ts-chocolate/src/packlets/runtime/session/editingSessionValidator.ts#L84)

Removes an ingredient using a weakly-typed string

#### Parameters

##### id

`string`

Ingredient ID (will be converted)

#### Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`void`\>

Success or Failure

***

### scaleToTargetWeight()

> **scaleToTargetWeight**(`targetWeight`): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`Measurement`](../../../../../../type-aliases/Measurement.md)\>

Defined in: [ts-chocolate/src/packlets/runtime/session/editingSessionValidator.ts:92](https://github.com/ErikFortune/fgv/blob/4be6f2d0ab84c3f4b78ffd3f9b262279d2ab7172/libraries/ts-chocolate/src/packlets/runtime/session/editingSessionValidator.ts#L92)

Scales the filling to achieve a target weight using a weakly-typed number.
Weight-contributing ingredients are scaled proportionally.

#### Parameters

##### targetWeight

`number`

Desired total weight (will be converted)

#### Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`Measurement`](../../../../../../type-aliases/Measurement.md)\>

Success with actual achieved weight, or Failure

***

### setIngredient()

> **setIngredient**(`id`, `amount`, `unit?`, `modifiers?`): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`void`\>

Defined in: [ts-chocolate/src/packlets/runtime/session/editingSessionValidator.ts:72](https://github.com/ErikFortune/fgv/blob/4be6f2d0ab84c3f4b78ffd3f9b262279d2ab7172/libraries/ts-chocolate/src/packlets/runtime/session/editingSessionValidator.ts#L72)

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

***

### setProcedure()

> **setProcedure**(`id`): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`void`\>

Defined in: [ts-chocolate/src/packlets/runtime/session/editingSessionValidator.ts:99](https://github.com/ErikFortune/fgv/blob/4be6f2d0ab84c3f4b78ffd3f9b262279d2ab7172/libraries/ts-chocolate/src/packlets/runtime/session/editingSessionValidator.ts#L99)

Sets the procedure using a weakly-typed string

#### Parameters

##### id

Procedure ID (will be converted) or undefined to clear

`string` | `undefined`

#### Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`void`\>

Success or Failure

***

### toReadOnly()

> **toReadOnly**(): [`IReadOnlyEditingSessionValidator`](IReadOnlyEditingSessionValidator.md)

Defined in: [ts-chocolate/src/packlets/runtime/session/editingSessionValidator.ts:104](https://github.com/ErikFortune/fgv/blob/4be6f2d0ab84c3f4b78ffd3f9b262279d2ab7172/libraries/ts-chocolate/src/packlets/runtime/session/editingSessionValidator.ts#L104)

Gets a read-only version of this validator

#### Returns

[`IReadOnlyEditingSessionValidator`](IReadOnlyEditingSessionValidator.md)
