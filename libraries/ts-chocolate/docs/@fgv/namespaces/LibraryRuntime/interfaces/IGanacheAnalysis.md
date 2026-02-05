[**@fgv/ts-chocolate**](../../../../README.md)

***

[@fgv/ts-chocolate](../../../../README.md) / [LibraryRuntime](../README.md) / IGanacheAnalysis

# Interface: IGanacheAnalysis

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:1566](https://github.com/ErikFortune/fgv/blob/d51b0929f72c9206f7fc8c54016db3ae08502b0f/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L1566)

Blended characteristics for a ganache recipe

## Properties

### characteristics

> `readonly` **characteristics**: [`IGanacheCharacteristics`](../../Entities/interfaces/IGanacheCharacteristics.md)

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:1570](https://github.com/ErikFortune/fgv/blob/d51b0929f72c9206f7fc8c54016db3ae08502b0f/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L1570)

Weighted average characteristics of all ingredients

***

### fatToWaterRatio

> `readonly` **fatToWaterRatio**: `number`

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:1580](https://github.com/ErikFortune/fgv/blob/d51b0929f72c9206f7fc8c54016db3ae08502b0f/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L1580)

Fat to water ratio (important for emulsion stability)

***

### sugarToWaterRatio

> `readonly` **sugarToWaterRatio**: `number`

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:1585](https://github.com/ErikFortune/fgv/blob/d51b0929f72c9206f7fc8c54016db3ae08502b0f/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L1585)

Sugar to water ratio (important for texture and preservation)

***

### totalFat

> `readonly` **totalFat**: [`Percentage`](../../../../type-aliases/Percentage.md)

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:1575](https://github.com/ErikFortune/fgv/blob/d51b0929f72c9206f7fc8c54016db3ae08502b0f/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L1575)

Total fat percentage (cacaoFat + milkFat + otherFats)

***

### totalWeight

> `readonly` **totalWeight**: [`Measurement`](../../../../type-aliases/Measurement.md)

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:1590](https://github.com/ErikFortune/fgv/blob/d51b0929f72c9206f7fc8c54016db3ae08502b0f/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L1590)

Total weight of the recipe
