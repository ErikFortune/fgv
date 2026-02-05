[**@fgv/ts-chocolate**](../../../../../../README.md)

***

[@fgv/ts-chocolate](../../../../../../README.md) / [Entities](../../../README.md) / [Confections](../README.md) / IMoldedBonBonYield

# Interface: IMoldedBonBonYield

Defined in: [ts-chocolate/src/packlets/entities/confections/model.ts:67](https://github.com/ErikFortune/fgv/blob/d51b0929f72c9206f7fc8c54016db3ae08502b0f/libraries/ts-chocolate/src/packlets/entities/confections/model.ts#L67)

Frame-based yield specification for molded bonbons.
Stores frames + buffer percentage as primary values; count is computed from mold.

## Properties

### bufferPercentage

> `readonly` **bufferPercentage**: `number`

Defined in: [ts-chocolate/src/packlets/entities/confections/model.ts:73](https://github.com/ErikFortune/fgv/blob/d51b0929f72c9206f7fc8c54016db3ae08502b0f/libraries/ts-chocolate/src/packlets/entities/confections/model.ts#L73)

Buffer percentage (e.g., 0.1 for 10% overfill)

***

### count

> `readonly` **count**: `number`

Defined in: [ts-chocolate/src/packlets/entities/confections/model.ts:75](https://github.com/ErikFortune/fgv/blob/d51b0929f72c9206f7fc8c54016db3ae08502b0f/libraries/ts-chocolate/src/packlets/entities/confections/model.ts#L75)

Computed count: frames × cavitiesPerFrame

***

### frames

> `readonly` **frames**: `number`

Defined in: [ts-chocolate/src/packlets/entities/confections/model.ts:71](https://github.com/ErikFortune/fgv/blob/d51b0929f72c9206f7fc8c54016db3ae08502b0f/libraries/ts-chocolate/src/packlets/entities/confections/model.ts#L71)

Number of frames to produce (primary storage)

***

### unit?

> `readonly` `optional` **unit**: `string`

Defined in: [ts-chocolate/src/packlets/entities/confections/model.ts:77](https://github.com/ErikFortune/fgv/blob/d51b0929f72c9206f7fc8c54016db3ae08502b0f/libraries/ts-chocolate/src/packlets/entities/confections/model.ts#L77)

Unit description (usually 'pieces')

***

### weightPerPiece?

> `readonly` `optional` **weightPerPiece**: [`Measurement`](../../../../../../type-aliases/Measurement.md)

Defined in: [ts-chocolate/src/packlets/entities/confections/model.ts:79](https://github.com/ErikFortune/fgv/blob/d51b0929f72c9206f7fc8c54016db3ae08502b0f/libraries/ts-chocolate/src/packlets/entities/confections/model.ts#L79)

Weight per piece in grams (from mold.cavityWeight)

***

### yieldType

> `readonly` **yieldType**: `"frames"`

Defined in: [ts-chocolate/src/packlets/entities/confections/model.ts:69](https://github.com/ErikFortune/fgv/blob/d51b0929f72c9206f7fc8c54016db3ae08502b0f/libraries/ts-chocolate/src/packlets/entities/confections/model.ts#L69)

Discriminator for yield type
