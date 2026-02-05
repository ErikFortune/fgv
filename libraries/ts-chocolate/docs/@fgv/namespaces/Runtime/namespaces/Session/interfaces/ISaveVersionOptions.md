[**@fgv/ts-chocolate**](../../../../../../README.md)

***

[@fgv/ts-chocolate](../../../../../../README.md) / [Runtime](../../../README.md) / [Session](../README.md) / ISaveVersionOptions

# Interface: ISaveVersionOptions

Defined in: [ts-chocolate/src/packlets/runtime/session/model.ts:95](https://github.com/ErikFortune/fgv/blob/d51b0929f72c9206f7fc8c54016db3ae08502b0f/libraries/ts-chocolate/src/packlets/runtime/session/model.ts#L95)

Options for saving as a new version of the original recipe.

## Properties

### baseWeight

> `readonly` **baseWeight**: [`Measurement`](../../../../../../type-aliases/Measurement.md)

Defined in: [ts-chocolate/src/packlets/runtime/session/model.ts:99](https://github.com/ErikFortune/fgv/blob/d51b0929f72c9206f7fc8c54016db3ae08502b0f/libraries/ts-chocolate/src/packlets/runtime/session/model.ts#L99)

Base weight for the new version

***

### includeSessionNotes?

> `readonly` `optional` **includeSessionNotes**: `boolean`

Defined in: [ts-chocolate/src/packlets/runtime/session/model.ts:109](https://github.com/ErikFortune/fgv/blob/d51b0929f72c9206f7fc8c54016db3ae08502b0f/libraries/ts-chocolate/src/packlets/runtime/session/model.ts#L109)

Whether to include session notes in the recipe

***

### versionSpec

> `readonly` **versionSpec**: [`FillingVersionSpec`](../../../../../../type-aliases/FillingVersionSpec.md)

Defined in: [ts-chocolate/src/packlets/runtime/session/model.ts:104](https://github.com/ErikFortune/fgv/blob/d51b0929f72c9206f7fc8c54016db3ae08502b0f/libraries/ts-chocolate/src/packlets/runtime/session/model.ts#L104)

Version spec for the new version
