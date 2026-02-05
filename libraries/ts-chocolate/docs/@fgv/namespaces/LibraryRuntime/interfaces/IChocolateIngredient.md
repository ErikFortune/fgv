[**@fgv/ts-chocolate**](../../../../README.md)

***

[@fgv/ts-chocolate](../../../../README.md) / [LibraryRuntime](../README.md) / IChocolateIngredient

# Interface: IChocolateIngredient

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:220](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L220)

Runtime ingredient narrowed to chocolate type.

## Extends

- [`IIngredient`](IIngredient.md)

## Properties

### allergens?

> `readonly` `optional` **allergens**: readonly [`Allergen`](../../../../type-aliases/Allergen.md)[]

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:147](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L147)

Optional list of common allergens present in the ingredient

#### Inherited from

[`IIngredient`](IIngredient.md).[`allergens`](IIngredient.md#allergens)

***

### applications?

> `readonly` `optional` **applications**: readonly [`ChocolateApplication`](../../../../type-aliases/ChocolateApplication.md)[]

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:243](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L243)

Recommended applications for this chocolate (optional)

***

### baseId

> `readonly` **baseId**: [`BaseIngredientId`](../../../../type-aliases/BaseIngredientId.md)

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:127](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L127)

The base ingredient ID within the source.

#### Inherited from

[`IIngredient`](IIngredient.md).[`baseId`](IIngredient.md#baseid)

***

### beanVarieties?

> `readonly` `optional` **beanVarieties**: readonly [`CacaoVariety`](../../../../type-aliases/CacaoVariety.md)[]

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:240](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L240)

Bean varieties used in the chocolate (optional)

***

### cacaoPercentage

> `readonly` **cacaoPercentage**: [`Percentage`](../../../../type-aliases/Percentage.md)

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:228](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L228)

Cacao percentage (e.g., 70 for 70% dark)

***

### category

> `readonly` **category**: `"chocolate"`

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:222](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L222)

Category is always chocolate for this type

#### Overrides

[`IIngredient`](IIngredient.md).[`category`](IIngredient.md#category)

***

### certifications?

> `readonly` `optional` **certifications**: readonly [`Certification`](../../../../type-aliases/Certification.md)[]

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:153](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L153)

Optional list of certifications the ingredient has

#### Inherited from

[`IIngredient`](IIngredient.md).[`certifications`](IIngredient.md#certifications)

***

### chocolateType

> `readonly` **chocolateType**: [`ChocolateType`](../../../../type-aliases/ChocolateType.md)

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:225](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L225)

Type of chocolate

***

### collectionId

> `readonly` **collectionId**: [`CollectionId`](../../../../type-aliases/CollectionId.md)

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:122](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L122)

The collection ID part of the composite ID.

#### Inherited from

[`IIngredient`](IIngredient.md).[`collectionId`](IIngredient.md#collectionid)

***

### description?

> `readonly` `optional` **description**: `string`

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:141](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L141)

Optional description

#### Inherited from

[`IIngredient`](IIngredient.md).[`description`](IIngredient.md#description)

***

### entity

> `readonly` **entity**: [`IChocolateIngredientEntity`](../../Entities/interfaces/IChocolateIngredientEntity.md)

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:251](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L251)

Gets the underlying ingredient entity data.

#### Overrides

[`IIngredient`](IIngredient.md).[`entity`](IIngredient.md#entity)

***

### fluidityStars?

> `readonly` `optional` **fluidityStars**: [`FluidityStars`](../../../../type-aliases/FluidityStars.md)

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:231](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L231)

Fluidity in Callebaut star ratings (optional)

***

### ganacheCharacteristics

> `readonly` **ganacheCharacteristics**: [`IGanacheCharacteristics`](../../Entities/interfaces/IGanacheCharacteristics.md)

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:138](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L138)

Ganache-relevant characteristics

#### Inherited from

[`IIngredient`](IIngredient.md).[`ganacheCharacteristics`](IIngredient.md#ganachecharacteristics)

***

### id

> `readonly` **id**: [`IngredientId`](../../../../type-aliases/IngredientId.md)

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:117](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L117)

The composite ingredient ID (e.g., "felchlin.maracaibo-65").
Combines source and base ID for unique identification across sources.

#### Inherited from

[`IIngredient`](IIngredient.md).[`id`](IIngredient.md#id)

***

### manufacturer?

> `readonly` `optional` **manufacturer**: `string`

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:144](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L144)

Optional manufacturer

#### Inherited from

[`IIngredient`](IIngredient.md).[`manufacturer`](IIngredient.md#manufacturer)

***

### name

> `readonly` **name**: `string`

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:132](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L132)

