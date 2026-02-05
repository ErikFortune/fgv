[**@fgv/ts-chocolate**](../../../../README.md)

***

[@fgv/ts-chocolate](../../../../README.md) / [LibraryRuntime](../README.md) / IGanacheAnalysis

# Interface: IGanacheAnalysis

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:1574](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L1574)

Blended characteristics for a ganache recipe

## Properties

### characteristics

> `readonly` **characteristics**: [`IGanacheCharacteristics`](../../Entities/interfaces/IGanacheCharacteristics.md)

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:1578](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L1578)

Weighted average characteristics of all ingredients

***

### fatToWaterRatio

> `readonly` **fatToWaterRatio**: `number`

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:1588](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L1588)

Fat to water ratio (important for emulsion stability)

***

### sugarToWaterRatio

> `readonly` **sugarToWaterRatio**: `number`

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:1593](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L1593)

Sugar to water ratio (important for texture and preservation)

***

### totalFat

> `readonly` **totalFat**: [`Percentage`](../../../../type-aliases/Percentage.md)

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:1583](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L1583)

Total fat percentage (cacaoFat + milkFat + otherFats)

***

### totalWeight

> `readonly` **totalWeight**: [`Measurement`](../../../../type-aliases/Measurement.md)

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:1598](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L1598)

Total weight of the recipe
