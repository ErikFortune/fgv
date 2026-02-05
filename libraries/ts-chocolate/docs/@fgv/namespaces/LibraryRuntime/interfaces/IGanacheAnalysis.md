[**@fgv/ts-chocolate**](../../../../README.md)

***

[@fgv/ts-chocolate](../../../../README.md) / [LibraryRuntime](../README.md) / IGanacheAnalysis

# Interface: IGanacheAnalysis

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:1615](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L1615)

Blended characteristics for a ganache recipe

## Properties

### characteristics

> `readonly` **characteristics**: [`IGanacheCharacteristics`](../../Entities/interfaces/IGanacheCharacteristics.md)

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:1619](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L1619)

Weighted average characteristics of all ingredients

***

### fatToWaterRatio

> `readonly` **fatToWaterRatio**: `number`

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:1629](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L1629)

Fat to water ratio (important for emulsion stability)

***

### sugarToWaterRatio

> `readonly` **sugarToWaterRatio**: `number`

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:1634](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L1634)

Sugar to water ratio (important for texture and preservation)

***

### totalFat

> `readonly` **totalFat**: [`Percentage`](../../../../type-aliases/Percentage.md)

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:1624](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L1624)

Total fat percentage (cacaoFat + milkFat + otherFats)

***

### totalWeight

> `readonly` **totalWeight**: [`Measurement`](../../../../type-aliases/Measurement.md)

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:1639](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L1639)

Total weight of the recipe
