[**@fgv/ts-chocolate**](../../../../../../README.md)

***

[@fgv/ts-chocolate](../../../../../../README.md) / [Entities](../../../README.md) / [Fillings](../README.md) / IProducedFillingIngredientEntity

# Interface: IProducedFillingIngredientEntity

Defined in: [ts-chocolate/src/packlets/entities/fillings/model.ts:385](https://github.com/ErikFortune/fgv/blob/4be6f2d0ab84c3f4b78ffd3f9b262279d2ab7172/libraries/ts-chocolate/src/packlets/entities/fillings/model.ts#L385)

Resolved filling ingredient with concrete choice.
Unlike IFillingIngredient which uses IIdsWithPreferred, this stores
the single actual ingredient that was used in production.

## Properties

### amount

> `readonly` **amount**: [`Measurement`](../../../../../../type-aliases/Measurement.md)

Defined in: [ts-chocolate/src/packlets/entities/fillings/model.ts:389](https://github.com/ErikFortune/fgv/blob/4be6f2d0ab84c3f4b78ffd3f9b262279d2ab7172/libraries/ts-chocolate/src/packlets/entities/fillings/model.ts#L389)

Actual amount used

***

### ingredientId

> `readonly` **ingredientId**: [`IngredientId`](../../../../../../type-aliases/IngredientId.md)

Defined in: [ts-chocolate/src/packlets/entities/fillings/model.ts:387](https://github.com/ErikFortune/fgv/blob/4be6f2d0ab84c3f4b78ffd3f9b262279d2ab7172/libraries/ts-chocolate/src/packlets/entities/fillings/model.ts#L387)

The single selected ingredient ID

***

### modifiers?

> `readonly` `optional` **modifiers**: [`IIngredientModifiers`](IIngredientModifiers.md)

Defined in: [ts-chocolate/src/packlets/entities/fillings/model.ts:393](https://github.com/ErikFortune/fgv/blob/4be6f2d0ab84c3f4b78ffd3f9b262279d2ab7172/libraries/ts-chocolate/src/packlets/entities/fillings/model.ts#L393)

Measurement modifiers (spoonLevel, toTaste) - production metadata

***

### notes?

> `readonly` `optional` **notes**: readonly [`ICategorizedNote`](../../../../Model/interfaces/ICategorizedNote.md)[]

Defined in: [ts-chocolate/src/packlets/entities/fillings/model.ts:395](https://github.com/ErikFortune/fgv/blob/4be6f2d0ab84c3f4b78ffd3f9b262279d2ab7172/libraries/ts-chocolate/src/packlets/entities/fillings/model.ts#L395)

Optional categorized notes about this ingredient usage

***

### unit?

> `readonly` `optional` **unit**: [`MeasurementUnit`](../../../../../../type-aliases/MeasurementUnit.md)

Defined in: [ts-chocolate/src/packlets/entities/fillings/model.ts:391](https://github.com/ErikFortune/fgv/blob/4be6f2d0ab84c3f4b78ffd3f9b262279d2ab7172/libraries/ts-chocolate/src/packlets/entities/fillings/model.ts#L391)

Measurement unit (default: 'g')
