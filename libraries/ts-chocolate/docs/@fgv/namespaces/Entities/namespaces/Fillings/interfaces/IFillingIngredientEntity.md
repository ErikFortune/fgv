[**@fgv/ts-chocolate**](../../../../../../README.md)

***

[@fgv/ts-chocolate](../../../../../../README.md) / [Entities](../../../README.md) / [Fillings](../README.md) / IFillingIngredientEntity

# Interface: IFillingIngredientEntity

Defined in: [ts-chocolate/src/packlets/entities/fillings/model.ts:73](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/entities/fillings/model.ts#L73)

Reference to an ingredient used in a filling recipe.
Uses IIdsWithPreferred pattern - `ids` contains all valid ingredient options,
`preferredId` indicates the default/recommended one.

## Properties

### amount

> `readonly` **amount**: [`Measurement`](../../../../../../type-aliases/Measurement.md)

Defined in: [ts-chocolate/src/packlets/entities/fillings/model.ts:84](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/entities/fillings/model.ts#L84)

Amount of this ingredient in the specified unit.
When unit is not specified, this is in grams.

***

### ingredient

> `readonly` **ingredient**: [`IIdsWithPreferred`](../../../../Model/interfaces/IIdsWithPreferred.md)\<[`IngredientId`](../../../../../../type-aliases/IngredientId.md)\>

Defined in: [ts-chocolate/src/packlets/entities/fillings/model.ts:78](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/entities/fillings/model.ts#L78)

Available ingredient options with preferred selection.
The preferredId (or first id if not specified) is the primary ingredient.

***

### modifiers?

> `readonly` `optional` **modifiers**: [`IIngredientModifiers`](IIngredientModifiers.md)

Defined in: [ts-chocolate/src/packlets/entities/fillings/model.ts:96](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/entities/fillings/model.ts#L96)

Optional modifiers that qualify how the ingredient is measured or added.
Includes spoonLevel, toTaste, and future measurement qualifiers.

***

### notes?

> `readonly` `optional` **notes**: readonly [`ICategorizedNote`](../../../../Model/interfaces/ICategorizedNote.md)[]

Defined in: [ts-chocolate/src/packlets/entities/fillings/model.ts:101](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/entities/fillings/model.ts#L101)

Optional categorized notes for this specific ingredient usage

***

### unit?

> `readonly` `optional` **unit**: [`MeasurementUnit`](../../../../../../type-aliases/MeasurementUnit.md)

Defined in: [ts-chocolate/src/packlets/entities/fillings/model.ts:90](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/entities/fillings/model.ts#L90)

Measurement unit for the amount.
Defaults to 'g' (grams) when not specified.
