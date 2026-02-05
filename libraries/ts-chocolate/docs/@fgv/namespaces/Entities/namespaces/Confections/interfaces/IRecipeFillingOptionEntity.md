[**@fgv/ts-chocolate**](../../../../../../README.md)

***

[@fgv/ts-chocolate](../../../../../../README.md) / [Entities](../../../README.md) / [Confections](../README.md) / IRecipeFillingOptionEntity

# Interface: IRecipeFillingOptionEntity

Defined in: [ts-chocolate/src/packlets/entities/confections/model.ts:130](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/entities/confections/model.ts#L130)

Recipe filling option - references a recipe (e.g., ganache)

## Properties

### id

> `readonly` **id**: [`FillingId`](../../../../../../type-aliases/FillingId.md)

Defined in: [ts-chocolate/src/packlets/entities/confections/model.ts:134](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/entities/confections/model.ts#L134)

The filling recipe ID

***

### notes?

> `readonly` `optional` **notes**: readonly [`ICategorizedNote`](../../../../Model/interfaces/ICategorizedNote.md)[]

Defined in: [ts-chocolate/src/packlets/entities/confections/model.ts:136](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/entities/confections/model.ts#L136)

Optional categorized notes specific to this filling option

***

### type

> `readonly` **type**: `"recipe"`

Defined in: [ts-chocolate/src/packlets/entities/confections/model.ts:132](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/entities/confections/model.ts#L132)

Discriminator for recipe filling
