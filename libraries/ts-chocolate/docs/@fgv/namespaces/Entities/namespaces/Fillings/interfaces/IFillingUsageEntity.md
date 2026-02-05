[**@fgv/ts-chocolate**](../../../../../../README.md)

***

[@fgv/ts-chocolate](../../../../../../README.md) / [Entities](../../../README.md) / [Fillings](../README.md) / IFillingUsageEntity

# Interface: IFillingUsageEntity

Defined in: [ts-chocolate/src/packlets/entities/fillings/model.ts:160](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/entities/fillings/model.ts#L160)

Record of a filling recipe being used (for production tracking)

## Properties

### date

> `readonly` **date**: `string`

Defined in: [ts-chocolate/src/packlets/entities/fillings/model.ts:164](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/entities/fillings/model.ts#L164)

Date of use in ISO 8601 format

***

### modifiedVersionSpec?

> `readonly` `optional` **modifiedVersionSpec**: [`FillingVersionSpec`](../../../../../../type-aliases/FillingVersionSpec.md)

Defined in: [ts-chocolate/src/packlets/entities/fillings/model.ts:190](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/entities/fillings/model.ts#L190)

If modifications were made during this usage that created a new version,
this is the ID of that new version

***

### notes?

> `readonly` `optional` **notes**: readonly [`ICategorizedNote`](../../../../Model/interfaces/ICategorizedNote.md)[]

Defined in: [ts-chocolate/src/packlets/entities/fillings/model.ts:184](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/entities/fillings/model.ts#L184)

Optional categorized notes about this usage

***

### scaledWeight

> `readonly` **scaledWeight**: [`Measurement`](../../../../../../type-aliases/Measurement.md)

Defined in: [ts-chocolate/src/packlets/entities/fillings/model.ts:174](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/entities/fillings/model.ts#L174)

Scaled weight used for this production run

***

### scaleFactor?

> `readonly` `optional` **scaleFactor**: `number`

Defined in: [ts-chocolate/src/packlets/entities/fillings/model.ts:179](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/entities/fillings/model.ts#L179)

Optional scale factor for reference

***

### versionSpec

> `readonly` **versionSpec**: [`FillingVersionSpec`](../../../../../../type-aliases/FillingVersionSpec.md)

Defined in: [ts-chocolate/src/packlets/entities/fillings/model.ts:169](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/entities/fillings/model.ts#L169)

Which version was used
