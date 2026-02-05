[**@fgv/ts-chocolate**](../../../../README.md)

***

[@fgv/ts-chocolate](../../../../README.md) / [LibraryRuntime](../README.md) / SugarIngredient

# Class: SugarIngredient

Defined in: [ts-chocolate/src/packlets/library-runtime/ingredients/sugarIngredient.ts:42](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/ingredients/sugarIngredient.ts#L42)

A resolved view of a sugar ingredient with navigation capabilities.
Immutable - does not allow modification of underlying data.

## Extends

- [`IngredientBase`](IngredientBase.md)

## Implements

- [`ISugarIngredient`](../interfaces/ISugarIngredient.md)

## Properties

### \_baseId

> `protected` `readonly` **\_baseId**: [`BaseIngredientId`](../../../../type-aliases/BaseIngredientId.md)

Defined in: [ts-chocolate/src/packlets/library-runtime/ingredients/ingredientBase.ts:59](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/ingredients/ingredientBase.ts#L59)

#### Inherited from

[`IngredientBase`](IngredientBase.md).[`_baseId`](IngredientBase.md#_baseid)

***

### \_context

> `protected` `readonly` **\_context**: [`IIngredientContext`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-chocolate/docs)

Defined in: [ts-chocolate/src/packlets/library-runtime/ingredients/ingredientBase.ts:55](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/ingredients/ingredientBase.ts#L55)

#### Inherited from

[`IngredientBase`](IngredientBase.md).[`_context`](IngredientBase.md#_context)

***

### \_id

> `protected` `readonly` **\_id**: [`IngredientId`](../../../../type-aliases/IngredientId.md)

Defined in: [ts-chocolate/src/packlets/library-runtime/ingredients/ingredientBase.ts:56](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/ingredients/ingredientBase.ts#L56)

#### Inherited from

[`IngredientBase`](IngredientBase.md).[`_id`](IngredientBase.md#_id)

***

### \_ingredient

> `protected` `readonly` **\_ingredient**: [`IngredientEntity`](../../Entities/type-aliases/IngredientEntity.md)

Defined in: [ts-chocolate/src/packlets/library-runtime/ingredients/ingredientBase.ts:57](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/ingredients/ingredientBase.ts#L57)

#### Inherited from

[`IngredientBase`](IngredientBase.md).[`_ingredient`](IngredientBase.md#_ingredient)

***

### \_sourceId

> `protected` `readonly` **\_sourceId**: [`CollectionId`](../../../../type-aliases/CollectionId.md)

Defined in: [ts-chocolate/src/packlets/library-runtime/ingredients/ingredientBase.ts:58](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/ingredients/ingredientBase.ts#L58)

#### Inherited from

[`IngredientBase`](IngredientBase.md).[`_sourceId`](IngredientBase.md#_sourceid)

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

[`ISugarIngredient`](../interfaces/ISugarIngredient.md).[`allergens`](../interfaces/ISugarIngredient.md#allergens)

#### Inherited from

[`IngredientBase`](IngredientBase.md).[`allergens`](IngredientBase.md#allergens)

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

[`ISugarIngredient`](../interfaces/ISugarIngredient.md).[`baseId`](../interfaces/ISugarIngredient.md#baseid)

#### Inherited from

[`IngredientBase`](IngredientBase.md).[`baseId`](IngredientBase.md#baseid)

***

### category

#### Get Signature

> **get** **category**(): `"sugar"`

Defined in: [ts-chocolate/src/packlets/library-runtime/ingredients/sugarIngredient.ts:77](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/ingredients/sugarIngredient.ts#L77)

Category is always 'sugar' for this type

##### Returns

`"sugar"`

Category is always sugar for this type

#### Implementation of

[`ISugarIngredient`](../interfaces/ISugarIngredient.md).[`category`](../interfaces/ISugarIngredient.md#category)

#### Overrides

[`IngredientBase`](IngredientBase.md).[`category`](IngredientBase.md#category)

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

[`ISugarIngredient`](../interfaces/ISugarIngredient.md).[`certifications`](../interfaces/ISugarIngredient.md#certifications)

#### Inherited from

[`IngredientBase`](IngredientBase.md).[`certifications`](IngredientBase.md#certifications)

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

[`ISugarIngredient`](../interfaces/ISugarIngredient.md).[`collectionId`](../interfaces/ISugarIngredient.md#collectionid)

#### Inherited from

[`IngredientBase`](IngredientBase.md).[`collectionId`](IngredientBase.md#collectionid)

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

[`ISugarIngredient`](../interfaces/ISugarIngredient.md).[`description`](../interfaces/ISugarIngredient.md#description)

#### Inherited from

[`IngredientBase`](IngredientBase.md).[`description`](IngredientBase.md#description)

***

### entity

#### Get Signature

> **get** **entity**(): [`ISugarIngredientEntity`](../../Entities/interfaces/ISugarIngredientEntity.md)

Defined in: [ts-chocolate/src/packlets/library-runtime/ingredients/sugarIngredient.ts:102](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/ingredients/sugarIngredient.ts#L102)

Gets the underlying sugar ingredient data entity

##### Returns

[`ISugarIngredientEntity`](../../Entities/interfaces/ISugarIngredientEntity.md)

Gets the underlying ingredient entity data.

#### Implementation of

[`ISugarIngredient`](../interfaces/ISugarIngredient.md).[`entity`](../interfaces/ISugarIngredient.md#entity)

#### Overrides

[`IngredientBase`](IngredientBase.md).[`entity`](IngredientBase.md#entity)

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

[`ISugarIngredient`](../interfaces/ISugarIngredient.md).[`ganacheCharacteristics`](../interfaces/ISugarIngredient.md#ganachecharacteristics)

#### Inherited from

[`IngredientBase`](IngredientBase.md).[`ganacheCharacteristics`](IngredientBase.md#ganachecharacteristics)

***

### hydrationNumber

#### Get Signature

> **get** **hydrationNumber**(): `number` \| `undefined`

Defined in: [ts-chocolate/src/packlets/library-runtime/ingredients/sugarIngredient.ts:88](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/ingredients/sugarIngredient.ts#L88)

Hydration number (water molecules per sugar molecule) (optional)

##### Returns

`number` \| `undefined`

Hydration number (water molecules per sugar molecule)

#### Implementation of

[`ISugarIngredient`](../interfaces/ISugarIngredient.md).[`hydrationNumber`](../interfaces/ISugarIngredient.md#hydrationnumber)

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

[`ISugarIngredient`](../interfaces/ISugarIngredient.md).[`id`](../interfaces/ISugarIngredient.md#id)

#### Inherited from

[`IngredientBase`](IngredientBase.md).[`id`](IngredientBase.md#id)

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

[`ISugarIngredient`](../interfaces/ISugarIngredient.md).[`manufacturer`](../interfaces/ISugarIngredient.md#manufacturer)

#### Inherited from

[`IngredientBase`](IngredientBase.md).[`manufacturer`](IngredientBase.md#manufacturer)

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

[`ISugarIngredient`](../interfaces/ISugarIngredient.md).[`name`](../interfaces/ISugarIngredient.md#name)

#### Inherited from

[`IngredientBase`](IngredientBase.md).[`name`](IngredientBase.md#name)

***

### sweetnessPotency

#### Get Signature

> **get** **sweetnessPotency**(): `number` \| `undefined`

Defined in: [ts-chocolate/src/packlets/library-runtime/ingredients/sugarIngredient.ts:95](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/ingredients/sugarIngredient.ts#L95)

Sweetness potency relative to sucrose (1.0 = sucrose) (optional)

##### Returns

`number` \| `undefined`

Sweetness potency relative to sucrose (1.0 = sucrose)

#### Implementation of

[`ISugarIngredient`](../interfaces/ISugarIngredient.md).[`sweetnessPotency`](../interfaces/ISugarIngredient.md#sweetnesspotency)

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

[`ISugarIngredient`](../interfaces/ISugarIngredient.md).[`tags`](../interfaces/ISugarIngredient.md#tags)

#### Inherited from

[`IngredientBase`](IngredientBase.md).[`tags`](IngredientBase.md#tags)

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

[`ISugarIngredient`](../interfaces/ISugarIngredient.md).[`traceAllergens`](../interfaces/ISugarIngredient.md#traceallergens)

#### Inherited from

[`IngredientBase`](IngredientBase.md).[`traceAllergens`](IngredientBase.md#traceallergens)

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

[`ISugarIngredient`](../interfaces/ISugarIngredient.md).[`vegan`](../interfaces/ISugarIngredient.md#vegan)

#### Inherited from

[`IngredientBase`](IngredientBase.md).[`vegan`](IngredientBase.md#vegan)

## Methods

### alternateInFillings()

> **alternateInFillings**(): [`IFillingRecipe`](../interfaces/IFillingRecipe.md)[]

Defined in: [ts-chocolate/src/packlets/library-runtime/ingredients/ingredientBase.ts:236](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/ingredients/ingredientBase.ts#L236)

Gets filling recipes where this ingredient is listed as an alternate.

#### Returns

[`IFillingRecipe`](../interfaces/IFillingRecipe.md)[]

#### Implementation of

[`ISugarIngredient`](../interfaces/ISugarIngredient.md).[`alternateInFillings`](../interfaces/ISugarIngredient.md#alternateinfillings)

#### Inherited from

[`IngredientBase`](IngredientBase.md).[`alternateInFillings`](IngredientBase.md#alternateinfillings)

***

### isAlcohol()

> **isAlcohol**(): `this is AlcoholIngredient`

Defined in: [ts-chocolate/src/packlets/library-runtime/ingredients/ingredientBase.ts:211](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/ingredients/ingredientBase.ts#L211)

Returns true if this is an alcohol ingredient.

#### Returns

`this is AlcoholIngredient`

#### Implementation of

[`ISugarIngredient`](../interfaces/ISugarIngredient.md).[`isAlcohol`](../interfaces/ISugarIngredient.md#isalcohol)

#### Inherited from

[`IngredientBase`](IngredientBase.md).[`isAlcohol`](IngredientBase.md#isalcohol)

***

### isChocolate()

> **isChocolate**(): `this is ChocolateIngredient`

Defined in: [ts-chocolate/src/packlets/library-runtime/ingredients/ingredientBase.ts:183](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/ingredients/ingredientBase.ts#L183)

Returns true if this is a chocolate ingredient.

#### Returns

`this is ChocolateIngredient`

#### Implementation of

[`ISugarIngredient`](../interfaces/ISugarIngredient.md).[`isChocolate`](../interfaces/ISugarIngredient.md#ischocolate)

#### Inherited from

[`IngredientBase`](IngredientBase.md).[`isChocolate`](IngredientBase.md#ischocolate)

***

### isDairy()

> **isDairy**(): `this is DairyIngredient`

Defined in: [ts-chocolate/src/packlets/library-runtime/ingredients/ingredientBase.ts:190](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/ingredients/ingredientBase.ts#L190)

Returns true if this is a dairy ingredient.

#### Returns

`this is DairyIngredient`

#### Implementation of

[`ISugarIngredient`](../interfaces/ISugarIngredient.md).[`isDairy`](../interfaces/ISugarIngredient.md#isdairy)

#### Inherited from

[`IngredientBase`](IngredientBase.md).[`isDairy`](IngredientBase.md#isdairy)

***

### isFat()

> **isFat**(): `this is FatIngredient`

Defined in: [ts-chocolate/src/packlets/library-runtime/ingredients/ingredientBase.ts:204](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/ingredients/ingredientBase.ts#L204)

Returns true if this is a fat ingredient.

#### Returns

`this is FatIngredient`

#### Implementation of

[`ISugarIngredient`](../interfaces/ISugarIngredient.md).[`isFat`](../interfaces/ISugarIngredient.md#isfat)

#### Inherited from

[`IngredientBase`](IngredientBase.md).[`isFat`](IngredientBase.md#isfat)

***

### isSugar()

> **isSugar**(): `this is SugarIngredient`

Defined in: [ts-chocolate/src/packlets/library-runtime/ingredients/ingredientBase.ts:197](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/ingredients/ingredientBase.ts#L197)

Returns true if this is a sugar ingredient.

#### Returns

`this is SugarIngredient`

#### Implementation of

[`ISugarIngredient`](../interfaces/ISugarIngredient.md).[`isSugar`](../interfaces/ISugarIngredient.md#issugar)

#### Inherited from

[`IngredientBase`](IngredientBase.md).[`isSugar`](IngredientBase.md#issugar)

***

### primaryInFillings()

> **primaryInFillings**(): [`IFillingRecipe`](../interfaces/IFillingRecipe.md)[]

Defined in: [ts-chocolate/src/packlets/library-runtime/ingredients/ingredientBase.ts:229](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/ingredients/ingredientBase.ts#L229)

Gets filling recipes where this ingredient is the primary choice.

#### Returns

[`IFillingRecipe`](../interfaces/IFillingRecipe.md)[]

#### Implementation of

[`ISugarIngredient`](../interfaces/ISugarIngredient.md).[`primaryInFillings`](../interfaces/ISugarIngredient.md#primaryinfillings)

#### Inherited from

[`IngredientBase`](IngredientBase.md).[`primaryInFillings`](IngredientBase.md#primaryinfillings)

***

### usedByFillings()

> **usedByFillings**(): [`IFillingRecipe`](../interfaces/IFillingRecipe.md)[]

Defined in: [ts-chocolate/src/packlets/library-runtime/ingredients/ingredientBase.ts:222](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/ingredients/ingredientBase.ts#L222)

Gets all filling recipes that use this ingredient (primary or alternate).

#### Returns

[`IFillingRecipe`](../interfaces/IFillingRecipe.md)[]

#### Implementation of

[`ISugarIngredient`](../interfaces/ISugarIngredient.md).[`usedByFillings`](../interfaces/ISugarIngredient.md#usedbyfillings)

#### Inherited from

[`IngredientBase`](IngredientBase.md).[`usedByFillings`](IngredientBase.md#usedbyfillings)

***

### create()

> `static` **create**(`context`, `id`, `ingredient`): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`SugarIngredient`\>

Defined in: [ts-chocolate/src/packlets/library-runtime/ingredients/sugarIngredient.ts:62](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/ingredients/sugarIngredient.ts#L62)

Factory method for creating a SugarIngredient.

#### Parameters

##### context

[`IIngredientContext`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-chocolate/docs)

The runtime context

##### id

[`IngredientId`](../../../../type-aliases/IngredientId.md)

The ingredient ID

##### ingredient

[`ISugarIngredientEntity`](../../Entities/interfaces/ISugarIngredientEntity.md)

The sugar ingredient data entity

#### Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`SugarIngredient`\>

Success with SugarIngredient
