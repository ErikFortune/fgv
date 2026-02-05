[**@fgv/ts-chocolate**](../../../../README.md)

***

[@fgv/ts-chocolate](../../../../README.md) / [LibraryRuntime](../README.md) / AlcoholIngredient

# Class: AlcoholIngredient

Defined in: [ts-chocolate/src/packlets/library-runtime/ingredients/alcoholIngredient.ts:42](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/library-runtime/ingredients/alcoholIngredient.ts#L42)

A resolved view of an alcohol ingredient with navigation capabilities.
Immutable - does not allow modification of underlying data.

## Extends

- [`IngredientBase`](IngredientBase.md)

## Implements

- [`IAlcoholIngredient`](../interfaces/IAlcoholIngredient.md)

## Properties

### \_baseId

> `protected` `readonly` **\_baseId**: [`BaseIngredientId`](../../../../type-aliases/BaseIngredientId.md)

Defined in: [ts-chocolate/src/packlets/library-runtime/ingredients/ingredientBase.ts:62](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/library-runtime/ingredients/ingredientBase.ts#L62)

#### Inherited from

[`IngredientBase`](IngredientBase.md).[`_baseId`](IngredientBase.md#_baseid)

***

### \_context

> `protected` `readonly` **\_context**: [`IIngredientContext`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-chocolate/docs)

Defined in: [ts-chocolate/src/packlets/library-runtime/ingredients/ingredientBase.ts:58](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/library-runtime/ingredients/ingredientBase.ts#L58)

#### Inherited from

[`IngredientBase`](IngredientBase.md).[`_context`](IngredientBase.md#_context)

***

### \_id

> `protected` `readonly` **\_id**: [`IngredientId`](../../../../type-aliases/IngredientId.md)

Defined in: [ts-chocolate/src/packlets/library-runtime/ingredients/ingredientBase.ts:59](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/library-runtime/ingredients/ingredientBase.ts#L59)

#### Inherited from

[`IngredientBase`](IngredientBase.md).[`_id`](IngredientBase.md#_id)

***

### \_ingredient

> `protected` `readonly` **\_ingredient**: [`IngredientEntity`](../../Entities/type-aliases/IngredientEntity.md)

Defined in: [ts-chocolate/src/packlets/library-runtime/ingredients/ingredientBase.ts:60](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/library-runtime/ingredients/ingredientBase.ts#L60)

#### Inherited from

[`IngredientBase`](IngredientBase.md).[`_ingredient`](IngredientBase.md#_ingredient)

***

### \_sourceId

> `protected` `readonly` **\_sourceId**: [`CollectionId`](../../../../type-aliases/CollectionId.md)

Defined in: [ts-chocolate/src/packlets/library-runtime/ingredients/ingredientBase.ts:61](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/library-runtime/ingredients/ingredientBase.ts#L61)

#### Inherited from

[`IngredientBase`](IngredientBase.md).[`_sourceId`](IngredientBase.md#_sourceid)

## Accessors

### alcoholByVolume

#### Get Signature

> **get** **alcoholByVolume**(): [`Percentage`](../../../../type-aliases/Percentage.md) \| `undefined`

Defined in: [ts-chocolate/src/packlets/library-runtime/ingredients/alcoholIngredient.ts:88](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/library-runtime/ingredients/alcoholIngredient.ts#L88)

Alcohol by volume percentage (optional)

##### Returns

[`Percentage`](../../../../type-aliases/Percentage.md) \| `undefined`

Alcohol by volume percentage

#### Implementation of

[`IAlcoholIngredient`](../interfaces/IAlcoholIngredient.md).[`alcoholByVolume`](../interfaces/IAlcoholIngredient.md#alcoholbyvolume)

***

### allergens

#### Get Signature

> **get** **allergens**(): readonly [`Allergen`](../../../../type-aliases/Allergen.md)[]

Defined in: [ts-chocolate/src/packlets/library-runtime/ingredients/ingredientBase.ts:153](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/library-runtime/ingredients/ingredientBase.ts#L153)

Common allergens present

##### Returns

readonly [`Allergen`](../../../../type-aliases/Allergen.md)[]

Optional list of common allergens present in the ingredient

#### Implementation of

[`IAlcoholIngredient`](../interfaces/IAlcoholIngredient.md).[`allergens`](../interfaces/IAlcoholIngredient.md#allergens)

#### Inherited from

[`IngredientBase`](IngredientBase.md).[`allergens`](IngredientBase.md#allergens)

***

### baseId

#### Get Signature

> **get** **baseId**(): [`BaseIngredientId`](../../../../type-aliases/BaseIngredientId.md)

Defined in: [ts-chocolate/src/packlets/library-runtime/ingredients/ingredientBase.ts:102](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/library-runtime/ingredients/ingredientBase.ts#L102)

The base ingredient ID within the source

##### Returns

[`BaseIngredientId`](../../../../type-aliases/BaseIngredientId.md)

The base ingredient ID within the source.

#### Implementation of

[`IAlcoholIngredient`](../interfaces/IAlcoholIngredient.md).[`baseId`](../interfaces/IAlcoholIngredient.md#baseid)

#### Inherited from

[`IngredientBase`](IngredientBase.md).[`baseId`](IngredientBase.md#baseid)

***

### category

#### Get Signature

> **get** **category**(): `"alcohol"`

Defined in: [ts-chocolate/src/packlets/library-runtime/ingredients/alcoholIngredient.ts:77](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/library-runtime/ingredients/alcoholIngredient.ts#L77)

Category is always 'alcohol' for this type

##### Returns

`"alcohol"`

Category is always alcohol for this type

#### Implementation of

[`IAlcoholIngredient`](../interfaces/IAlcoholIngredient.md).[`category`](../interfaces/IAlcoholIngredient.md#category)

#### Overrides

[`IngredientBase`](IngredientBase.md).[`category`](IngredientBase.md#category)

***

### certifications

#### Get Signature

> **get** **certifications**(): readonly [`Certification`](../../../../type-aliases/Certification.md)[]

Defined in: [ts-chocolate/src/packlets/library-runtime/ingredients/ingredientBase.ts:168](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/library-runtime/ingredients/ingredientBase.ts#L168)

Certifications the ingredient has

##### Returns

readonly [`Certification`](../../../../type-aliases/Certification.md)[]

Optional list of certifications the ingredient has

#### Implementation of

[`IAlcoholIngredient`](../interfaces/IAlcoholIngredient.md).[`certifications`](../interfaces/IAlcoholIngredient.md#certifications)

#### Inherited from

[`IngredientBase`](IngredientBase.md).[`certifications`](IngredientBase.md#certifications)

***

### collectionId

#### Get Signature

> **get** **collectionId**(): [`CollectionId`](../../../../type-aliases/CollectionId.md)

Defined in: [ts-chocolate/src/packlets/library-runtime/ingredients/ingredientBase.ts:95](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/library-runtime/ingredients/ingredientBase.ts#L95)

The source ID part of the composite ID

##### Returns

[`CollectionId`](../../../../type-aliases/CollectionId.md)

The collection ID part of the composite ID.

#### Implementation of

[`IAlcoholIngredient`](../interfaces/IAlcoholIngredient.md).[`collectionId`](../interfaces/IAlcoholIngredient.md#collectionid)

#### Inherited from

[`IngredientBase`](IngredientBase.md).[`collectionId`](IngredientBase.md#collectionid)

***

### description

#### Get Signature

> **get** **description**(): `string` \| `undefined`

Defined in: [ts-chocolate/src/packlets/library-runtime/ingredients/ingredientBase.ts:125](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/library-runtime/ingredients/ingredientBase.ts#L125)

Optional description

##### Returns

`string` \| `undefined`

Optional description

#### Implementation of

[`IAlcoholIngredient`](../interfaces/IAlcoholIngredient.md).[`description`](../interfaces/IAlcoholIngredient.md#description)

#### Inherited from

[`IngredientBase`](IngredientBase.md).[`description`](IngredientBase.md#description)

***

### entity

#### Get Signature

> **get** **entity**(): [`IAlcoholIngredientEntity`](../../Entities/interfaces/IAlcoholIngredientEntity.md)

Defined in: [ts-chocolate/src/packlets/library-runtime/ingredients/alcoholIngredient.ts:102](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/library-runtime/ingredients/alcoholIngredient.ts#L102)

Gets the underlying alcohol ingredient data entity

##### Returns

[`IAlcoholIngredientEntity`](../../Entities/interfaces/IAlcoholIngredientEntity.md)

Gets the underlying ingredient entity data.

#### Implementation of

[`IAlcoholIngredient`](../interfaces/IAlcoholIngredient.md).[`entity`](../interfaces/IAlcoholIngredient.md#entity)

#### Overrides

[`IngredientBase`](IngredientBase.md).[`entity`](IngredientBase.md#entity)

***

### flavorProfile

#### Get Signature

> **get** **flavorProfile**(): `string` \| `undefined`

Defined in: [ts-chocolate/src/packlets/library-runtime/ingredients/alcoholIngredient.ts:95](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/library-runtime/ingredients/alcoholIngredient.ts#L95)

Flavor profile description (optional)

##### Returns

`string` \| `undefined`

Flavor profile description (optional)

#### Implementation of

[`IAlcoholIngredient`](../interfaces/IAlcoholIngredient.md).[`flavorProfile`](../interfaces/IAlcoholIngredient.md#flavorprofile)

***

### ganacheCharacteristics

#### Get Signature

> **get** **ganacheCharacteristics**(): [`IGanacheCharacteristics`](../../Entities/interfaces/IGanacheCharacteristics.md)

Defined in: [ts-chocolate/src/packlets/library-runtime/ingredients/ingredientBase.ts:139](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/library-runtime/ingredients/ingredientBase.ts#L139)

Ganache-relevant characteristics

##### Returns

[`IGanacheCharacteristics`](../../Entities/interfaces/IGanacheCharacteristics.md)

Ganache-relevant characteristics

#### Implementation of

[`IAlcoholIngredient`](../interfaces/IAlcoholIngredient.md).[`ganacheCharacteristics`](../interfaces/IAlcoholIngredient.md#ganachecharacteristics)

#### Inherited from

[`IngredientBase`](IngredientBase.md).[`ganacheCharacteristics`](IngredientBase.md#ganachecharacteristics)

***

### id

#### Get Signature

> **get** **id**(): [`IngredientId`](../../../../type-aliases/IngredientId.md)

Defined in: [ts-chocolate/src/packlets/library-runtime/ingredients/ingredientBase.ts:88](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/library-runtime/ingredients/ingredientBase.ts#L88)

The composite ingredient ID (e.g., "felchlin.maracaibo-65")

##### Returns

[`IngredientId`](../../../../type-aliases/IngredientId.md)

The composite ingredient ID (e.g., "felchlin.maracaibo-65").
Combines source and base ID for unique identification across sources.

#### Implementation of

[`IAlcoholIngredient`](../interfaces/IAlcoholIngredient.md).[`id`](../interfaces/IAlcoholIngredient.md#id)

#### Inherited from

[`IngredientBase`](IngredientBase.md).[`id`](IngredientBase.md#id)

***

### manufacturer

#### Get Signature

> **get** **manufacturer**(): `string` \| `undefined`

Defined in: [ts-chocolate/src/packlets/library-runtime/ingredients/ingredientBase.ts:132](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/library-runtime/ingredients/ingredientBase.ts#L132)

Optional manufacturer

##### Returns

`string` \| `undefined`

Optional manufacturer

#### Implementation of

[`IAlcoholIngredient`](../interfaces/IAlcoholIngredient.md).[`manufacturer`](../interfaces/IAlcoholIngredient.md#manufacturer)

#### Inherited from

[`IngredientBase`](IngredientBase.md).[`manufacturer`](IngredientBase.md#manufacturer)

***

### name

#### Get Signature

> **get** **name**(): `string`

Defined in: [ts-chocolate/src/packlets/library-runtime/ingredients/ingredientBase.ts:113](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/library-runtime/ingredients/ingredientBase.ts#L113)

Display name of the ingredient

##### Returns

`string`

Display name

#### Implementation of

[`IAlcoholIngredient`](../interfaces/IAlcoholIngredient.md).[`name`](../interfaces/IAlcoholIngredient.md#name)

#### Inherited from

[`IngredientBase`](IngredientBase.md).[`name`](IngredientBase.md#name)

***

### tags

#### Get Signature

> **get** **tags**(): readonly `string`[]

Defined in: [ts-chocolate/src/packlets/library-runtime/ingredients/ingredientBase.ts:146](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/library-runtime/ingredients/ingredientBase.ts#L146)

Tags for searching/filtering

##### Returns

readonly `string`[]

Optional tags for searching/filtering

#### Implementation of

[`IAlcoholIngredient`](../interfaces/IAlcoholIngredient.md).[`tags`](../interfaces/IAlcoholIngredient.md#tags)

#### Inherited from

[`IngredientBase`](IngredientBase.md).[`tags`](IngredientBase.md#tags)

***

### traceAllergens

#### Get Signature

> **get** **traceAllergens**(): readonly [`Allergen`](../../../../type-aliases/Allergen.md)[]

Defined in: [ts-chocolate/src/packlets/library-runtime/ingredients/ingredientBase.ts:160](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/library-runtime/ingredients/ingredientBase.ts#L160)

Trace allergens (possible contamination)

##### Returns

readonly [`Allergen`](../../../../type-aliases/Allergen.md)[]

Optional list of trace allergens possibly present (e.g. due to contamination)

#### Implementation of

[`IAlcoholIngredient`](../interfaces/IAlcoholIngredient.md).[`traceAllergens`](../interfaces/IAlcoholIngredient.md#traceallergens)

#### Inherited from

[`IngredientBase`](IngredientBase.md).[`traceAllergens`](IngredientBase.md#traceallergens)

***

### vegan

#### Get Signature

> **get** **vegan**(): `boolean` \| `undefined`

Defined in: [ts-chocolate/src/packlets/library-runtime/ingredients/ingredientBase.ts:175](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/library-runtime/ingredients/ingredientBase.ts#L175)

Whether the ingredient is vegan

##### Returns

`boolean` \| `undefined`

Optional indicator if the ingredient is vegan

#### Implementation of

[`IAlcoholIngredient`](../interfaces/IAlcoholIngredient.md).[`vegan`](../interfaces/IAlcoholIngredient.md#vegan)

#### Inherited from

[`IngredientBase`](IngredientBase.md).[`vegan`](IngredientBase.md#vegan)

## Methods

### alternateInFillings()

> **alternateInFillings**(): [`IFillingRecipe`](../interfaces/IFillingRecipe.md)[]

Defined in: [ts-chocolate/src/packlets/library-runtime/ingredients/ingredientBase.ts:239](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/library-runtime/ingredients/ingredientBase.ts#L239)

Gets filling recipes where this ingredient is listed as an alternate.

#### Returns

[`IFillingRecipe`](../interfaces/IFillingRecipe.md)[]

#### Implementation of

[`IAlcoholIngredient`](../interfaces/IAlcoholIngredient.md).[`alternateInFillings`](../interfaces/IAlcoholIngredient.md#alternateinfillings)

#### Inherited from

[`IngredientBase`](IngredientBase.md).[`alternateInFillings`](IngredientBase.md#alternateinfillings)

***

### isAlcohol()

> **isAlcohol**(): `this is AlcoholIngredient`

Defined in: [ts-chocolate/src/packlets/library-runtime/ingredients/ingredientBase.ts:214](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/library-runtime/ingredients/ingredientBase.ts#L214)

Returns true if this is an alcohol ingredient.

#### Returns

`this is AlcoholIngredient`

#### Implementation of

[`IAlcoholIngredient`](../interfaces/IAlcoholIngredient.md).[`isAlcohol`](../interfaces/IAlcoholIngredient.md#isalcohol)

#### Inherited from

[`IngredientBase`](IngredientBase.md).[`isAlcohol`](IngredientBase.md#isalcohol)

***

### isChocolate()

> **isChocolate**(): `this is ChocolateIngredient`

Defined in: [ts-chocolate/src/packlets/library-runtime/ingredients/ingredientBase.ts:186](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/library-runtime/ingredients/ingredientBase.ts#L186)

Returns true if this is a chocolate ingredient.

#### Returns

`this is ChocolateIngredient`

#### Implementation of

[`IAlcoholIngredient`](../interfaces/IAlcoholIngredient.md).[`isChocolate`](../interfaces/IAlcoholIngredient.md#ischocolate)

#### Inherited from

[`IngredientBase`](IngredientBase.md).[`isChocolate`](IngredientBase.md#ischocolate)

***

### isDairy()

> **isDairy**(): `this is DairyIngredient`

Defined in: [ts-chocolate/src/packlets/library-runtime/ingredients/ingredientBase.ts:193](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/library-runtime/ingredients/ingredientBase.ts#L193)

Returns true if this is a dairy ingredient.

#### Returns

`this is DairyIngredient`

#### Implementation of

[`IAlcoholIngredient`](../interfaces/IAlcoholIngredient.md).[`isDairy`](../interfaces/IAlcoholIngredient.md#isdairy)

#### Inherited from

[`IngredientBase`](IngredientBase.md).[`isDairy`](IngredientBase.md#isdairy)

***

### isFat()

> **isFat**(): `this is FatIngredient`

Defined in: [ts-chocolate/src/packlets/library-runtime/ingredients/ingredientBase.ts:207](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/library-runtime/ingredients/ingredientBase.ts#L207)

Returns true if this is a fat ingredient.

#### Returns

`this is FatIngredient`

#### Implementation of

[`IAlcoholIngredient`](../interfaces/IAlcoholIngredient.md).[`isFat`](../interfaces/IAlcoholIngredient.md#isfat)

#### Inherited from

[`IngredientBase`](IngredientBase.md).[`isFat`](IngredientBase.md#isfat)

***

### isSugar()

> **isSugar**(): `this is SugarIngredient`

Defined in: [ts-chocolate/src/packlets/library-runtime/ingredients/ingredientBase.ts:200](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/library-runtime/ingredients/ingredientBase.ts#L200)

Returns true if this is a sugar ingredient.

#### Returns

`this is SugarIngredient`

#### Implementation of

[`IAlcoholIngredient`](../interfaces/IAlcoholIngredient.md).[`isSugar`](../interfaces/IAlcoholIngredient.md#issugar)

#### Inherited from

[`IngredientBase`](IngredientBase.md).[`isSugar`](IngredientBase.md#issugar)

***

### primaryInFillings()

> **primaryInFillings**(): [`IFillingRecipe`](../interfaces/IFillingRecipe.md)[]

Defined in: [ts-chocolate/src/packlets/library-runtime/ingredients/ingredientBase.ts:232](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/library-runtime/ingredients/ingredientBase.ts#L232)

Gets filling recipes where this ingredient is the primary choice.

#### Returns

[`IFillingRecipe`](../interfaces/IFillingRecipe.md)[]

#### Implementation of

[`IAlcoholIngredient`](../interfaces/IAlcoholIngredient.md).[`primaryInFillings`](../interfaces/IAlcoholIngredient.md#primaryinfillings)

#### Inherited from

[`IngredientBase`](IngredientBase.md).[`primaryInFillings`](IngredientBase.md#primaryinfillings)

***

### usedByFillings()

> **usedByFillings**(): [`IFillingRecipe`](../interfaces/IFillingRecipe.md)[]

Defined in: [ts-chocolate/src/packlets/library-runtime/ingredients/ingredientBase.ts:225](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/library-runtime/ingredients/ingredientBase.ts#L225)

Gets all filling recipes that use this ingredient (primary or alternate).

#### Returns

[`IFillingRecipe`](../interfaces/IFillingRecipe.md)[]

#### Implementation of

[`IAlcoholIngredient`](../interfaces/IAlcoholIngredient.md).[`usedByFillings`](../interfaces/IAlcoholIngredient.md#usedbyfillings)

#### Inherited from

[`IngredientBase`](IngredientBase.md).[`usedByFillings`](IngredientBase.md#usedbyfillings)

***

### create()

> `static` **create**(`context`, `id`, `ingredient`): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`AlcoholIngredient`\>

Defined in: [ts-chocolate/src/packlets/library-runtime/ingredients/alcoholIngredient.ts:62](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/library-runtime/ingredients/alcoholIngredient.ts#L62)

Factory method for creating a AlcoholIngredient.

#### Parameters

##### context

[`IIngredientContext`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-chocolate/docs)

The runtime context

##### id

[`IngredientId`](../../../../type-aliases/IngredientId.md)

The ingredient ID

##### ingredient

[`IAlcoholIngredientEntity`](../../Entities/interfaces/IAlcoholIngredientEntity.md)

The raw alcohol ingredient data entity

#### Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`AlcoholIngredient`\>

Success with AlcoholIngredient