Display name

#### Inherited from

[`IIngredient`](IIngredient.md).[`name`](IIngredient.md#name)

***

### origins?

> `readonly` `optional` **origins**: readonly `string`[]

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:246](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L246)

Origin of the chocolate (optional)

***

### tags?

> `readonly` `optional` **tags**: readonly `string`[]

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:159](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L159)

Optional tags for searching/filtering

#### Inherited from

[`IIngredient`](IIngredient.md).[`tags`](IIngredient.md#tags)

***

### temperatureCurve?

> `readonly` `optional` **temperatureCurve**: [`ITemperatureCurve`](../../Entities/namespaces/Ingredients/interfaces/ITemperatureCurve.md)

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:237](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L237)

Tempering curve (optional)

***

### traceAllergens?

> `readonly` `optional` **traceAllergens**: readonly [`Allergen`](../../../../type-aliases/Allergen.md)[]

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:150](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L150)

Optional list of trace allergens possibly present (e.g. due to contamination)

#### Inherited from

[`IIngredient`](IIngredient.md).[`traceAllergens`](IIngredient.md#traceallergens)

***

### vegan?

> `readonly` `optional` **vegan**: `boolean`

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:156](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L156)

Optional indicator if the ingredient is vegan

#### Inherited from

[`IIngredient`](IIngredient.md).[`vegan`](IIngredient.md#vegan)

***

### viscosityMcM?

> `readonly` `optional` **viscosityMcM**: [`DegreesMacMichael`](../../../../type-aliases/DegreesMacMichael.md)

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:234](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L234)

Viscosity in MacMichael degrees (optional)

## Methods

### alternateInFillings()

> **alternateInFillings**(): [`IFillingRecipe`](IFillingRecipe.md)[]

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:176](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L176)

Gets filling recipes where this ingredient is listed as an alternate.

#### Returns

[`IFillingRecipe`](IFillingRecipe.md)[]

#### Inherited from

[`IIngredient`](IIngredient.md).[`alternateInFillings`](IIngredient.md#alternateinfillings)

***

### isAlcohol()

> **isAlcohol**(): `this is IAlcoholIngredient`

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:208](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L208)

Returns true if this is an alcohol ingredient.
When true, alcohol-specific properties are available.

#### Returns

`this is IAlcoholIngredient`

#### Inherited from

[`IIngredient`](IIngredient.md).[`isAlcohol`](IIngredient.md#isalcohol)

***

### isChocolate()

> **isChocolate**(): `this is IChocolateIngredient`

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:184](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L184)

Returns true if this is a chocolate ingredient.
When true, chocolate-specific properties are available.

#### Returns

`this is IChocolateIngredient`

#### Inherited from

[`IIngredient`](IIngredient.md).[`isChocolate`](IIngredient.md#ischocolate)

***

### isDairy()

> **isDairy**(): `this is IDairyIngredient`

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:190](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L190)

Returns true if this is a dairy ingredient.
When true, dairy-specific properties are available.

#### Returns

`this is IDairyIngredient`

#### Inherited from

[`IIngredient`](IIngredient.md).[`isDairy`](IIngredient.md#isdairy)

***

### isFat()

> **isFat**(): `this is IFatIngredient`

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:202](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L202)

Returns true if this is a fat ingredient.
When true, fat-specific properties are available.

#### Returns

`this is IFatIngredient`

#### Inherited from

[`IIngredient`](IIngredient.md).[`isFat`](IIngredient.md#isfat)

***

### isSugar()

> **isSugar**(): `this is ISugarIngredient`

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:196](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L196)

Returns true if this is a sugar ingredient.
When true, sugar-specific properties are available.

#### Returns

`this is ISugarIngredient`

#### Inherited from

[`IIngredient`](IIngredient.md).[`isSugar`](IIngredient.md#issugar)

***

### primaryInFillings()

> **primaryInFillings**(): [`IFillingRecipe`](IFillingRecipe.md)[]

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:171](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L171)

Gets filling recipes where this ingredient is the primary choice.

#### Returns

[`IFillingRecipe`](IFillingRecipe.md)[]

#### Inherited from

[`IIngredient`](IIngredient.md).[`primaryInFillings`](IIngredient.md#primaryinfillings)

***

### usedByFillings()

> **usedByFillings**(): [`IFillingRecipe`](IFillingRecipe.md)[]

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:166](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L166)

Gets all filling recipes that use this ingredient (primary or alternate).

#### Returns

[`IFillingRecipe`](IFillingRecipe.md)[]

#### Inherited from

[`IIngredient`](IIngredient.md).[`usedByFillings`](IIngredient.md#usedbyfillings)
