[**@fgv/ts-chocolate**](../../../../README.md)

***

[@fgv/ts-chocolate](../../../../README.md) / [Entities](../README.md) / ISugarIngredientEntity

# Interface: ISugarIngredientEntity

Defined in: [ts-chocolate/src/packlets/entities/ingredients/model.ts:162](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/entities/ingredients/model.ts#L162)

Sugar-specific ingredient

## Extends

- [`IIngredientEntity`](IIngredientEntity.md)

## Properties

### allergens?

> `readonly` `optional` **allergens**: readonly [`Allergen`](../../../../type-aliases/Allergen.md)[]

Defined in: [ts-chocolate/src/packlets/entities/ingredients/model.ts:107](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/entities/ingredients/model.ts#L107)

Optional list of common allergens present in the ingredient

#### Inherited from

[`IIngredientEntity`](IIngredientEntity.md).[`allergens`](IIngredientEntity.md#allergens)

***

### baseId

> `readonly` **baseId**: [`BaseIngredientId`](../../../../type-aliases/BaseIngredientId.md)

Defined in: [ts-chocolate/src/packlets/entities/ingredients/model.ts:95](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/entities/ingredients/model.ts#L95)

Base identifier within source (no dots)

#### Inherited from

[`IIngredientEntity`](IIngredientEntity.md).[`baseId`](IIngredientEntity.md#baseid)

***

### category

> `readonly` **category**: `"sugar"`

Defined in: [ts-chocolate/src/packlets/entities/ingredients/model.ts:164](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/entities/ingredients/model.ts#L164)

Category is always Sugar for this type

#### Overrides

[`IIngredientEntity`](IIngredientEntity.md).[`category`](IIngredientEntity.md#category)

***

### certifications?

> `readonly` `optional` **certifications**: readonly [`Certification`](../../../../type-aliases/Certification.md)[]

Defined in: [ts-chocolate/src/packlets/entities/ingredients/model.ts:111](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/entities/ingredients/model.ts#L111)

Optional list of certifications the ingredient has

#### Inherited from

[`IIngredientEntity`](IIngredientEntity.md).[`certifications`](IIngredientEntity.md#certifications)

***

### density?

> `readonly` `optional` **density**: `number`

Defined in: [ts-chocolate/src/packlets/entities/ingredients/model.ts:117](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/entities/ingredients/model.ts#L117)

Density in g/mL for volume-to-weight conversion (default: 1.0)

#### Inherited from

[`IIngredientEntity`](IIngredientEntity.md).[`density`](IIngredientEntity.md#density)

***

### description?

> `readonly` `optional` **description**: `string`

Defined in: [ts-chocolate/src/packlets/entities/ingredients/model.ts:103](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/entities/ingredients/model.ts#L103)

Optional description

#### Inherited from

[`IIngredientEntity`](IIngredientEntity.md).[`description`](IIngredientEntity.md#description)

***

### ganacheCharacteristics

> `readonly` **ganacheCharacteristics**: [`IGanacheCharacteristics`](IGanacheCharacteristics.md)

Defined in: [ts-chocolate/src/packlets/entities/ingredients/model.ts:101](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/entities/ingredients/model.ts#L101)

Ganache-relevant characteristics

#### Inherited from

[`IIngredientEntity`](IIngredientEntity.md).[`ganacheCharacteristics`](IIngredientEntity.md#ganachecharacteristics)

***

### hydrationNumber?

> `readonly` `optional` **hydrationNumber**: `number`

Defined in: [ts-chocolate/src/packlets/entities/ingredients/model.ts:166](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/entities/ingredients/model.ts#L166)

Hydration number (water molecules per sugar molecule)

***

### manufacturer?

> `readonly` `optional` **manufacturer**: `string`

Defined in: [ts-chocolate/src/packlets/entities/ingredients/model.ts:105](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/entities/ingredients/model.ts#L105)

Optional manufacturer

#### Inherited from

[`IIngredientEntity`](IIngredientEntity.md).[`manufacturer`](IIngredientEntity.md#manufacturer)

***

### measurementUnits?

> `readonly` `optional` **measurementUnits**: [`IOptionsWithPreferred`](../../Model/interfaces/IOptionsWithPreferred.md)\<[`IMeasurementUnitOption`](../../Model/interfaces/IMeasurementUnitOption.md), [`MeasurementUnit`](../../../../type-aliases/MeasurementUnit.md)\>

Defined in: [ts-chocolate/src/packlets/entities/ingredients/model.ts:121](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/entities/ingredients/model.ts#L121)

Preferred and acceptable measurement units for this ingredient

#### Inherited from

[`IIngredientEntity`](IIngredientEntity.md).[`measurementUnits`](IIngredientEntity.md#measurementunits)

***

### name

> `readonly` **name**: `string`

Defined in: [ts-chocolate/src/packlets/entities/ingredients/model.ts:97](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/entities/ingredients/model.ts#L97)

Display name

#### Inherited from

[`IIngredientEntity`](IIngredientEntity.md).[`name`](IIngredientEntity.md#name)

***

### phase?

> `readonly` `optional` **phase**: [`IngredientPhase`](../../../../type-aliases/IngredientPhase.md)

Defined in: [ts-chocolate/src/packlets/entities/ingredients/model.ts:119](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/entities/ingredients/model.ts#L119)

Physical phase - display hint for UI (e.g., "pour" vs "add")

#### Inherited from

[`IIngredientEntity`](IIngredientEntity.md).[`phase`](IIngredientEntity.md#phase)

***

### sweetnessPotency?

> `readonly` `optional` **sweetnessPotency**: `number`

Defined in: [ts-chocolate/src/packlets/entities/ingredients/model.ts:168](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/entities/ingredients/model.ts#L168)

Sweetness potency relative to sucrose (1.0 = sucrose)

***

### tags?

> `readonly` `optional` **tags**: readonly `string`[]

Defined in: [ts-chocolate/src/packlets/entities/ingredients/model.ts:115](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/entities/ingredients/model.ts#L115)

Optional tags for searching/filtering

#### Inherited from

[`IIngredientEntity`](IIngredientEntity.md).[`tags`](IIngredientEntity.md#tags)

***

### traceAllergens?

> `readonly` `optional` **traceAllergens**: readonly [`Allergen`](../../../../type-aliases/Allergen.md)[]

Defined in: [ts-chocolate/src/packlets/entities/ingredients/model.ts:109](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/entities/ingredients/model.ts#L109)

Optional list of trace allergens possibly present (e.g. due to contamination)

#### Inherited from

[`IIngredientEntity`](IIngredientEntity.md).[`traceAllergens`](IIngredientEntity.md#traceallergens)

***

### urls?

> `readonly` `optional` **urls**: readonly [`ICategorizedUrl`](../../Model/interfaces/ICategorizedUrl.md)[]

Defined in: [ts-chocolate/src/packlets/entities/ingredients/model.ts:126](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/entities/ingredients/model.ts#L126)

Optional categorized URLs for external resources (manufacturer, product page, etc.)

#### Inherited from

[`IIngredientEntity`](IIngredientEntity.md).[`urls`](IIngredientEntity.md#urls)

***

### vegan?

> `readonly` `optional` **vegan**: `boolean`

Defined in: [ts-chocolate/src/packlets/entities/ingredients/model.ts:113](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/entities/ingredients/model.ts#L113)

Optional indicator if the ingredient is vegan

#### Inherited from

[`IIngredientEntity`](IIngredientEntity.md).[`vegan`](IIngredientEntity.md#vegan)
