[**@fgv/ts-chocolate**](../../../../README.md)

***

[@fgv/ts-chocolate](../../../../README.md) / [Entities](../README.md) / IAlcoholIngredientEntity

# Interface: IAlcoholIngredientEntity

Defined in: [ts-chocolate/src/packlets/entities/ingredients/model.ts:199](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/entities/ingredients/model.ts#L199)

Alcohol-specific ingredient

## Extends

- [`IIngredientEntity`](IIngredientEntity.md)

## Properties

### alcoholByVolume?

> `readonly` `optional` **alcoholByVolume**: [`Percentage`](../../../../type-aliases/Percentage.md)

Defined in: [ts-chocolate/src/packlets/entities/ingredients/model.ts:203](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/entities/ingredients/model.ts#L203)

Alcohol by volume percentage

***

### allergens?

> `readonly` `optional` **allergens**: readonly [`Allergen`](../../../../type-aliases/Allergen.md)[]

Defined in: [ts-chocolate/src/packlets/entities/ingredients/model.ts:107](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/entities/ingredients/model.ts#L107)

Optional list of common allergens present in the ingredient

#### Inherited from

[`IIngredientEntity`](IIngredientEntity.md).[`allergens`](IIngredientEntity.md#allergens)

***

### baseId

> `readonly` **baseId**: [`BaseIngredientId`](../../../../type-aliases/BaseIngredientId.md)

Defined in: [ts-chocolate/src/packlets/entities/ingredients/model.ts:95](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/entities/ingredients/model.ts#L95)

Base identifier within source (no dots)

#### Inherited from

[`IIngredientEntity`](IIngredientEntity.md).[`baseId`](IIngredientEntity.md#baseid)

***

### category

> `readonly` **category**: `"alcohol"`

Defined in: [ts-chocolate/src/packlets/entities/ingredients/model.ts:201](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/entities/ingredients/model.ts#L201)

Category is always Alcohol for this type

#### Overrides

[`IIngredientEntity`](IIngredientEntity.md).[`category`](IIngredientEntity.md#category)

***

### certifications?

> `readonly` `optional` **certifications**: readonly [`Certification`](../../../../type-aliases/Certification.md)[]

Defined in: [ts-chocolate/src/packlets/entities/ingredients/model.ts:111](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/entities/ingredients/model.ts#L111)

Optional list of certifications the ingredient has

#### Inherited from

[`IIngredientEntity`](IIngredientEntity.md).[`certifications`](IIngredientEntity.md#certifications)

***

### density?

> `readonly` `optional` **density**: `number`

Defined in: [ts-chocolate/src/packlets/entities/ingredients/model.ts:117](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/entities/ingredients/model.ts#L117)

Density in g/mL for volume-to-weight conversion (default: 1.0)

#### Inherited from

[`IIngredientEntity`](IIngredientEntity.md).[`density`](IIngredientEntity.md#density)

***

### description?

> `readonly` `optional` **description**: `string`

Defined in: [ts-chocolate/src/packlets/entities/ingredients/model.ts:103](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/entities/ingredients/model.ts#L103)

Optional description

#### Inherited from

[`IIngredientEntity`](IIngredientEntity.md).[`description`](IIngredientEntity.md#description)

***

### flavorProfile?

> `readonly` `optional` **flavorProfile**: `string`

Defined in: [ts-chocolate/src/packlets/entities/ingredients/model.ts:205](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/entities/ingredients/model.ts#L205)

Flavor profile description (optional)

***

### ganacheCharacteristics

> `readonly` **ganacheCharacteristics**: [`IGanacheCharacteristics`](IGanacheCharacteristics.md)

Defined in: [ts-chocolate/src/packlets/entities/ingredients/model.ts:101](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/entities/ingredients/model.ts#L101)

Ganache-relevant characteristics

#### Inherited from

[`IIngredientEntity`](IIngredientEntity.md).[`ganacheCharacteristics`](IIngredientEntity.md#ganachecharacteristics)

***

### manufacturer?

> `readonly` `optional` **manufacturer**: `string`

Defined in: [ts-chocolate/src/packlets/entities/ingredients/model.ts:105](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/entities/ingredients/model.ts#L105)

Optional manufacturer

#### Inherited from

[`IIngredientEntity`](IIngredientEntity.md).[`manufacturer`](IIngredientEntity.md#manufacturer)

***

### measurementUnits?

> `readonly` `optional` **measurementUnits**: [`IOptionsWithPreferred`](../../Model/interfaces/IOptionsWithPreferred.md)\<[`IMeasurementUnitOption`](../../Model/interfaces/IMeasurementUnitOption.md), [`MeasurementUnit`](../../../../type-aliases/MeasurementUnit.md)\>

Defined in: [ts-chocolate/src/packlets/entities/ingredients/model.ts:121](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/entities/ingredients/model.ts#L121)

Preferred and acceptable measurement units for this ingredient

#### Inherited from

[`IIngredientEntity`](IIngredientEntity.md).[`measurementUnits`](IIngredientEntity.md#measurementunits)

***

### name

> `readonly` **name**: `string`

Defined in: [ts-chocolate/src/packlets/entities/ingredients/model.ts:97](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/entities/ingredients/model.ts#L97)

Display name

#### Inherited from

[`IIngredientEntity`](IIngredientEntity.md).[`name`](IIngredientEntity.md#name)

***

### phase?

> `readonly` `optional` **phase**: [`IngredientPhase`](../../../../type-aliases/IngredientPhase.md)

Defined in: [ts-chocolate/src/packlets/entities/ingredients/model.ts:119](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/entities/ingredients/model.ts#L119)

Physical phase - display hint for UI (e.g., "pour" vs "add")

#### Inherited from

[`IIngredientEntity`](IIngredientEntity.md).[`phase`](IIngredientEntity.md#phase)

***

### tags?

> `readonly` `optional` **tags**: readonly `string`[]

Defined in: [ts-chocolate/src/packlets/entities/ingredients/model.ts:115](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/entities/ingredients/model.ts#L115)

Optional tags for searching/filtering

#### Inherited from

[`IIngredientEntity`](IIngredientEntity.md).[`tags`](IIngredientEntity.md#tags)

***

### traceAllergens?

> `readonly` `optional` **traceAllergens**: readonly [`Allergen`](../../../../type-aliases/Allergen.md)[]

Defined in: [ts-chocolate/src/packlets/entities/ingredients/model.ts:109](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/entities/ingredients/model.ts#L109)

Optional list of trace allergens possibly present (e.g. due to contamination)

#### Inherited from

[`IIngredientEntity`](IIngredientEntity.md).[`traceAllergens`](IIngredientEntity.md#traceallergens)

***

### urls?

> `readonly` `optional` **urls**: readonly [`ICategorizedUrl`](../../Model/interfaces/ICategorizedUrl.md)[]

Defined in: [ts-chocolate/src/packlets/entities/ingredients/model.ts:126](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/entities/ingredients/model.ts#L126)

Optional categorized URLs for external resources (manufacturer, product page, etc.)

#### Inherited from

[`IIngredientEntity`](IIngredientEntity.md).[`urls`](IIngredientEntity.md#urls)

***

### vegan?

> `readonly` `optional` **vegan**: `boolean`

Defined in: [ts-chocolate/src/packlets/entities/ingredients/model.ts:113](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/entities/ingredients/model.ts#L113)

Optional indicator if the ingredient is vegan

#### Inherited from

[`IIngredientEntity`](IIngredientEntity.md).[`vegan`](IIngredientEntity.md#vegan)
