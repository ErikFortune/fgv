[**@fgv/ts-chocolate**](../../../../README.md)

***

[@fgv/ts-chocolate](../../../../README.md) / [LibraryRuntime](../README.md) / ISugarIngredient

# Interface: ISugarIngredient

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:273](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L273)

Runtime ingredient narrowed to sugar type.

## Extends

- [`IIngredient`](IIngredient.md)\<[`ISugarIngredientEntity`](../../Entities/interfaces/ISugarIngredientEntity.md)\>

## Properties

### allergens?

> `readonly` `optional` **allergens**: readonly [`Allergen`](../../../../type-aliases/Allergen.md)[]

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:142](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L142)

Optional list of common allergens present in the ingredient

#### Inherited from

[`IIngredient`](IIngredient.md).[`allergens`](IIngredient.md#allergens)

***

### baseId

> `readonly` **baseId**: [`BaseIngredientId`](../../../../type-aliases/BaseIngredientId.md)

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:122](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L122)

The base ingredient ID within the source.

#### Inherited from

[`IIngredient`](IIngredient.md).[`baseId`](IIngredient.md#baseid)

***

### category

> `readonly` **category**: `"sugar"`

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:275](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L275)

Category is always sugar for this type

#### Overrides

[`IIngredient`](IIngredient.md).[`category`](IIngredient.md#category)

***

### certifications?

> `readonly` `optional` **certifications**: readonly [`Certification`](../../../../type-aliases/Certification.md)[]

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:148](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L148)

Optional list of certifications the ingredient has

#### Inherited from

[`IIngredient`](IIngredient.md).[`certifications`](IIngredient.md#certifications)

***

### collectionId

> `readonly` **collectionId**: [`CollectionId`](../../../../type-aliases/CollectionId.md)

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:117](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L117)

The collection ID part of the composite ID.

#### Inherited from

[`IIngredient`](IIngredient.md).[`collectionId`](IIngredient.md#collectionid)

***

### description?

> `readonly` `optional` **description**: `string`

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:136](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L136)

Optional description

#### Inherited from

[`IIngredient`](IIngredient.md).[`description`](IIngredient.md#description)

***

### entity

> `readonly` **entity**: [`ISugarIngredientEntity`](../../Entities/interfaces/ISugarIngredientEntity.md)

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:286](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L286)

Gets the underlying ingredient entity data.

#### Overrides

[`IIngredient`](IIngredient.md).[`entity`](IIngredient.md#entity)

***

### ganacheCharacteristics

> `readonly` **ganacheCharacteristics**: [`IGanacheCharacteristics`](../../Entities/interfaces/IGanacheCharacteristics.md)

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:133](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L133)

Ganache-relevant characteristics

#### Inherited from

[`IIngredient`](IIngredient.md).[`ganacheCharacteristics`](IIngredient.md#ganachecharacteristics)

***

### hydrationNumber?

> `readonly` `optional` **hydrationNumber**: `number`

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:278](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L278)

Hydration number (water molecules per sugar molecule)

***

### id

> `readonly` **id**: [`IngredientId`](../../../../type-aliases/IngredientId.md)

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:112](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L112)

The composite ingredient ID (e.g., "felchlin.maracaibo-65").
Combines source and base ID for unique identification across sources.

#### Inherited from

[`IIngredient`](IIngredient.md).[`id`](IIngredient.md#id)

***

### manufacturer?

> `readonly` `optional` **manufacturer**: `string`

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:139](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L139)

Optional manufacturer

#### Inherited from

[`IIngredient`](IIngredient.md).[`manufacturer`](IIngredient.md#manufacturer)

***

### name

> `readonly` **name**: `string`

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:127](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L127)

Display name

#### Inherited from

[`IIngredient`](IIngredient.md).[`name`](IIngredient.md#name)

***

### sweetnessPotency?

> `readonly` `optional` **sweetnessPotency**: `number`

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:281](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L281)

