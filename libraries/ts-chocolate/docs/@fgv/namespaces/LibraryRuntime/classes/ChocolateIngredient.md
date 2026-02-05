[**@fgv/ts-chocolate**](../../../../README.md)

***

[@fgv/ts-chocolate](../../../../README.md) / [LibraryRuntime](../README.md) / ChocolateIngredient

# Class: ChocolateIngredient

Defined in: [ts-chocolate/src/packlets/library-runtime/ingredients/chocolateIngredient.ts:50](https://github.com/ErikFortune/fgv/blob/4be6f2d0ab84c3f4b78ffd3f9b262279d2ab7172/libraries/ts-chocolate/src/packlets/library-runtime/ingredients/chocolateIngredient.ts#L50)

A resolved view of a chocolate ingredient with navigation capabilities.
Immutable - does not allow modification of underlying data.

## Extends

- [`IngredientBase`](IngredientBase.md)\<[`IChocolateIngredientEntity`](../../Entities/interfaces/IChocolateIngredientEntity.md)\>

## Implements

- [`IChocolateIngredient`](../interfaces/IChocolateIngredient.md)

## Properties

### \_baseId

> `protected` `readonly` **\_baseId**: [`BaseIngredientId`](../../../../type-aliases/BaseIngredientId.md)

Defined in: [ts-chocolate/src/packlets/library-runtime/ingredients/ingredientBase.ts:62](https://github.com/ErikFortune/fgv/blob/4be6f2d0ab84c3f4b78ffd3f9b262279d2ab7172/libraries/ts-chocolate/src/packlets/library-runtime/ingredients/ingredientBase.ts#L62)

#### Inherited from

[`IngredientBase`](IngredientBase.md).[`_baseId`](IngredientBase.md#_baseid)

***

### \_context

> `protected` `readonly` **\_context**: [`IIngredientContext`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-chocolate/docs)

Defined in: [ts-chocolate/src/packlets/library-runtime/ingredients/ingredientBase.ts:58](https://github.com/ErikFortune/fgv/blob/4be6f2d0ab84c3f4b78ffd3f9b262279d2ab7172/libraries/ts-chocolate/src/packlets/library-runtime/ingredients/ingredientBase.ts#L58)

#### Inherited from

[`IngredientBase`](IngredientBase.md).[`_context`](IngredientBase.md#_context)

***

### \_id

> `protected` `readonly` **\_id**: [`IngredientId`](../../../../type-aliases/IngredientId.md)

Defined in: [ts-chocolate/src/packlets/library-runtime/ingredients/ingredientBase.ts:59](https://github.com/ErikFortune/fgv/blob/4be6f2d0ab84c3f4b78ffd3f9b262279d2ab7172/libraries/ts-chocolate/src/packlets/library-runtime/ingredients/ingredientBase.ts#L59)

#### Inherited from

[`IngredientBase`](IngredientBase.md).[`_id`](IngredientBase.md#_id)

***

### \_ingredient

> `protected` `readonly` **\_ingredient**: [`IChocolateIngredientEntity`](../../Entities/interfaces/IChocolateIngredientEntity.md)

Defined in: [ts-chocolate/src/packlets/library-runtime/ingredients/ingredientBase.ts:60](https://github.com/ErikFortune/fgv/blob/4be6f2d0ab84c3f4b78ffd3f9b262279d2ab7172/libraries/ts-chocolate/src/packlets/library-runtime/ingredients/ingredientBase.ts#L60)

#### Inherited from

[`IngredientBase`](IngredientBase.md).[`_ingredient`](IngredientBase.md#_ingredient)

***

### \_sourceId

> `protected` `readonly` **\_sourceId**: [`CollectionId`](../../../../type-aliases/CollectionId.md)

Defined in: [ts-chocolate/src/packlets/library-runtime/ingredients/ingredientBase.ts:61](https://github.com/ErikFortune/fgv/blob/4be6f2d0ab84c3f4b78ffd3f9b262279d2ab7172/libraries/ts-chocolate/src/packlets/library-runtime/ingredients/ingredientBase.ts#L61)

#### Inherited from

[`IngredientBase`](IngredientBase.md).[`_sourceId`](IngredientBase.md#_sourceid)

## Accessors

### allergens

#### Get Signature

> **get** **allergens**(): readonly [`Allergen`](../../../../type-aliases/Allergen.md)[]

Defined in: [ts-chocolate/src/packlets/library-runtime/ingredients/ingredientBase.ts:153](https://github.com/ErikFortune/fgv/blob/4be6f2d0ab84c3f4b78ffd3f9b262279d2ab7172/libraries/ts-chocolate/src/packlets/library-runtime/ingredients/ingredientBase.ts#L153)

Common allergens present

##### Returns

readonly [`Allergen`](../../../../type-aliases/Allergen.md)[]

Optional list of common allergens present in the ingredient

#### Implementation of

[`IChocolateIngredient`](../interfaces/IChocolateIngredient.md).[`allergens`](../interfaces/IChocolateIngredient.md#allergens)

#### Inherited from

[`IngredientBase`](IngredientBase.md).[`allergens`](IngredientBase.md#allergens)

***

### applications

#### Get Signature

> **get** **applications**(): readonly [`ChocolateApplication`](../../../../type-aliases/ChocolateApplication.md)[] \| `undefined`

Defined in: [ts-chocolate/src/packlets/library-runtime/ingredients/chocolateIngredient.ts:158](https://github.com/ErikFortune/fgv/blob/4be6f2d0ab84c3f4b78ffd3f9b262279d2ab7172/libraries/ts-chocolate/src/packlets/library-runtime/ingredients/chocolateIngredient.ts#L158)

Recommended applications for this chocolate (optional)

##### Returns

readonly [`ChocolateApplication`](../../../../type-aliases/ChocolateApplication.md)[] \| `undefined`

Recommended applications for this chocolate (optional)

#### Implementation of

[`IChocolateIngredient`](../interfaces/IChocolateIngredient.md).[`applications`](../interfaces/IChocolateIngredient.md#applications)

***

### baseId

#### Get Signature

> **get** **baseId**(): [`BaseIngredientId`](../../../../type-aliases/BaseIngredientId.md)

Defined in: [ts-chocolate/src/packlets/library-runtime/ingredients/ingredientBase.ts:102](https://github.com/ErikFortune/fgv/blob/4be6f2d0ab84c3f4b78ffd3f9b262279d2ab7172/libraries/ts-chocolate/src/packlets/library-runtime/ingredients/ingredientBase.ts#L102)

The base ingredient ID within the source

##### Returns

[`BaseIngredientId`](../../../../type-aliases/BaseIngredientId.md)

The base ingredient ID within the source.

#### Implementation of

[`IChocolateIngredient`](../interfaces/IChocolateIngredient.md).[`baseId`](../interfaces/IChocolateIngredient.md#baseid)

#### Inherited from

[`IngredientBase`](IngredientBase.md).[`baseId`](IngredientBase.md#baseid)

***

### beanVarieties

#### Get Signature

> **get** **beanVarieties**(): readonly [`CacaoVariety`](../../../../type-aliases/CacaoVariety.md)[] \| `undefined`

Defined in: [ts-chocolate/src/packlets/library-runtime/ingredients/chocolateIngredient.ts:143](https://github.com/ErikFortune/fgv/blob/4be6f2d0ab84c3f4b78ffd3f9b262279d2ab7172/libraries/ts-chocolate/src/packlets/library-runtime/ingredients/chocolateIngredient.ts#L143)

Bean varieties used in the chocolate (optional)

##### Returns

readonly [`CacaoVariety`](../../../../type-aliases/CacaoVariety.md)[] \| `undefined`

Bean varieties used in the chocolate (optional)

#### Implementation of

[`IChocolateIngredient`](../interfaces/IChocolateIngredient.md).[`beanVarieties`](../interfaces/IChocolateIngredient.md#beanvarieties)

***

### cacaoPercentage

#### Get Signature

> **get** **cacaoPercentage**(): [`Percentage`](../../../../type-aliases/Percentage.md)

Defined in: [ts-chocolate/src/packlets/library-runtime/ingredients/chocolateIngredient.ts:107](https://github.com/ErikFortune/fgv/blob/4be6f2d0ab84c3f4b78ffd3f9b262279d2ab7172/libraries/ts-chocolate/src/packlets/library-runtime/ingredients/chocolateIngredient.ts#L107)

Cacao percentage (e.g., 70 for 70% dark)

##### Returns

[`Percentage`](../../../../type-aliases/Percentage.md)

Cacao percentage (e.g., 70 for 70% dark)

#### Implementation of

[`IChocolateIngredient`](../interfaces/IChocolateIngredient.md).[`cacaoPercentage`](../interfaces/IChocolateIngredient.md#cacaopercentage)

***

### cacaoVariety

#### Get Signature

> **get** **cacaoVariety**(): [`CacaoVariety`](../../../../type-aliases/CacaoVariety.md) \| `undefined`

Defined in: [ts-chocolate/src/packlets/library-runtime/ingredients/chocolateIngredient.ts:151](https://github.com/ErikFortune/fgv/blob/4be6f2d0ab84c3f4b78ffd3f9b262279d2ab7172/libraries/ts-chocolate/src/packlets/library-runtime/ingredients/chocolateIngredient.ts#L151)

Cacao variety (optional)

##### Deprecated

Use beanVarieties instead

##### Returns

[`CacaoVariety`](../../../../type-aliases/CacaoVariety.md) \| `undefined`

***

### category

#### Get Signature

> **get** **category**(): `"chocolate"`

Defined in: [ts-chocolate/src/packlets/library-runtime/ingredients/chocolateIngredient.ts:89](https://github.com/ErikFortune/fgv/blob/4be6f2d0ab84c3f4b78ffd3f9b262279d2ab7172/libraries/ts-chocolate/src/packlets/library-runtime/ingredients/chocolateIngredient.ts#L89)

Category is always 'chocolate' for this type

##### Returns

`"chocolate"`

Category is always chocolate for this type

#### Implementation of

[`IChocolateIngredient`](../interfaces/IChocolateIngredient.md).[`category`](../interfaces/IChocolateIngredient.md#category)

#### Overrides

[`IngredientBase`](IngredientBase.md).[`category`](IngredientBase.md#category)

***

### certifications

#### Get Signature

> **get** **certifications**(): readonly [`Certification`](../../../../type-aliases/Certification.md)[]

Defined in: [ts-chocolate/src/packlets/library-runtime/ingredients/ingredientBase.ts:168](https://github.com/ErikFortune/fgv/blob/4be6f2d0ab84c3f4b78ffd3f9b262279d2ab7172/libraries/ts-chocolate/src/packlets/library-runtime/ingredients/ingredientBase.ts#L168)

Certifications the ingredient has

##### Returns

readonly [`Certification`](../../../../type-aliases/Certification.md)[]

Optional list of certifications the ingredient has

#### Implementation of

[`IChocolateIngredient`](../interfaces/IChocolateIngredient.md).[`certifications`](../interfaces/IChocolateIngredient.md#certifications)

#### Inherited from

[`IngredientBase`](IngredientBase.md).[`certifications`](IngredientBase.md#certifications)

***

### chocolateType

#### Get Signature

> **get** **chocolateType**(): [`ChocolateType`](../../../../type-aliases/ChocolateType.md)

Defined in: [ts-chocolate/src/packlets/library-runtime/ingredients/chocolateIngredient.ts:100](https://github.com/ErikFortune/fgv/blob/4be6f2d0ab84c3f4b78ffd3f9b262279d2ab7172/libraries/ts-chocolate/src/packlets/library-runtime/ingredients/chocolateIngredient.ts#L100)

Type of chocolate (dark, milk, white, etc.)

##### Returns

[`ChocolateType`](../../../../type-aliases/ChocolateType.md)

Type of chocolate

#### Implementation of

[`IChocolateIngredient`](../interfaces/IChocolateIngredient.md).[`chocolateType`](../interfaces/IChocolateIngredient.md#chocolatetype)

***

### collectionId

#### Get Signature

> **get** **collectionId**(): [`CollectionId`](../../../../type-aliases/CollectionId.md)

Defined in: [ts-chocolate/src/packlets/library-runtime/ingredients/ingredientBase.ts:95](https://github.com/ErikFortune/fgv/blob/4be6f2d0ab84c3f4b78ffd3f9b262279d2ab7172/libraries/ts-chocolate/src/packlets/library-runtime/ingredients/ingredientBase.ts#L95)

The source ID part of the composite ID

##### Returns

[`CollectionId`](../../../../type-aliases/CollectionId.md)

The collection ID part of the composite ID.

#### Implementation of

[`IChocolateIngredient`](../interfaces/IChocolateIngredient.md).[`collectionId`](../interfaces/IChocolateIngredient.md#collectionid)

#### Inherited from

[`IngredientBase`](IngredientBase.md).[`collectionId`](IngredientBase.md#collectionid)

***

### description

#### Get Signature

> **get** **description**(): `string` \| `undefined`

Defined in: [ts-chocolate/src/packlets/library-runtime/ingredients/ingredientBase.ts:125](https://github.com/ErikFortune/fgv/blob/4be6f2d0ab84c3f4b78ffd3f9b262279d2ab7172/libraries/ts-chocolate/src/packlets/library-runtime/ingredients/ingredientBase.ts#L125)

Optional description

##### Returns

`string` \| `undefined`

Optional description

#### Implementation of

[`IChocolateIngredient`](../interfaces/IChocolateIngredient.md).[`description`](../interfaces/IChocolateIngredient.md#description)

#### Inherited from

[`IngredientBase`](IngredientBase.md).[`description`](IngredientBase.md#description)

***

### entity

#### Get Signature

> **get** **entity**(): `TEntity`

Defined in: [ts-chocolate/src/packlets/library-runtime/ingredients/ingredientBase.ts:246](https://github.com/ErikFortune/fgv/blob/4be6f2d0ab84c3f4b78ffd3f9b262279d2ab7172/libraries/ts-chocolate/src/packlets/library-runtime/ingredients/ingredientBase.ts#L246)

Gets the underlying ingredient data entity (read-only)

##### Returns

`TEntity`

Gets the underlying ingredient entity data.

#### Implementation of

[`IChocolateIngredient`](../interfaces/IChocolateIngredient.md).[`entity`](../interfaces/IChocolateIngredient.md#entity)

#### Inherited from

[`IngredientBase`](IngredientBase.md).[`entity`](IngredientBase.md#entity)

***

### fluidityMacMichael

#### Get Signature

> **get** **fluidityMacMichael**(): [`DegreesMacMichael`](../../../../type-aliases/DegreesMacMichael.md) \| `undefined`

Defined in: [ts-chocolate/src/packlets/library-runtime/ingredients/chocolateIngredient.ts:129](https://github.com/ErikFortune/fgv/blob/4be6f2d0ab84c3f4b78ffd3f9b262279d2ab7172/libraries/ts-chocolate/src/packlets/library-runtime/ingredients/chocolateIngredient.ts#L129)

Viscosity in MacMichael degrees (optional)

##### Deprecated

Use viscosityMcM instead

##### Returns

[`DegreesMacMichael`](../../../../type-aliases/DegreesMacMichael.md) \| `undefined`

***

### fluidityStars

#### Get Signature

> **get** **fluidityStars**(): [`FluidityStars`](../../../../type-aliases/FluidityStars.md) \| `undefined`

Defined in: [ts-chocolate/src/packlets/library-runtime/ingredients/chocolateIngredient.ts:114](https://github.com/ErikFortune/fgv/blob/4be6f2d0ab84c3f4b78ffd3f9b262279d2ab7172/libraries/ts-chocolate/src/packlets/library-runtime/ingredients/chocolateIngredient.ts#L114)

Fluidity in Callebaut star ratings (optional)

##### Returns

[`FluidityStars`](../../../../type-aliases/FluidityStars.md) \| `undefined`

Fluidity in Callebaut star ratings (optional)

#### Implementation of

[`IChocolateIngredient`](../interfaces/IChocolateIngredient.md).[`fluidityStars`](../interfaces/IChocolateIngredient.md#fluiditystars)

***

### ganacheCharacteristics

#### Get Signature

> **get** **ganacheCharacteristics**(): [`IGanacheCharacteristics`](../../Entities/interfaces/IGanacheCharacteristics.md)

Defined in: [ts-chocolate/src/packlets/library-runtime/ingredients/ingredientBase.ts:139](https://github.com/ErikFortune/fgv/blob/4be6f2d0ab84c3f4b78ffd3f9b262279d2ab7172/libraries/ts-chocolate/src/packlets/library-runtime/ingredients/ingredientBase.ts#L139)

Ganache-relevant characteristics

##### Returns

[`IGanacheCharacteristics`](../../Entities/interfaces/IGanacheCharacteristics.md)

Ganache-relevant characteristics

#### Implementation of

[`IChocolateIngredient`](../interfaces/IChocolateIngredient.md).[`ganacheCharacteristics`](../interfaces/IChocolateIngredient.md#ganachecharacteristics)

#### Inherited from

[`IngredientBase`](IngredientBase.md).[`ganacheCharacteristics`](IngredientBase.md#ganachecharacteristics)

***

### id

#### Get Signature

> **get** **id**(): [`IngredientId`](../../../../type-aliases/IngredientId.md)

Defined in: [ts-chocolate/src/packlets/library-runtime/ingredients/ingredientBase.ts:88](https://github.com/ErikFortune/fgv/blob/4be6f2d0ab84c3f4b78ffd3f9b262279d2ab7172/libraries/ts-chocolate/src/packlets/library-runtime/ingredients/ingredientBase.ts#L88)

The composite ingredient ID (e.g., "felchlin.maracaibo-65")

##### Returns

[`IngredientId`](../../../../type-aliases/IngredientId.md)

The composite ingredient ID (e.g., "felchlin.maracaibo-65").
Combines source and base ID for unique identification across sources.

#### Implementation of

[`IChocolateIngredient`](../interfaces/IChocolateIngredient.md).[`id`](../interfaces/IChocolateIngredient.md#id)

#### Inherited from

[`IngredientBase`](IngredientBase.md).[`id`](IngredientBase.md#id)

***

### manufacturer

#### Get Signature

> **get** **manufacturer**(): `string` \| `undefined`

Defined in: [ts-chocolate/src/packlets/library-runtime/ingredients/ingredientBase.ts:132](https://github.com/ErikFortune/fgv/blob/4be6f2d0ab84c3f4b78ffd3f9b262279d2ab7172/libraries/ts-chocolate/src/packlets/library-runtime/ingredients/ingredientBase.ts#L132)

Optional manufacturer

##### Returns

`string` \| `undefined`

Optional manufacturer

#### Implementation of

[`IChocolateIngredient`](../interfaces/IChocolateIngredient.md).[`manufacturer`](../interfaces/IChocolateIngredient.md#manufacturer)

#### Inherited from

[`IngredientBase`](IngredientBase.md).[`manufacturer`](IngredientBase.md#manufacturer)

***

### name

#### Get Signature

> **get** **name**(): `string`

Defined in: [ts-chocolate/src/packlets/library-runtime/ingredients/ingredientBase.ts:113](https://github.com/ErikFortune/fgv/blob/4be6f2d0ab84c3f4b78ffd3f9b262279d2ab7172/libraries/ts-chocolate/src/packlets/library-runtime/ingredients/ingredientBase.ts#L113)

Display name of the ingredient

##### Returns

`string`

Display name

#### Implementation of

[`IChocolateIngredient`](../interfaces/IChocolateIngredient.md).[`name`](../interfaces/IChocolateIngredient.md#name)

#### Inherited from

[`IngredientBase`](IngredientBase.md).[`name`](IngredientBase.md#name)

***

### origins

#### Get Signature

> **get** **origins**(): readonly `string`[] \| `undefined`

Defined in: [ts-chocolate/src/packlets/library-runtime/ingredients/chocolateIngredient.ts:165](https://github.com/ErikFortune/fgv/blob/4be6f2d0ab84c3f4b78ffd3f9b262279d2ab7172/libraries/ts-chocolate/src/packlets/library-runtime/ingredients/chocolateIngredient.ts#L165)

Origin descriptions (optional)

##### Returns

readonly `string`[] \| `undefined`

Origin of the chocolate (optional)

#### Implementation of

[`IChocolateIngredient`](../interfaces/IChocolateIngredient.md).[`origins`](../interfaces/IChocolateIngredient.md#origins)

***

### tags

#### Get Signature

> **get** **tags**(): readonly `string`[]

Defined in: [ts-chocolate/src/packlets/library-runtime/ingredients/ingredientBase.ts:146](https://github.com/ErikFortune/fgv/blob/4be6f2d0ab84c3f4b78ffd3f9b262279d2ab7172/libraries/ts-chocolate/src/packlets/library-runtime/ingredients/ingredientBase.ts#L146)

Tags for searching/filtering

##### Returns

readonly `string`[]

Optional tags for searching/filtering

#### Implementation of

[`IChocolateIngredient`](../interfaces/IChocolateIngredient.md).[`tags`](../interfaces/IChocolateIngredient.md#tags)

#### Inherited from

[`IngredientBase`](IngredientBase.md).[`tags`](IngredientBase.md#tags)

***

### temperatureCurve

#### Get Signature

> **get** **temperatureCurve**(): [`ITemperatureCurve`](../../Entities/namespaces/Ingredients/interfaces/ITemperatureCurve.md) \| `undefined`

Defined in: [ts-chocolate/src/packlets/library-runtime/ingredients/chocolateIngredient.ts:136](https://github.com/ErikFortune/fgv/blob/4be6f2d0ab84c3f4b78ffd3f9b262279d2ab7172/libraries/ts-chocolate/src/packlets/library-runtime/ingredients/chocolateIngredient.ts#L136)

Tempering temperature curve (optional)

##### Returns

[`ITemperatureCurve`](../../Entities/namespaces/Ingredients/interfaces/ITemperatureCurve.md) \| `undefined`

Tempering curve (optional)

#### Implementation of

[`IChocolateIngredient`](../interfaces/IChocolateIngredient.md).[`temperatureCurve`](../interfaces/IChocolateIngredient.md#temperaturecurve)

***

### traceAllergens

#### Get Signature

> **get** **traceAllergens**(): readonly [`Allergen`](../../../../type-aliases/Allergen.md)[]

Defined in: [ts-chocolate/src/packlets/library-runtime/ingredients/ingredientBase.ts:160](https://github.com/ErikFortune/fgv/blob/4be6f2d0ab84c3f4b78ffd3f9b262279d2ab7172/libraries/ts-chocolate/src/packlets/library-runtime/ingredients/ingredientBase.ts#L160)

Trace allergens (possible contamination)

##### Returns

readonly [`Allergen`](../../../../type-aliases/Allergen.md)[]

Optional list of trace allergens possibly present (e.g. due to contamination)

#### Implementation of

[`IChocolateIngredient`](../interfaces/IChocolateIngredient.md).[`traceAllergens`](../interfaces/IChocolateIngredient.md#traceallergens)

#### Inherited from

[`IngredientBase`](IngredientBase.md).[`traceAllergens`](IngredientBase.md#traceallergens)

***

### vegan

#### Get Signature

> **get** **vegan**(): `boolean` \| `undefined`

Defined in: [ts-chocolate/src/packlets/library-runtime/ingredients/ingredientBase.ts:175](https://github.com/ErikFortune/fgv/blob/4be6f2d0ab84c3f4b78ffd3f9b262279d2ab7172/libraries/ts-chocolate/src/packlets/library-runtime/ingredients/ingredientBase.ts#L175)

Whether the ingredient is vegan

##### Returns

`boolean` \| `undefined`

Optional indicator if the ingredient is vegan

#### Implementation of

[`IChocolateIngredient`](../interfaces/IChocolateIngredient.md).[`vegan`](../interfaces/IChocolateIngredient.md#vegan)

#### Inherited from

[`IngredientBase`](IngredientBase.md).[`vegan`](IngredientBase.md#vegan)

***

### viscosityMcM

#### Get Signature

> **get** **viscosityMcM**(): [`DegreesMacMichael`](../../../../type-aliases/DegreesMacMichael.md) \| `undefined`

Defined in: [ts-chocolate/src/packlets/library-runtime/ingredients/chocolateIngredient.ts:121](https://github.com/ErikFortune/fgv/blob/4be6f2d0ab84c3f4b78ffd3f9b262279d2ab7172/libraries/ts-chocolate/src/packlets/library-runtime/ingredients/chocolateIngredient.ts#L121)

Viscosity in MacMichael degrees (optional)

##### Returns

[`DegreesMacMichael`](../../../../type-aliases/DegreesMacMichael.md) \| `undefined`

Viscosity in MacMichael degrees (optional)

#### Implementation of

[`IChocolateIngredient`](../interfaces/IChocolateIngredient.md).[`viscosityMcM`](../interfaces/IChocolateIngredient.md#viscositymcm)

## Methods

### alternateInFillings()

> **alternateInFillings**(): [`IFillingRecipe`](../interfaces/IFillingRecipe.md)[]

Defined in: [ts-chocolate/src/packlets/library-runtime/ingredients/ingredientBase.ts:239](https://github.com/ErikFortune/fgv/blob/4be6f2d0ab84c3f4b78ffd3f9b262279d2ab7172/libraries/ts-chocolate/src/packlets/library-runtime/ingredients/ingredientBase.ts#L239)

Gets filling recipes where this ingredient is listed as an alternate.

#### Returns

[`IFillingRecipe`](../interfaces/IFillingRecipe.md)[]

#### Implementation of

[`IChocolateIngredient`](../interfaces/IChocolateIngredient.md).[`alternateInFillings`](../interfaces/IChocolateIngredient.md#alternateinfillings)

#### Inherited from

[`IngredientBase`](IngredientBase.md).[`alternateInFillings`](IngredientBase.md#alternateinfillings)

***

### isAlcohol()

> **isAlcohol**(): `this is AlcoholIngredient`

Defined in: [ts-chocolate/src/packlets/library-runtime/ingredients/ingredientBase.ts:214](https://github.com/ErikFortune/fgv/blob/4be6f2d0ab84c3f4b78ffd3f9b262279d2ab7172/libraries/ts-chocolate/src/packlets/library-runtime/ingredients/ingredientBase.ts#L214)

Returns true if this is an alcohol ingredient.

#### Returns

`this is AlcoholIngredient`

#### Implementation of

[`IChocolateIngredient`](../interfaces/IChocolateIngredient.md).[`isAlcohol`](../interfaces/IChocolateIngredient.md#isalcohol)

#### Inherited from

[`IngredientBase`](IngredientBase.md).[`isAlcohol`](IngredientBase.md#isalcohol)

***

### isChocolate()

> **isChocolate**(): `this is ChocolateIngredient`

Defined in: [ts-chocolate/src/packlets/library-runtime/ingredients/ingredientBase.ts:186](https://github.com/ErikFortune/fgv/blob/4be6f2d0ab84c3f4b78ffd3f9b262279d2ab7172/libraries/ts-chocolate/src/packlets/library-runtime/ingredients/ingredientBase.ts#L186)

Returns true if this is a chocolate ingredient.

#### Returns

`this is ChocolateIngredient`

#### Implementation of

[`IChocolateIngredient`](../interfaces/IChocolateIngredient.md).[`isChocolate`](../interfaces/IChocolateIngredient.md#ischocolate)

#### Inherited from

[`IngredientBase`](IngredientBase.md).[`isChocolate`](IngredientBase.md#ischocolate)

***

### isDairy()

> **isDairy**(): `this is DairyIngredient`

Defined in: [ts-chocolate/src/packlets/library-runtime/ingredients/ingredientBase.ts:193](https://github.com/ErikFortune/fgv/blob/4be6f2d0ab84c3f4b78ffd3f9b262279d2ab7172/libraries/ts-chocolate/src/packlets/library-runtime/ingredients/ingredientBase.ts#L193)

Returns true if this is a dairy ingredient.

#### Returns

`this is DairyIngredient`

#### Implementation of

[`IChocolateIngredient`](../interfaces/IChocolateIngredient.md).[`isDairy`](../interfaces/IChocolateIngredient.md#isdairy)

#### Inherited from

[`IngredientBase`](IngredientBase.md).[`isDairy`](IngredientBase.md#isdairy)

***

### isFat()

> **isFat**(): `this is FatIngredient`

Defined in: [ts-chocolate/src/packlets/library-runtime/ingredients/ingredientBase.ts:207](https://github.com/ErikFortune/fgv/blob/4be6f2d0ab84c3f4b78ffd3f9b262279d2ab7172/libraries/ts-chocolate/src/packlets/library-runtime/ingredients/ingredientBase.ts#L207)

Returns true if this is a fat ingredient.

#### Returns

`this is FatIngredient`

#### Implementation of

[`IChocolateIngredient`](../interfaces/IChocolateIngredient.md).[`isFat`](../interfaces/IChocolateIngredient.md#isfat)

#### Inherited from

[`IngredientBase`](IngredientBase.md).[`isFat`](IngredientBase.md#isfat)

***

### isSugar()

> **isSugar**(): `this is SugarIngredient`

Defined in: [ts-chocolate/src/packlets/library-runtime/ingredients/ingredientBase.ts:200](https://github.com/ErikFortune/fgv/blob/4be6f2d0ab84c3f4b78ffd3f9b262279d2ab7172/libraries/ts-chocolate/src/packlets/library-runtime/ingredients/ingredientBase.ts#L200)

Returns true if this is a sugar ingredient.

#### Returns

`this is SugarIngredient`

#### Implementation of

[`IChocolateIngredient`](../interfaces/IChocolateIngredient.md).[`isSugar`](../interfaces/IChocolateIngredient.md#issugar)

#### Inherited from

[`IngredientBase`](IngredientBase.md).[`isSugar`](IngredientBase.md#issugar)

***

### primaryInFillings()

> **primaryInFillings**(): [`IFillingRecipe`](../interfaces/IFillingRecipe.md)[]

Defined in: [ts-chocolate/src/packlets/library-runtime/ingredients/ingredientBase.ts:232](https://github.com/ErikFortune/fgv/blob/4be6f2d0ab84c3f4b78ffd3f9b262279d2ab7172/libraries/ts-chocolate/src/packlets/library-runtime/ingredients/ingredientBase.ts#L232)

Gets filling recipes where this ingredient is the primary choice.

#### Returns

[`IFillingRecipe`](../interfaces/IFillingRecipe.md)[]

#### Implementation of

[`IChocolateIngredient`](../interfaces/IChocolateIngredient.md).[`primaryInFillings`](../interfaces/IChocolateIngredient.md#primaryinfillings)

#### Inherited from

[`IngredientBase`](IngredientBase.md).[`primaryInFillings`](IngredientBase.md#primaryinfillings)

***

### usedByFillings()

> **usedByFillings**(): [`IFillingRecipe`](../interfaces/IFillingRecipe.md)[]

Defined in: [ts-chocolate/src/packlets/library-runtime/ingredients/ingredientBase.ts:225](https://github.com/ErikFortune/fgv/blob/4be6f2d0ab84c3f4b78ffd3f9b262279d2ab7172/libraries/ts-chocolate/src/packlets/library-runtime/ingredients/ingredientBase.ts#L225)

Gets all filling recipes that use this ingredient (primary or alternate).

#### Returns

[`IFillingRecipe`](../interfaces/IFillingRecipe.md)[]

#### Implementation of

[`IChocolateIngredient`](../interfaces/IChocolateIngredient.md).[`usedByFillings`](../interfaces/IChocolateIngredient.md#usedbyfillings)

#### Inherited from

[`IngredientBase`](IngredientBase.md).[`usedByFillings`](IngredientBase.md#usedbyfillings)

***

### create()

> `static` **create**(`context`, `id`, `ingredient`): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`ChocolateIngredient`\>

Defined in: [ts-chocolate/src/packlets/library-runtime/ingredients/chocolateIngredient.ts:74](https://github.com/ErikFortune/fgv/blob/4be6f2d0ab84c3f4b78ffd3f9b262279d2ab7172/libraries/ts-chocolate/src/packlets/library-runtime/ingredients/chocolateIngredient.ts#L74)

Factory method for creating a ChocolateIngredient.

#### Parameters

##### context

[`IIngredientContext`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-chocolate/docs)

The runtime context

##### id

[`IngredientId`](../../../../type-aliases/IngredientId.md)

The ingredient ID

##### ingredient

[`IChocolateIngredientEntity`](../../Entities/interfaces/IChocolateIngredientEntity.md)

The chocolate ingredient data entity

#### Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`ChocolateIngredient`\>

Success with ChocolateIngredient
