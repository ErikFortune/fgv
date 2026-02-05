[**@fgv/ts-chocolate**](../../../../../../README.md)

***

[@fgv/ts-chocolate](../../../../../../README.md) / [Runtime](../../../README.md) / [Session](../README.md) / ISessionYield

# Interface: ISessionYield

Defined in: [ts-chocolate/src/packlets/runtime/session/model.ts:300](https://github.com/ErikFortune/fgv/blob/d51b0929f72c9206f7fc8c54016db3ae08502b0f/libraries/ts-chocolate/src/packlets/runtime/session/model.ts#L300)

Tracks yield modifications for a confection session

## Properties

### count

> `readonly` **count**: `number`

Defined in: [ts-chocolate/src/packlets/runtime/session/model.ts:304](https://github.com/ErikFortune/fgv/blob/d51b0929f72c9206f7fc8c54016db3ae08502b0f/libraries/ts-chocolate/src/packlets/runtime/session/model.ts#L304)

Current yield count

***

### originalCount

> `readonly` **originalCount**: `number`

Defined in: [ts-chocolate/src/packlets/runtime/session/model.ts:309](https://github.com/ErikFortune/fgv/blob/d51b0929f72c9206f7fc8c54016db3ae08502b0f/libraries/ts-chocolate/src/packlets/runtime/session/model.ts#L309)

Original yield count when the session started

***

### originalWeightPerPiece?

> `readonly` `optional` **originalWeightPerPiece**: [`Measurement`](../../../../../../type-aliases/Measurement.md)

Defined in: [ts-chocolate/src/packlets/runtime/session/model.ts:319](https://github.com/ErikFortune/fgv/blob/d51b0929f72c9206f7fc8c54016db3ae08502b0f/libraries/ts-chocolate/src/packlets/runtime/session/model.ts#L319)

Original weight per piece when the session started

***

### status

> `readonly` **status**: [`ConfectionSelectionStatus`](../type-aliases/ConfectionSelectionStatus.md)

Defined in: [ts-chocolate/src/packlets/runtime/session/model.ts:324](https://github.com/ErikFortune/fgv/blob/d51b0929f72c9206f7fc8c54016db3ae08502b0f/libraries/ts-chocolate/src/packlets/runtime/session/model.ts#L324)

Current status of yield modifications

***

### weightPerPiece?

> `readonly` `optional` **weightPerPiece**: [`Measurement`](../../../../../../type-aliases/Measurement.md)

Defined in: [ts-chocolate/src/packlets/runtime/session/model.ts:314](https://github.com/ErikFortune/fgv/blob/d51b0929f72c9206f7fc8c54016db3ae08502b0f/libraries/ts-chocolate/src/packlets/runtime/session/model.ts#L314)

Current weight per piece (optional)
