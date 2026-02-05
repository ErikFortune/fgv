[**@fgv/ts-chocolate**](../../../../README.md)

***

[@fgv/ts-chocolate](../../../../README.md) / [LibraryRuntime](../README.md) / IngredientBase

# Abstract Class: IngredientBase

Defined in: [ts-chocolate/src/packlets/library-runtime/ingredients/ingredientBase.ts:54](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/ingredients/ingredientBase.ts#L54)

Abstract base class for runtime ingredients.
Provides common properties and navigation shared by all ingredient types.

## Extended by

- [`ChocolateIngredient`](ChocolateIngredient.md)
- [`DairyIngredient`](DairyIngredient.md)
- [`SugarIngredient`](SugarIngredient.md)
- [`FatIngredient`](FatIngredient.md)
- [`AlcoholIngredient`](AlcoholIngredient.md)

## Implements

- [`IIngredient`](../interfaces/IIngredient.md)

## Properties

### \_baseId

> `protected` `readonly` **\_baseId**: [`BaseIngredientId`](../../../../type-aliases/BaseIngredientId.md)

Defined in: [ts-chocolate/src/packlets/library-runtime/ingredients/ingredientBase.ts:59](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/ingredients/ingredientBase.ts#L59)

***

### \_context

> `protected` `readonly` **\_context**: [`IIngredientContext`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-chocolate/docs)

Defined in: [ts-chocolate/src/packlets/library-runtime/ingredients/ingredientBase.ts:55](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/ingredients/ingredientBase.ts#L55)

***

### \_id

> `protected` `readonly` **\_id**: [`IngredientId`](../../../../type-aliases/IngredientId.md)

Defined in: [ts-chocolate/src/packlets/library-runtime/ingredients/ingredientBase.ts:56](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/ingredients/ingredientBase.ts#L56)

***

### \_ingredient

> `protected` `readonly` **\_ingredient**: [`IngredientEntity`](../../Entities/type-aliases/IngredientEntity.md)

Defined in: [ts-chocolate/src/packlets/library-runtime/ingredients/ingredientBase.ts:57](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/ingredients/ingredientBase.ts#L57)

***

### \_sourceId

> `protected` `readonly` **\_sourceId**: [`CollectionId`](../../../../type-aliases/CollectionId.md)

Defined in: [ts-chocolate/src/packlets/library-runtime/ingredients/ingredientBase.ts:58](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/ingredients/ingredientBase.ts#L58)

## Accessors

### allergens

#### Get Signature

> **get** **allergens**(): readonly [`Allergen`](../../../../type-aliases/Allergen.md)[]

Defined in: [ts-chocolate/src/packlets/library-runtime/ingredients/ingredientBase.ts:150](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/ingredients/ingredientBase.ts#L150)

Common allergens present

##### Returns

readonly [`Allergen`](../../../../type-aliases/Allergen.md)[]

Optional list of common allergens present in the ingredient

#### Implementation of

[`IIngredient`](../interfaces/IIngredient.md).[`allergens`](../interfaces/IIngredient.md#allergens)

***

### baseId

#### Get Signature

> **get** **baseId**(): [`BaseIngredientId`](../../../../type-aliases/BaseIngredientId.md)

Defined in: [ts-chocolate/src/packlets/library-runtime/ingredients/ingredientBase.ts:99](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/ingredients/ingredientBase.ts#L99)

The base ingredient ID within the source

##### Returns

[`BaseIngredientId`](../../../../type-aliases/BaseIngredientId.md)

The base ingredient ID within the source.

#### Implementation of

[`IIngredient`](../interfaces/IIngredient.md).[`baseId`](../interfaces/IIngredient.md#baseid)

***

### category

#### Get Signature

> **get** `abstract` **category**(): [`IngredientCategory`](../../../../type-aliases/IngredientCategory.md)

Defined in: [ts-chocolate/src/packlets/library-runtime/ingredients/ingredientBase.ts:117](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/ingredients/ingredientBase.ts#L117)

Ingredient category - must be overridden by subclasses

##### Returns

[`IngredientCategory`](../../../../type-aliases/IngredientCategory.md)

Ingredient category (discriminator)

#### Implementation of

[`IIngredient`](../interfaces/IIngredient.md).[`category`](../interfaces/IIngredient.md#category)

***

### certifications

#### Get Signature

> **get** **certifications**(): readonly [`Certification`](../../../../type-aliases/Certification.md)[]

Defined in: [ts-chocolate/src/packlets/library-runtime/ingredients/ingredientBase.ts:165](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/ingredients/ingredientBase.ts#L165)

Certifications the ingredient has

##### Returns

readonly [`Certification`](../../../../type-aliases/Certification.md)[]

Optional list of certifications the ingredient has

#### Implementation of

[`IIngredient`](../interfaces/IIngredient.md).[`certifications`](../interfaces/IIngredient.md#certifications)

***

### collectionId

#### Get Signature

> **get** **collectionId**(): [`CollectionId`](../../../../type-aliases/CollectionId.md)

Defined in: [ts-chocolate/src/packlets/library-runtime/ingredients/ingredientBase.ts:92](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/ingredients/ingredientBase.ts#L92)

The source ID part of the composite ID

##### Returns

[`CollectionId`](../../../../type-aliases/CollectionId.md)

The collection ID part of the composite ID.

#### Implementation of

[`IIngredient`](../interfaces/IIngredient.md).[`collectionId`](../interfaces/IIngredient.md#collectionid)

***

### description

#### Get Signature

> **get** **description**(): `string` \| `undefined`

Defined in: [ts-chocolate/src/packlets/library-runtime/ingredients/ingredientBase.ts:122](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/ingredients/ingredientBase.ts#L122)

Optional description

##### Returns

`string` \| `undefined`

Optional description

#### Implementation of

[`IIngredient`](../interfaces/IIngredient.md).[`description`](../interfaces/IIngredient.md#description)

***

### entity

#### Get Signature

> **get** `abstract` **entity**(): [`IngredientEntity`](../../Entities/type-aliases/IngredientEntity.md)

Defined in: [ts-chocolate/src/packlets/library-runtime/ingredients/ingredientBase.ts:243](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/ingredients/ingredientBase.ts#L243)

Gets the underlying ingredient data entity (read-only)

##### Returns

[`IngredientEntity`](../../Entities/type-aliases/IngredientEntity.md)

Gets the underlying ingredient entity data.

#### Implementation of

[`IIngredient`](../interfaces/IIngredient.md).[`entity`](../interfaces/IIngredient.md#entity)

***

### ganacheCharacteristics

#### Get Signature

> **get** **ganacheCharacteristics**(): [`IGanacheCharacteristics`](../../Entities/interfaces/IGanacheCharacteristics.md)

Defined in: [ts-chocolate/src/packlets/library-runtime/ingredients/ingredientBase.ts:136](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/ingredients/ingredientBase.ts#L136)

Ganache-relevant characteristics

##### Returns

[`IGanacheCharacteristics`](../../Entities/interfaces/IGanacheCharacteristics.md)

Ganache-relevant characteristics

#### Implementation of

[`IIngredient`](../interfaces/IIngredient.md).[`ganacheCharacteristics`](../interfaces/IIngredient.md#ganachecharacteristics)

***

### id

#### Get Signature

> **get** **id**(): [`IngredientId`](../../../../type-aliases/IngredientId.md)

Defined in: [ts-chocolate/src/packlets/library-runtime/ingredients/ingredientBase.ts:85](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/ingredients/ingredientBase.ts#L85)

The composite ingredient ID (e.g., "felchlin.maracaibo-65")

##### Returns

[`IngredientId`](../../../../type-aliases/IngredientId.md)

The composite ingredient ID (e.g., "felchlin.maracaibo-65").
Combines source and base ID for unique identification across sources.

#### Implementation of

[`IIngredient`](../interfaces/IIngredient.md).[`id`](../interfaces/IIngredient.md#id)

***

### manufacturer

#### Get Signature

> **get** **manufacturer**(): `string` \| `undefined`

Defined in: [ts-chocolate/src/packlets/library-runtime/ingredients/ingredientBase.ts:129](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/ingredients/ingredientBase.ts#L129)

Optional manufacturer

##### Returns

`string` \| `undefined`

Optional manufacturer

#### Implementation of

[`IIngredient`](../interfaces/IIngredient.md).[`manufacturer`](../interfaces/IIngredient.md#manufacturer)

***

### name

#### Get Signature

> **get** **name**(): `string`

Defined in: [ts-chocolate/src/packlets/library-runtime/ingredients/ingredientBase.ts:110](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/ingredients/ingredientBase.ts#L110)

Display name of the ingredient

##### Returns

`string`

Display name

#### Implementation of

[`IIngredient`](../interfaces/IIngredient.md).[`name`](../interfaces/IIngredient.md#name)

***

### tags

#### Get Signature

> **get** **tags**(): readonly `string`[]

Defined in: [ts-chocolate/src/packlets/library-runtime/ingredients/ingredientBase.ts:143](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/ingredients/ingredientBase.ts#L143)

Tags for searching/filtering

##### Returns

readonly `string`[]

Optional tags for searching/filtering

#### Implementation of

[`IIngredient`](../interfaces/IIngredient.md).[`tags`](../interfaces/IIngredient.md#tags)

***

### traceAllergens

#### Get Signature

> **get** **traceAllergens**(): readonly [`Allergen`](../../../../type-aliases/Allergen.md)[]

Defined in: [ts-chocolate/src/packlets/library-runtime/ingredients/ingredientBase.ts:157](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/ingredients/ingredientBase.ts#L157)

Trace allergens (possible contamination)

##### Returns

readonly [`Allergen`](../../../../type-aliases/Allergen.md)[]

Optional list of trace allergens possibly present (e.g. due to contamination)

#### Implementation of

[`IIngredient`](../interfaces/IIngredient.md).[`traceAllergens`](../interfaces/IIngredient.md#traceallergens)

***

### vegan

#### Get Signature

> **get** **vegan**(): `boolean` \| `undefined`

Defined in: [ts-chocolate/src/packlets/library-runtime/ingredients/ingredientBase.ts:172](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/ingredients/ingredientBase.ts#L172)

Whether the ingredient is vegan

##### Returns

`boolean` \| `undefined`

Optional indicator if the ingredient is vegan

#### Implementation of

[`IIngredient`](../interfaces/IIngredient.md).[`vegan`](../interfaces/IIngredient.md#vegan)

## Methods

### alternateInFillings()

> **alternateInFillings**(): [`IFillingRecipe`](../interfaces/IFillingRecipe.md)[]

Defined in: [ts-chocolate/src/packlets/library-runtime/ingredients/ingredientBase.ts:236](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/ingredients/ingredientBase.ts#L236)

Gets filling recipes where this ingredient is listed as an alternate.

#### Returns

[`IFillingRecipe`](../interfaces/IFillingRecipe.md)[]

#### Implementation of

[`IIngredient`](../interfaces/IIngredient.md).[`alternateInFillings`](../interfaces/IIngredient.md#alternateinfillings)

***

### isAlcohol()

> **isAlcohol**(): `this is AlcoholIngredient`

Defined in: [ts-chocolate/src/packlets/library-runtime/ingredients/ingredientBase.ts:211](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/ingredients/ingredientBase.ts#L211)

Returns true if this is an alcohol ingredient.

#### Returns

`this is AlcoholIngredient`

#### Implementation of

[`IIngredient`](../interfaces/IIngredient.md).[`isAlcohol`](../interfaces/IIngredient.md#isalcohol)

***

### isChocolate()

> **isChocolate**(): `this is ChocolateIngredient`

Defined in: [ts-chocolate/src/packlets/library-runtime/ingredients/ingredientBase.ts:183](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/ingredients/ingredientBase.ts#L183)

Returns true if this is a chocolate ingredient.

#### Returns

`this is ChocolateIngredient`

#### Implementation of

[`IIngredient`](../interfaces/IIngredient.md).[`isChocolate`](../interfaces/IIngredient.md#ischocolate)

***

### isDairy()

> **isDairy**(): `this is DairyIngredient`

Defined in: [ts-chocolate/src/packlets/library-runtime/ingredients/ingredientBase.ts:190](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/ingredients/ingredientBase.ts#L190)

Returns true if this is a dairy ingredient.

#### Returns

`this is DairyIngredient`

#### Implementation of

[`IIngredient`](../interfaces/IIngredient.md).[`isDairy`](../interfaces/IIngredient.md#isdairy)

***

### isFat()

> **isFat**(): `this is FatIngredient`

Defined in: [ts-chocolate/src/packlets/library-runtime/ingredients/ingredientBase.ts:204](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/ingredients/ingredientBase.ts#L204)

Returns true if this is a fat ingredient.

#### Returns

`this is FatIngredient`

#### Implementation of

[`IIngredient`](../interfaces/IIngredient.md).[`isFat`](../interfaces/IIngredient.md#isfat)

***

### isSugar()

> **isSugar**(): `this is SugarIngredient`

Defined in: [ts-chocolate/src/packlets/library-runtime/ingredients/ingredientBase.ts:197](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/ingredients/ingredientBase.ts#L197)

Returns true if this is a sugar ingredient.

#### Returns

`this is SugarIngredient`

#### Implementation of

[`IIngredient`](../interfaces/IIngredient.md).[`isSugar`](../interfaces/IIngredient.md#issugar)

***

### primaryInFillings()

> **primaryInFillings**(): [`IFillingRecipe`](../interfaces/IFillingRecipe.md)[]

Defined in: [ts-chocolate/src/packlets/library-runtime/ingredients/ingredientBase.ts:229](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/ingredients/ingredientBase.ts#L229)

Gets filling recipes where this ingredient is the primary choice.

#### Returns

[`IFillingRecipe`](../interfaces/IFillingRecipe.md)[]

#### Implementation of

[`IIngredient`](../interfaces/IIngredient.md).[`primaryInFillings`](../interfaces/IIngredient.md#primaryinfillings)

***

### usedByFillings()

> **usedByFillings**(): [`IFillingRecipe`](../interfaces/IFillingRecipe.md)[]

Defined in: [ts-chocolate/src/packlets/library-runtime/ingredients/ingredientBase.ts:222](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/ingredients/ingredientBase.ts#L222)

Gets all filling recipes that use this ingredient (primary or alternate).

#### Returns

[`IFillingRecipe`](../interfaces/IFillingRecipe.md)[]

#### Implementation of

[`IIngredient`](../interfaces/IIngredient.md).[`usedByFillings`](../interfaces/IIngredient.md#usedbyfillings)