Sweetness potency relative to sucrose (1.0 = sucrose)

***

### tags?

> `readonly` `optional` **tags**: readonly `string`[]

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:154](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L154)

Optional tags for searching/filtering

#### Inherited from

[`IIngredient`](IIngredient.md).[`tags`](IIngredient.md#tags)

***

### traceAllergens?

> `readonly` `optional` **traceAllergens**: readonly [`Allergen`](../../../../type-aliases/Allergen.md)[]

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:145](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L145)

Optional list of trace allergens possibly present (e.g. due to contamination)

#### Inherited from

[`IIngredient`](IIngredient.md).[`traceAllergens`](IIngredient.md#traceallergens)

***

### vegan?

> `readonly` `optional` **vegan**: `boolean`

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:151](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L151)

Optional indicator if the ingredient is vegan

#### Inherited from

[`IIngredient`](IIngredient.md).[`vegan`](IIngredient.md#vegan)

## Methods

### alternateInFillings()

> **alternateInFillings**(): [`IFillingRecipe`](IFillingRecipe.md)[]

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:171](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L171)

Gets filling recipes where this ingredient is listed as an alternate.

#### Returns

[`IFillingRecipe`](IFillingRecipe.md)[]

#### Inherited from

[`IIngredient`](IIngredient.md).[`alternateInFillings`](IIngredient.md#alternateinfillings)

***

### isAlcohol()

> **isAlcohol**(): `this is IAlcoholIngredient`

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:203](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L203)

Returns true if this is an alcohol ingredient.
When true, alcohol-specific properties are available.

#### Returns

`this is IAlcoholIngredient`

#### Inherited from

[`IIngredient`](IIngredient.md).[`isAlcohol`](IIngredient.md#isalcohol)

***

### isChocolate()

> **isChocolate**(): `this is IChocolateIngredient`

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:179](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L179)

Returns true if this is a chocolate ingredient.
When true, chocolate-specific properties are available.

#### Returns

`this is IChocolateIngredient`

#### Inherited from

[`IIngredient`](IIngredient.md).[`isChocolate`](IIngredient.md#ischocolate)

***

### isDairy()

> **isDairy**(): `this is IDairyIngredient`

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:185](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L185)

Returns true if this is a dairy ingredient.
When true, dairy-specific properties are available.

#### Returns

`this is IDairyIngredient`

#### Inherited from

[`IIngredient`](IIngredient.md).[`isDairy`](IIngredient.md#isdairy)

***

### isFat()

> **isFat**(): `this is IFatIngredient`

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:197](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L197)

Returns true if this is a fat ingredient.
When true, fat-specific properties are available.

#### Returns

`this is IFatIngredient`

#### Inherited from

[`IIngredient`](IIngredient.md).[`isFat`](IIngredient.md#isfat)

***

### isSugar()

> **isSugar**(): `this is ISugarIngredient`

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:191](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L191)

Returns true if this is a sugar ingredient.
When true, sugar-specific properties are available.

#### Returns

`this is ISugarIngredient`

#### Inherited from

[`IIngredient`](IIngredient.md).[`isSugar`](IIngredient.md#issugar)

***

### primaryInFillings()

> **primaryInFillings**(): [`IFillingRecipe`](IFillingRecipe.md)[]

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:166](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L166)

Gets filling recipes where this ingredient is the primary choice.

#### Returns

[`IFillingRecipe`](IFillingRecipe.md)[]

#### Inherited from

[`IIngredient`](IIngredient.md).[`primaryInFillings`](IIngredient.md#primaryinfillings)

***

### usedByFillings()

> **usedByFillings**(): [`IFillingRecipe`](IFillingRecipe.md)[]

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:161](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L161)

Gets all filling recipes that use this ingredient (primary or alternate).

#### Returns

[`IFillingRecipe`](IFillingRecipe.md)[]

#### Inherited from

[`IIngredient`](IIngredient.md).[`usedByFillings`](IIngredient.md#usedbyfillings)
