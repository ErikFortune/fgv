[**@fgv/ts-chocolate**](../../../../README.md)

***

[@fgv/ts-chocolate](../../../../README.md) / [LibraryRuntime](../README.md) / ISugarIngredient

# Interface: ISugarIngredient

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:278](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L278)

Runtime ingredient narrowed to sugar type.

## Extends

- [`IIngredient`](IIngredient.md)

## Properties

### allergens?

> `readonly` `optional` **allergens**: readonly [`Allergen`](../../../../type-aliases/Allergen.md)[]

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:147](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L147)

Optional list of common allergens present in the ingredient

#### Inherited from

[`IIngredient`](IIngredient.md).[`allergens`](IIngredient.md#allergens)

***

### baseId

> `readonly` **baseId**: [`BaseIngredientId`](../../../../type-aliases/BaseIngredientId.md)

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:127](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L127)

The base ingredient ID within the source.

#### Inherited from

[`IIngredient`](IIngredient.md).[`baseId`](IIngredient.md#baseid)

***

### category

> `readonly` **category**: `"sugar"`

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:280](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L280)

Category is always sugar for this type

#### Overrides

[`IIngredient`](IIngredient.md).[`category`](IIngredient.md#category)

***

### certifications?

> `readonly` `optional` **certifications**: readonly [`Certification`](../../../../type-aliases/Certification.md)[]

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:153](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L153)

Optional list of certifications the ingredient has

#### Inherited from

[`IIngredient`](IIngredient.md).[`certifications`](IIngredient.md#certifications)

***

### collectionId

> `readonly` **collectionId**: [`CollectionId`](../../../../type-aliases/CollectionId.md)

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:122](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L122)

The collection ID part of the composite ID.

#### Inherited from

[`IIngredient`](IIngredient.md).[`collectionId`](IIngredient.md#collectionid)

***

### description?

> `readonly` `optional` **description**: `string`

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:141](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L141)

Optional description

#### Inherited from

[`IIngredient`](IIngredient.md).[`description`](IIngredient.md#description)

***

### entity

> `readonly` **entity**: [`ISugarIngredientEntity`](../../Entities/interfaces/ISugarIngredientEntity.md)

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:291](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L291)

Gets the underlying ingredient entity data.

#### Overrides

[`IIngredient`](IIngredient.md).[`entity`](IIngredient.md#entity)

***

### ganacheCharacteristics

> `readonly` **ganacheCharacteristics**: [`IGanacheCharacteristics`](../../Entities/interfaces/IGanacheCharacteristics.md)

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:138](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L138)

Ganache-relevant characteristics

#### Inherited from

[`IIngredient`](IIngredient.md).[`ganacheCharacteristics`](IIngredient.md#ganachecharacteristics)

***

### hydrationNumber?

> `readonly` `optional` **hydrationNumber**: `number`

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:283](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L283)

Hydration number (water molecules per sugar molecule)

***

### id

> `readonly` **id**: [`IngredientId`](../../../../type-aliases/IngredientId.md)

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:117](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L117)

The composite ingredient ID (e.g., "felchlin.maracaibo-65").
Combines source and base ID for unique identification across sources.

#### Inherited from

[`IIngredient`](IIngredient.md).[`id`](IIngredient.md#id)

***

### manufacturer?

> `readonly` `optional` **manufacturer**: `string`

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:144](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L144)

Optional manufacturer

#### Inherited from

[`IIngredient`](IIngredient.md).[`manufacturer`](IIngredient.md#manufacturer)

***

### name

> `readonly` **name**: `string`

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:132](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L132)

Display name

#### Inherited from

[`IIngredient`](IIngredient.md).[`name`](IIngredient.md#name)

***

### sweetnessPotency?

> `readonly` `optional` **sweetnessPotency**: `number`

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:286](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L286)

Sweetness potency relative to sucrose (1.0 = sucrose)

***

### tags?

