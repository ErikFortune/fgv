[**@fgv/ts-chocolate**](../../../../../../README.md)

***

[@fgv/ts-chocolate](../../../../../../README.md) / [Entities](../../../README.md) / [Confections](../README.md) / IIngredientFillingOptionEntity

# Interface: IIngredientFillingOptionEntity

Defined in: [ts-chocolate/src/packlets/entities/confections/model.ts:143](https://github.com/ErikFortune/fgv/blob/4be6f2d0ab84c3f4b78ffd3f9b262279d2ab7172/libraries/ts-chocolate/src/packlets/entities/confections/model.ts#L143)

Ingredient filling option - references an ingredient (e.g., praline paste)

## Properties

### id

> `readonly` **id**: [`IngredientId`](../../../../../../type-aliases/IngredientId.md)

Defined in: [ts-chocolate/src/packlets/entities/confections/model.ts:147](https://github.com/ErikFortune/fgv/blob/4be6f2d0ab84c3f4b78ffd3f9b262279d2ab7172/libraries/ts-chocolate/src/packlets/entities/confections/model.ts#L147)

The ingredient ID

***

### notes?

> `readonly` `optional` **notes**: readonly [`ICategorizedNote`](../../../../Model/interfaces/ICategorizedNote.md)[]

Defined in: [ts-chocolate/src/packlets/entities/confections/model.ts:149](https://github.com/ErikFortune/fgv/blob/4be6f2d0ab84c3f4b78ffd3f9b262279d2ab7172/libraries/ts-chocolate/src/packlets/entities/confections/model.ts#L149)

Optional categorized notes specific to this filling option

***

### type

> `readonly` **type**: `"ingredient"`

Defined in: [ts-chocolate/src/packlets/entities/confections/model.ts:145](https://github.com/ErikFortune/fgv/blob/4be6f2d0ab84c3f4b78ffd3f9b262279d2ab7172/libraries/ts-chocolate/src/packlets/entities/confections/model.ts#L145)

Discriminator for ingredient filling
