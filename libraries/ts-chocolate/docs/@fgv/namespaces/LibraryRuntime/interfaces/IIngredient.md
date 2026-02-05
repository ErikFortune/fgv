[**@fgv/ts-chocolate**](../../../../README.md)

***

[@fgv/ts-chocolate](../../../../README.md) / [LibraryRuntime](../README.md) / IIngredient

# Interface: IIngredient\<TEntity\>

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:105](https://github.com/ErikFortune/fgv/blob/d51b0929f72c9206f7fc8c54016db3ae08502b0f/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L105)

Base interface for all runtime ingredients.
Provides common properties and navigation shared by all ingredient types.

Note: Does not extend `IIngredientEntity` directly because the class implementation
provides the same shape but with additional runtime behavior.

## Extended by

- [`IChocolateIngredient`](IChocolateIngredient.md)
- [`IDairyIngredient`](IDairyIngredient.md)
- [`ISugarIngredient`](ISugarIngredient.md)
- [`IFatIngredient`](IFatIngredient.md)
- [`IAlcoholIngredient`](IAlcoholIngredient.md)

## Type Parameters

### TEntity

`TEntity` *extends* [`IngredientEntity`](../../Entities/type-aliases/IngredientEntity.md) = [`IngredientEntity`](../../Entities/type-aliases/IngredientEntity.md)

The specific entity type for this ingredient

## Properties

### allergens?

> `readonly` `optional` **allergens**: readonly [`Allergen`](../../../../type-aliases/Allergen.md)[]

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:142](https://github.com/ErikFortune/fgv/blob/d51b0929f72c9206f7fc8c54016db3ae08502b0f/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L142)

Optional list of common allergens present in the ingredient

***

### baseId

> `readonly` **baseId**: [`BaseIngredientId`](../../../../type-aliases/BaseIngredientId.md)

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:122](https://github.com/ErikFortune/fgv/blob/d51b0929f72c9206f7fc8c54016db3ae08502b0f/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L122)

The base ingredient ID within the source.

***

### category

> `readonly` **category**: [`IngredientCategory`](../../../../type-aliases/IngredientCategory.md)

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:130](https://github.com/ErikFortune/fgv/blob/d51b0929f72c9206f7fc8c54016db3ae08502b0f/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L130)

Ingredient category (discriminator)

***

### certifications?

> `readonly` `optional` **certifications**: readonly [`Certification`](../../../../type-aliases/Certification.md)[]

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:148](https://github.com/ErikFortune/fgv/blob/d51b0929f72c9206f7fc8c54016db3ae08502b0f/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L148)

Optional list of certifications the ingredient has

***

### collectionId

> `readonly` **collectionId**: [`CollectionId`](../../../../type-aliases/CollectionId.md)

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:117](https://github.com/ErikFortune/fgv/blob/d51b0929f72c9206f7fc8c54016db3ae08502b0f/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L117)

The collection ID part of the composite ID.

***

### description?

> `readonly` `optional` **description**: `string`

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:136](https://github.com/ErikFortune/fgv/blob/d51b0929f72c9206f7fc8c54016db3ae08502b0f/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L136)

Optional description

***

### entity

> `readonly` **entity**: `TEntity`

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:208](https://github.com/ErikFortune/fgv/blob/d51b0929f72c9206f7fc8c54016db3ae08502b0f/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L208)

Gets the underlying ingredient entity data.

***

### ganacheCharacteristics

> `readonly` **ganacheCharacteristics**: [`IGanacheCharacteristics`](../../Entities/interfaces/IGanacheCharacteristics.md)

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:133](https://github.com/ErikFortune/fgv/blob/d51b0929f72c9206f7fc8c54016db3ae08502b0f/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L133)

Ganache-relevant characteristics

***

### id

> `readonly` **id**: [`IngredientId`](../../../../type-aliases/IngredientId.md)

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:112](https://github.com/ErikFortune/fgv/blob/d51b0929f72c9206f7fc8c54016db3ae08502b0f/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L112)

The composite ingredient ID (e.g., "felchlin.maracaibo-65").
Combines source and base ID for unique identification across sources.

***

### manufacturer?

> `readonly` `optional` **manufacturer**: `string`

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:139](https://github.com/ErikFortune/fgv/blob/d51b0929f72c9206f7fc8c54016db3ae08502b0f/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L139)

Optional manufacturer

***

### name

> `readonly` **name**: `string`

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:127](https://github.com/ErikFortune/fgv/blob/d51b0929f72c9206f7fc8c54016db3ae08502b0f/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L127)

Display name

***

### tags?

> `readonly` `optional` **tags**: readonly `string`[]

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:154](https://github.com/ErikFortune/fgv/blob/d51b0929f72c9206f7fc8c54016db3ae08502b0f/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L154)

Optional tags for searching/filtering

***

### traceAllergens?

> `readonly` `optional` **traceAllergens**: readonly [`Allergen`](../../../../type-aliases/Allergen.md)[]

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:145](https://github.com/ErikFortune/fgv/blob/d51b0929f72c9206f7fc8c54016db3ae08502b0f/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L145)

Optional list of trace allergens possibly present (e.g. due to contamination)

***

### vegan?

> `readonly` `optional` **vegan**: `boolean`

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:151](https://github.com/ErikFortune/fgv/blob/d51b0929f72c9206f7fc8c54016db3ae08502b0f/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L151)

Optional indicator if the ingredient is vegan

## Methods

### alternateInFillings()

> **alternateInFillings**(): [`IFillingRecipe`](IFillingRecipe.md)[]

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:171](https://github.com/ErikFortune/fgv/blob/d51b0929f72c9206f7fc8c54016db3ae08502b0f/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L171)

Gets filling recipes where this ingredient is listed as an alternate.

#### Returns

[`IFillingRecipe`](IFillingRecipe.md)[]

***

### isAlcohol()

> **isAlcohol**(): `this is IAlcoholIngredient`

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:203](https://github.com/ErikFortune/fgv/blob/d51b0929f72c9206f7fc8c54016db3ae08502b0f/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L203)

Returns true if this is an alcohol ingredient.
When true, alcohol-specific properties are available.

#### Returns

`this is IAlcoholIngredient`

***

### isChocolate()

> **isChocolate**(): `this is IChocolateIngredient`

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:179](https://github.com/ErikFortune/fgv/blob/d51b0929f72c9206f7fc8c54016db3ae08502b0f/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L179)

Returns true if this is a chocolate ingredient.
When true, chocolate-specific properties are available.

#### Returns

`this is IChocolateIngredient`

***

### isDairy()

> **isDairy**(): `this is IDairyIngredient`

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:185](https://github.com/ErikFortune/fgv/blob/d51b0929f72c9206f7fc8c54016db3ae08502b0f/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L185)

Returns true if this is a dairy ingredient.
When true, dairy-specific properties are available.

#### Returns

`this is IDairyIngredient`

***

### isFat()

> **isFat**(): `this is IFatIngredient`

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:197](https://github.com/ErikFortune/fgv/blob/d51b0929f72c9206f7fc8c54016db3ae08502b0f/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L197)

Returns true if this is a fat ingredient.
When true, fat-specific properties are available.

#### Returns

`this is IFatIngredient`

***

### isSugar()

> **isSugar**(): `this is ISugarIngredient`

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:191](https://github.com/ErikFortune/fgv/blob/d51b0929f72c9206f7fc8c54016db3ae08502b0f/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L191)

Returns true if this is a sugar ingredient.
When true, sugar-specific properties are available.

#### Returns

`this is ISugarIngredient`

***

### primaryInFillings()

> **primaryInFillings**(): [`IFillingRecipe`](IFillingRecipe.md)[]

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:166](https://github.com/ErikFortune/fgv/blob/d51b0929f72c9206f7fc8c54016db3ae08502b0f/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L166)

Gets filling recipes where this ingredient is the primary choice.

#### Returns

[`IFillingRecipe`](IFillingRecipe.md)[]

***

### usedByFillings()

> **usedByFillings**(): [`IFillingRecipe`](IFillingRecipe.md)[]

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:161](https://github.com/ErikFortune/fgv/blob/d51b0929f72c9206f7fc8c54016db3ae08502b0f/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L161)

Gets all filling recipes that use this ingredient (primary or alternate).

#### Returns

[`IFillingRecipe`](IFillingRecipe.md)[]
