[**@fgv/ts-chocolate**](../../../../../../README.md)

***

[@fgv/ts-chocolate](../../../../../../README.md) / [Runtime](../../../README.md) / [Session](../README.md) / ISaveNewRecipeOptions

# Interface: ISaveNewRecipeOptions

Defined in: [ts-chocolate/src/packlets/runtime/session/model.ts:132](https://github.com/ErikFortune/fgv/blob/4be6f2d0ab84c3f4b78ffd3f9b262279d2ab7172/libraries/ts-chocolate/src/packlets/runtime/session/model.ts#L132)

Options for saving as an entirely new recipe.

## Properties

### baseWeight

> `readonly` **baseWeight**: [`Measurement`](../../../../../../type-aliases/Measurement.md)

Defined in: [ts-chocolate/src/packlets/runtime/session/model.ts:141](https://github.com/ErikFortune/fgv/blob/4be6f2d0ab84c3f4b78ffd3f9b262279d2ab7172/libraries/ts-chocolate/src/packlets/runtime/session/model.ts#L141)

Base weight for the new recipe

***

### includeSessionNotes?

> `readonly` `optional` **includeSessionNotes**: `boolean`

Defined in: [ts-chocolate/src/packlets/runtime/session/model.ts:151](https://github.com/ErikFortune/fgv/blob/4be6f2d0ab84c3f4b78ffd3f9b262279d2ab7172/libraries/ts-chocolate/src/packlets/runtime/session/model.ts#L151)

Whether to include session notes in the recipe

***

### newId

> `readonly` **newId**: [`FillingId`](../../../../../../type-aliases/FillingId.md)

Defined in: [ts-chocolate/src/packlets/runtime/session/model.ts:136](https://github.com/ErikFortune/fgv/blob/4be6f2d0ab84c3f4b78ffd3f9b262279d2ab7172/libraries/ts-chocolate/src/packlets/runtime/session/model.ts#L136)

ID for the new recipe

***

### versionSpec

> `readonly` **versionSpec**: [`FillingVersionSpec`](../../../../../../type-aliases/FillingVersionSpec.md)

Defined in: [ts-chocolate/src/packlets/runtime/session/model.ts:146](https://github.com/ErikFortune/fgv/blob/4be6f2d0ab84c3f4b78ffd3f9b262279d2ab7172/libraries/ts-chocolate/src/packlets/runtime/session/model.ts#L146)

Version spec for the new recipe's first version
