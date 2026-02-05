[**@fgv/ts-chocolate**](../../../../README.md)

***

[@fgv/ts-chocolate](../../../../README.md) / [Entities](../README.md) / IIngredientEntity

# Interface: IIngredientEntity

Defined in: [ts-chocolate/src/packlets/entities/ingredients/model.ts:93](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/entities/ingredients/model.ts#L93)

Base ingredient interface
All ingredients have these common properties

## Extended by

- [`IAlcoholIngredientEntity`](IAlcoholIngredientEntity.md)
- [`IDairyIngredientEntity`](IDairyIngredientEntity.md)
- [`IChocolateIngredientEntity`](IChocolateIngredientEntity.md)
- [`IFatIngredientEntity`](IFatIngredientEntity.md)
- [`ISugarIngredientEntity`](ISugarIngredientEntity.md)

## Properties

### allergens?

> `readonly` `optional` **allergens**: readonly [`Allergen`](../../../../type-aliases/Allergen.md)[]

Defined in: [ts-chocolate/src/packlets/entities/ingredients/model.ts:107](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/entities/ingredients/model.ts#L107)

Optional list of common allergens present in the ingredient

***

### baseId

> `readonly` **baseId**: [`BaseIngredientId`](../../../../type-aliases/BaseIngredientId.md)

Defined in: [ts-chocolate/src/packlets/entities/ingredients/model.ts:95](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/entities/ingredients/model.ts#L95)

Base identifier within source (no dots)

***

### category

> `readonly` **category**: [`IngredientCategory`](../../../../type-aliases/IngredientCategory.md)

Defined in: [ts-chocolate/src/packlets/entities/ingredients/model.ts:99](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/entities/ingredients/model.ts#L99)

Ingredient category (discriminator)

***

### certifications?

> `readonly` `optional` **certifications**: readonly [`Certification`](../../../../type-aliases/Certification.md)[]

Defined in: [ts-chocolate/src/packlets/entities/ingredients/model.ts:111](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/entities/ingredients/model.ts#L111)

Optional list of certifications the ingredient has

***

### density?

> `readonly` `optional` **density**: `number`

Defined in: [ts-chocolate/src/packlets/entities/ingredients/model.ts:117](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/entities/ingredients/model.ts#L117)

Density in g/mL for volume-to-weight conversion (default: 1.0)

***

### description?

> `readonly` `optional` **description**: `string`

Defined in: [ts-chocolate/src/packlets/entities/ingredients/model.ts:103](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/entities/ingredients/model.ts#L103)

Optional description

***

### ganacheCharacteristics

> `readonly` **ganacheCharacteristics**: [`IGanacheCharacteristics`](IGanacheCharacteristics.md)

Defined in: [ts-chocolate/src/packlets/entities/ingredients/model.ts:101](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/entities/ingredients/model.ts#L101)

Ganache-relevant characteristics

***

### manufacturer?

> `readonly` `optional` **manufacturer**: `string`

Defined in: [ts-chocolate/src/packlets/entities/ingredients/model.ts:105](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/entities/ingredients/model.ts#L105)

Optional manufacturer

***

### measurementUnits?

> `readonly` `optional` **measurementUnits**: [`IOptionsWithPreferred`](../../Model/interfaces/IOptionsWithPreferred.md)\<[`IMeasurementUnitOption`](../../Model/interfaces/IMeasurementUnitOption.md), [`MeasurementUnit`](../../../../type-aliases/MeasurementUnit.md)\>

Defined in: [ts-chocolate/src/packlets/entities/ingredients/model.ts:121](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/entities/ingredients/model.ts#L121)

Preferred and acceptable measurement units for this ingredient

***

### name

> `readonly` **name**: `string`

Defined in: [ts-chocolate/src/packlets/entities/ingredients/model.ts:97](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/entities/ingredients/model.ts#L97)

Display name

***

### phase?

> `readonly` `optional` **phase**: [`IngredientPhase`](../../../../type-aliases/IngredientPhase.md)

Defined in: [ts-chocolate/src/packlets/entities/ingredients/model.ts:119](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/entities/ingredients/model.ts#L119)

Physical phase - display hint for UI (e.g., "pour" vs "add")

***

### tags?

> `readonly` `optional` **tags**: readonly `string`[]

Defined in: [ts-chocolate/src/packlets/entities/ingredients/model.ts:115](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/entities/ingredients/model.ts#L115)

Optional tags for searching/filtering

***

### traceAllergens?

> `readonly` `optional` **traceAllergens**: readonly [`Allergen`](../../../../type-aliases/Allergen.md)[]

Defined in: [ts-chocolate/src/packlets/entities/ingredients/model.ts:109](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/entities/ingredients/model.ts#L109)

Optional list of trace allergens possibly present (e.g. due to contamination)

***

### urls?

> `readonly` `optional` **urls**: readonly [`ICategorizedUrl`](../../Model/interfaces/ICategorizedUrl.md)[]

Defined in: [ts-chocolate/src/packlets/entities/ingredients/model.ts:126](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/entities/ingredients/model.ts#L126)

Optional categorized URLs for external resources (manufacturer, product page, etc.)

***

### vegan?

> `readonly` `optional` **vegan**: `boolean`

Defined in: [ts-chocolate/src/packlets/entities/ingredients/model.ts:113](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/entities/ingredients/model.ts#L113)

Optional indicator if the ingredient is vegan
