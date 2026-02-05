[**@fgv/ts-chocolate**](../../../../../../README.md)

***

[@fgv/ts-chocolate](../../../../../../README.md) / [Runtime](../../../README.md) / [Session](../README.md) / ISessionChocolate

# Interface: ISessionChocolate

Defined in: [ts-chocolate/src/packlets/runtime/session/model.ts:274](https://github.com/ErikFortune/fgv/blob/4be6f2d0ab84c3f4b78ffd3f9b262279d2ab7172/libraries/ts-chocolate/src/packlets/runtime/session/model.ts#L274)

Tracks a chocolate selection by role for a confection session

## Properties

### ingredientId

> `readonly` **ingredientId**: [`IngredientId`](../../../../../../type-aliases/IngredientId.md)

Defined in: [ts-chocolate/src/packlets/runtime/session/model.ts:283](https://github.com/ErikFortune/fgv/blob/4be6f2d0ab84c3f4b78ffd3f9b262279d2ab7172/libraries/ts-chocolate/src/packlets/runtime/session/model.ts#L283)

The currently selected chocolate ingredient ID

***

### originalIngredientId

> `readonly` **originalIngredientId**: [`IngredientId`](../../../../../../type-aliases/IngredientId.md)

Defined in: [ts-chocolate/src/packlets/runtime/session/model.ts:288](https://github.com/ErikFortune/fgv/blob/4be6f2d0ab84c3f4b78ffd3f9b262279d2ab7172/libraries/ts-chocolate/src/packlets/runtime/session/model.ts#L288)

The original chocolate ingredient ID when the session started

***

### role

> `readonly` **role**: [`ChocolateRole`](../../../../../../type-aliases/ChocolateRole.md)

Defined in: [ts-chocolate/src/packlets/runtime/session/model.ts:278](https://github.com/ErikFortune/fgv/blob/4be6f2d0ab84c3f4b78ffd3f9b262279d2ab7172/libraries/ts-chocolate/src/packlets/runtime/session/model.ts#L278)

The role of this chocolate in the confection

***

### status

> `readonly` **status**: [`ConfectionSelectionStatus`](../type-aliases/ConfectionSelectionStatus.md)

Defined in: [ts-chocolate/src/packlets/runtime/session/model.ts:293](https://github.com/ErikFortune/fgv/blob/4be6f2d0ab84c3f4b78ffd3f9b262279d2ab7172/libraries/ts-chocolate/src/packlets/runtime/session/model.ts#L293)

Current status of this chocolate selection
