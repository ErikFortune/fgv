[**@fgv/ts-chocolate**](../../../../../../README.md)

***

[@fgv/ts-chocolate](../../../../../../README.md) / [Runtime](../../../README.md) / [Session](../README.md) / ISessionCoating

# Interface: ISessionCoating

Defined in: [ts-chocolate/src/packlets/runtime/session/model.ts:352](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/runtime/session/model.ts#L352)

Tracks a coating selection for rolled truffles

## Properties

### ingredientId

> `readonly` **ingredientId**: [`IngredientId`](../../../../../../type-aliases/IngredientId.md)

Defined in: [ts-chocolate/src/packlets/runtime/session/model.ts:356](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/runtime/session/model.ts#L356)

The currently selected coating ingredient ID

***

### originalIngredientId?

> `readonly` `optional` **originalIngredientId**: [`IngredientId`](../../../../../../type-aliases/IngredientId.md)

Defined in: [ts-chocolate/src/packlets/runtime/session/model.ts:361](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/runtime/session/model.ts#L361)

The original coating ingredient ID when the session started

***

### status

> `readonly` **status**: [`ConfectionSelectionStatus`](../type-aliases/ConfectionSelectionStatus.md)

Defined in: [ts-chocolate/src/packlets/runtime/session/model.ts:366](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/runtime/session/model.ts#L366)

Current status of the coating selection