> `readonly` `optional` **tags**: readonly `string`[]

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:159](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L159)

Optional tags for searching/filtering

#### Inherited from

[`IIngredient`](IIngredient.md).[`tags`](IIngredient.md#tags)

***

### traceAllergens?

> `readonly` `optional` **traceAllergens**: readonly [`Allergen`](../../../../type-aliases/Allergen.md)[]

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:150](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L150)

Optional list of trace allergens possibly present (e.g. due to contamination)

#### Inherited from

[`IIngredient`](IIngredient.md).[`traceAllergens`](IIngredient.md#traceallergens)

***

### vegan?

> `readonly` `optional` **vegan**: `boolean`

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:156](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L156)

Optional indicator if the ingredient is vegan

#### Inherited from

[`IIngredient`](IIngredient.md).[`vegan`](IIngredient.md#vegan)

## Methods

### alternateInFillings()

> **alternateInFillings**(): [`IFillingRecipe`](IFillingRecipe.md)[]

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:176](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L176)

Gets filling recipes where this ingredient is listed as an alternate.

#### Returns

[`IFillingRecipe`](IFillingRecipe.md)[]

#### Inherited from

[`IIngredient`](IIngredient.md).[`alternateInFillings`](IIngredient.md#alternateinfillings)

***

### isAlcohol()

> **isAlcohol**(): `this is IAlcoholIngredient`

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:208](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L208)

Returns true if this is an alcohol ingredient.
When true, alcohol-specific properties are available.

#### Returns

`this is IAlcoholIngredient`

#### Inherited from

[`IIngredient`](IIngredient.md).[`isAlcohol`](IIngredient.md#isalcohol)

***

### isChocolate()

> **isChocolate**(): `this is IChocolateIngredient`

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:184](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L184)

Returns true if this is a chocolate ingredient.
When true, chocolate-specific properties are available.

#### Returns

`this is IChocolateIngredient`

#### Inherited from

[`IIngredient`](IIngredient.md).[`isChocolate`](IIngredient.md#ischocolate)

***

### isDairy()

> **isDairy**(): `this is IDairyIngredient`

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:190](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L190)

Returns true if this is a dairy ingredient.
When true, dairy-specific properties are available.

#### Returns

`this is IDairyIngredient`

#### Inherited from

[`IIngredient`](IIngredient.md).[`isDairy`](IIngredient.md#isdairy)

***

### isFat()

> **isFat**(): `this is IFatIngredient`

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:202](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L202)

Returns true if this is a fat ingredient.
When true, fat-specific properties are available.

#### Returns

`this is IFatIngredient`

#### Inherited from

[`IIngredient`](IIngredient.md).[`isFat`](IIngredient.md#isfat)

***

### isSugar()

> **isSugar**(): `this is ISugarIngredient`

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:196](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L196)

Returns true if this is a sugar ingredient.
When true, sugar-specific properties are available.

#### Returns

`this is ISugarIngredient`

#### Inherited from

[`IIngredient`](IIngredient.md).[`isSugar`](IIngredient.md#issugar)

***

### primaryInFillings()

> **primaryInFillings**(): [`IFillingRecipe`](IFillingRecipe.md)[]

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:171](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L171)

Gets filling recipes where this ingredient is the primary choice.

#### Returns

[`IFillingRecipe`](IFillingRecipe.md)[]

#### Inherited from

[`IIngredient`](IIngredient.md).[`primaryInFillings`](IIngredient.md#primaryinfillings)

***

### usedByFillings()

> **usedByFillings**(): [`IFillingRecipe`](IFillingRecipe.md)[]

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:166](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L166)

Gets all filling recipes that use this ingredient (primary or alternate).

#### Returns

[`IFillingRecipe`](IFillingRecipe.md)[]

#### Inherited from

[`IIngredient`](IIngredient.md).[`usedByFillings`](IIngredient.md#usedbyfillings)
