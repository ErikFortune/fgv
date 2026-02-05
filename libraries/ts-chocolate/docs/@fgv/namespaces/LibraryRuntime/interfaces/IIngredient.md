[**@fgv/ts-chocolate**](../../../../README.md)

***

[@fgv/ts-chocolate](../../../../README.md) / [LibraryRuntime](../README.md) / IIngredient

# Interface: IIngredient

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:110](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L110)

A resolved runtime view of an ingredient with navigation capabilities.

This interface includes all properties from the data layer `IIngredientEntity`
plus runtime-specific additions:
- Composite identity (`id`, `sourceId`) for cross-source references
- Navigation to recipes that use this ingredient
- Type narrowing methods for discriminated access
- Access to underlying data entities

Note: Does not extend `IIngredientEntity` directly because the class implementation
provides the same shape but with additional runtime behavior.

## Extended by

- [`IChocolateIngredient`](IChocolateIngredient.md)
- [`IDairyIngredient`](IDairyIngredient.md)
- [`ISugarIngredient`](ISugarIngredient.md)
- [`IFatIngredient`](IFatIngredient.md)
- [`IAlcoholIngredient`](IAlcoholIngredient.md)

## Properties

### allergens?

> `readonly` `optional` **allergens**: readonly [`Allergen`](../../../../type-aliases/Allergen.md)[]

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:147](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L147)

Optional list of common allergens present in the ingredient

***

### baseId

> `readonly` **baseId**: [`BaseIngredientId`](../../../../type-aliases/BaseIngredientId.md)

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:127](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L127)

The base ingredient ID within the source.

***

### category

> `readonly` **category**: [`IngredientCategory`](../../../../type-aliases/IngredientCategory.md)

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:135](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L135)

Ingredient category (discriminator)

***

### certifications?

> `readonly` `optional` **certifications**: readonly [`Certification`](../../../../type-aliases/Certification.md)[]

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:153](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L153)

Optional list of certifications the ingredient has

***

### collectionId

> `readonly` **collectionId**: [`CollectionId`](../../../../type-aliases/CollectionId.md)

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:122](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L122)

The collection ID part of the composite ID.

***

### description?

> `readonly` `optional` **description**: `string`

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:141](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L141)

Optional description

***

### entity

> `readonly` **entity**: [`IngredientEntity`](../../Entities/type-aliases/IngredientEntity.md)

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:213](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L213)

Gets the underlying ingredient entity data.

***

### ganacheCharacteristics

> `readonly` **ganacheCharacteristics**: [`IGanacheCharacteristics`](../../Entities/interfaces/IGanacheCharacteristics.md)

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:138](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L138)

Ganache-relevant characteristics

***

### id

> `readonly` **id**: [`IngredientId`](../../../../type-aliases/IngredientId.md)

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:117](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L117)

The composite ingredient ID (e.g., "felchlin.maracaibo-65").
Combines source and base ID for unique identification across sources.

***

### manufacturer?

> `readonly` `optional` **manufacturer**: `string`

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:144](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L144)

Optional manufacturer

***

### name

> `readonly` **name**: `string`

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:132](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L132)

Display name

***

### tags?

> `readonly` `optional` **tags**: readonly `string`[]

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:159](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L159)

Optional tags for searching/filtering

***

### traceAllergens?

> `readonly` `optional` **traceAllergens**: readonly [`Allergen`](../../../../type-aliases/Allergen.md)[]

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:150](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L150)

Optional list of trace allergens possibly present (e.g. due to contamination)

***

### vegan?

> `readonly` `optional` **vegan**: `boolean`

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:156](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L156)

Optional indicator if the ingredient is vegan

## Methods

### alternateInFillings()

> **alternateInFillings**(): [`IFillingRecipe`](IFillingRecipe.md)[]

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:176](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L176)

Gets filling recipes where this ingredient is listed as an alternate.

#### Returns

[`IFillingRecipe`](IFillingRecipe.md)[]

***

### isAlcohol()

> **isAlcohol**(): `this is IAlcoholIngredient`

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:208](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L208)

Returns true if this is an alcohol ingredient.
When true, alcohol-specific properties are available.

#### Returns

`this is IAlcoholIngredient`

***

### isChocolate()

> **isChocolate**(): `this is IChocolateIngredient`

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:184](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L184)

Returns true if this is a chocolate ingredient.
When true, chocolate-specific properties are available.

#### Returns

`this is IChocolateIngredient`

***

### isDairy()

> **isDairy**(): `this is IDairyIngredient`

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:190](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L190)

Returns true if this is a dairy ingredient.
When true, dairy-specific properties are available.

#### Returns

`this is IDairyIngredient`

***

### isFat()

> **isFat**(): `this is IFatIngredient`

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:202](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L202)

Returns true if this is a fat ingredient.
When true, fat-specific properties are available.

#### Returns

`this is IFatIngredient`

***

### isSugar()

> **isSugar**(): `this is ISugarIngredient`

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:196](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L196)

Returns true if this is a sugar ingredient.
When true, sugar-specific properties are available.

#### Returns

`this is ISugarIngredient`

***

### primaryInFillings()

> **primaryInFillings**(): [`IFillingRecipe`](IFillingRecipe.md)[]

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:171](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L171)

Gets filling recipes where this ingredient is the primary choice.

#### Returns

[`IFillingRecipe`](IFillingRecipe.md)[]

***

### usedByFillings()

> **usedByFillings**(): [`IFillingRecipe`](IFillingRecipe.md)[]

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:166](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L166)

Gets all filling recipes that use this ingredient (primary or alternate).

#### Returns

[`IFillingRecipe`](IFillingRecipe.md)[]
