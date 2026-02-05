[**@fgv/ts-chocolate**](../../../../README.md)

***

[@fgv/ts-chocolate](../../../../README.md) / [LibraryRuntime](../README.md) / IngredientQuery

# Class: IngredientQuery

Defined in: [ts-chocolate/src/packlets/library-runtime/queries/ingredientQuery.ts:60](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/queries/ingredientQuery.ts#L60)

Fluent query builder for ingredients.
Allows chaining filters to build complex queries.

## Constructors

### Constructor

> **new IngredientQuery**(`context`): `IngredientQuery`

Defined in: [ts-chocolate/src/packlets/library-runtime/queries/ingredientQuery.ts:68](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/queries/ingredientQuery.ts#L68)

Creates a new IngredientQuery.

#### Parameters

##### context

[`LibraryRuntimeContext`](LibraryRuntimeContext.md)

The runtime context to query

#### Returns

`IngredientQuery`

## Methods

### alcohol()

> **alcohol**(): `IngredientQuery`

Defined in: [ts-chocolate/src/packlets/library-runtime/queries/ingredientQuery.ts:108](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/queries/ingredientQuery.ts#L108)

Filter to only alcohol ingredients.

#### Returns

`IngredientQuery`

***

### byManufacturer()

> **byManufacturer**(`manufacturer`): `IngredientQuery`

Defined in: [ts-chocolate/src/packlets/library-runtime/queries/ingredientQuery.ts:273](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/queries/ingredientQuery.ts#L273)

Filter by manufacturer.

#### Parameters

##### manufacturer

`string`

Manufacturer name (case-insensitive partial match)

#### Returns

`IngredientQuery`

***

### cacaoRange()

> **cacaoRange**(`min`, `max`): `IngredientQuery`

Defined in: [ts-chocolate/src/packlets/library-runtime/queries/ingredientQuery.ts:161](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/queries/ingredientQuery.ts#L161)

Filter by cacao percentage range.

#### Parameters

##### min

[`Percentage`](../../../../type-aliases/Percentage.md)

Minimum cacao percentage

##### max

[`Percentage`](../../../../type-aliases/Percentage.md)

Maximum cacao percentage

#### Returns

`IngredientQuery`

***

### category()

> **category**(`category`): `IngredientQuery`

Defined in: [ts-chocolate/src/packlets/library-runtime/queries/ingredientQuery.ts:116](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/queries/ingredientQuery.ts#L116)

Filter by specific category.

#### Parameters

##### category

[`IngredientCategory`](../../../../type-aliases/IngredientCategory.md)

The category to filter by

#### Returns

`IngredientQuery`

***

### chocolate()

> **chocolate**(): `IngredientQuery`

Defined in: [ts-chocolate/src/packlets/library-runtime/queries/ingredientQuery.ts:80](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/queries/ingredientQuery.ts#L80)

Filter to only chocolate ingredients.

#### Returns

`IngredientQuery`

***

### chocolateType()

> **chocolateType**(`type`): `IngredientQuery`

Defined in: [ts-chocolate/src/packlets/library-runtime/queries/ingredientQuery.ts:129](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/queries/ingredientQuery.ts#L129)

Filter by chocolate type.
Note: Automatically filters to chocolate category.

#### Parameters

##### type

[`ChocolateType`](../../../../type-aliases/ChocolateType.md)

The chocolate type to filter by

#### Returns

`IngredientQuery`

***

### count()

> **count**(): `number`

Defined in: [ts-chocolate/src/packlets/library-runtime/queries/ingredientQuery.ts:413](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/queries/ingredientQuery.ts#L413)

Execute and return count of matching ingredients.

#### Returns

`number`

***

### dairy()

> **dairy**(): `IngredientQuery`

Defined in: [ts-chocolate/src/packlets/library-runtime/queries/ingredientQuery.ts:87](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/queries/ingredientQuery.ts#L87)

Filter to only dairy ingredients.

#### Returns

`IngredientQuery`

***

### descriptionContains()

> **descriptionContains**(`text`): `IngredientQuery`

Defined in: [ts-chocolate/src/packlets/library-runtime/queries/ingredientQuery.ts:365](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/queries/ingredientQuery.ts#L365)

Search by description (case-insensitive partial match).

#### Parameters

##### text

`string`

Text to search for

#### Returns

`IngredientQuery`

***

### execute()

> **execute**(): readonly [`AnyIngredient`](../type-aliases/AnyIngredient.md)[]

Defined in: [ts-chocolate/src/packlets/library-runtime/queries/ingredientQuery.ts:388](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/queries/ingredientQuery.ts#L388)

Execute query and return matching ingredients.

#### Returns

readonly [`AnyIngredient`](../type-aliases/AnyIngredient.md)[]

***

### exists()

> **exists**(): `boolean`

Defined in: [ts-chocolate/src/packlets/library-runtime/queries/ingredientQuery.ts:426](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/queries/ingredientQuery.ts#L426)

Check if any ingredients match the query.

#### Returns

`boolean`

***

### fat()

> **fat**(): `IngredientQuery`

Defined in: [ts-chocolate/src/packlets/library-runtime/queries/ingredientQuery.ts:101](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/queries/ingredientQuery.ts#L101)

Filter to only fat ingredients.

#### Returns

`IngredientQuery`

***

### fatRange()

> **fatRange**(`min`, `max`): `IngredientQuery`

Defined in: [ts-chocolate/src/packlets/library-runtime/queries/ingredientQuery.ts:216](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/queries/ingredientQuery.ts#L216)

Filter by fat content range.

#### Parameters

##### min

[`Percentage`](../../../../type-aliases/Percentage.md)

Minimum percentage

##### max

[`Percentage`](../../../../type-aliases/Percentage.md)

Maximum percentage

#### Returns

`IngredientQuery`

***

### first()

> **first**(): [`AnyIngredient`](../type-aliases/AnyIngredient.md) \| `undefined`

Defined in: [ts-chocolate/src/packlets/library-runtime/queries/ingredientQuery.ts:401](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/queries/ingredientQuery.ts#L401)

Execute and return first matching ingredient.

#### Returns

[`AnyIngredient`](../type-aliases/AnyIngredient.md) \| `undefined`

***

### forApplication()

> **forApplication**(`application`): `IngredientQuery`

Defined in: [ts-chocolate/src/packlets/library-runtime/queries/ingredientQuery.ts:173](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/queries/ingredientQuery.ts#L173)

Filter by chocolate application.

#### Parameters

##### application

[`ChocolateApplication`](../../../../type-aliases/ChocolateApplication.md)

The application to filter by

#### Returns

`IngredientQuery`

***

### fromSource()

> **fromSource**(`sourceId`): `IngredientQuery`

Defined in: [ts-chocolate/src/packlets/library-runtime/queries/ingredientQuery.ts:281](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/queries/ingredientQuery.ts#L281)

Filter by source.

#### Parameters

##### sourceId

[`CollectionId`](../../../../type-aliases/CollectionId.md)

Source ID to filter by

#### Returns

`IngredientQuery`

***

### maxCacao()

> **maxCacao**(`percentage`): `IngredientQuery`

Defined in: [ts-chocolate/src/packlets/library-runtime/queries/ingredientQuery.ts:149](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/queries/ingredientQuery.ts#L149)

Filter by maximum cacao percentage.

#### Parameters

##### percentage

[`Percentage`](../../../../type-aliases/Percentage.md)

Maximum cacao percentage

#### Returns

`IngredientQuery`

***

### maxFat()

> **maxFat**(`max`): `IngredientQuery`

Defined in: [ts-chocolate/src/packlets/library-runtime/queries/ingredientQuery.ts:202](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/queries/ingredientQuery.ts#L202)

Filter by maximum fat content.

#### Parameters

##### max

[`Percentage`](../../../../type-aliases/Percentage.md)

Maximum total fat percentage

#### Returns

`IngredientQuery`

***

### maxWater()

> **maxWater**(`max`): `IngredientQuery`

Defined in: [ts-chocolate/src/packlets/library-runtime/queries/ingredientQuery.ts:229](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/queries/ingredientQuery.ts#L229)

Filter by maximum water content.

#### Parameters

##### max

[`Percentage`](../../../../type-aliases/Percentage.md)

Maximum water percentage

#### Returns

`IngredientQuery`

***

### minCacao()

> **minCacao**(`percentage`): `IngredientQuery`

Defined in: [ts-chocolate/src/packlets/library-runtime/queries/ingredientQuery.ts:138](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/queries/ingredientQuery.ts#L138)

Filter by minimum cacao percentage.
Note: Only applies to chocolate ingredients.

#### Parameters

##### percentage

[`Percentage`](../../../../type-aliases/Percentage.md)

Minimum cacao percentage

#### Returns

`IngredientQuery`

***

### minFat()

> **minFat**(`min`): `IngredientQuery`

Defined in: [ts-chocolate/src/packlets/library-runtime/queries/ingredientQuery.ts:189](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/queries/ingredientQuery.ts#L189)

Filter by minimum fat content (cacaoFat + milkFat + otherFats).

#### Parameters

##### min

[`Percentage`](../../../../type-aliases/Percentage.md)

Minimum total fat percentage

#### Returns

`IngredientQuery`

***

### minWater()

> **minWater**(`min`): `IngredientQuery`

Defined in: [ts-chocolate/src/packlets/library-runtime/queries/ingredientQuery.ts:237](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/queries/ingredientQuery.ts#L237)

Filter by minimum water content.

#### Parameters

##### min

[`Percentage`](../../../../type-aliases/Percentage.md)

Minimum water percentage

#### Returns

`IngredientQuery`

***

### nameContains()

> **nameContains**(`text`): `IngredientQuery`

Defined in: [ts-chocolate/src/packlets/library-runtime/queries/ingredientQuery.ts:357](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/queries/ingredientQuery.ts#L357)

Search by name (case-insensitive partial match).

#### Parameters

##### text

`string`

Text to search for

#### Returns

`IngredientQuery`

***

### sugar()

> **sugar**(): `IngredientQuery`

Defined in: [ts-chocolate/src/packlets/library-runtime/queries/ingredientQuery.ts:94](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/queries/ingredientQuery.ts#L94)

Filter to only sugar ingredients.

#### Returns

`IngredientQuery`

***

### unused()

> **unused**(): `IngredientQuery`

Defined in: [ts-chocolate/src/packlets/library-runtime/queries/ingredientQuery.ts:337](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/queries/ingredientQuery.ts#L337)

Filter to ingredients not used in any filling recipe.

#### Returns

`IngredientQuery`

***

### usedInAtLeast()

> **usedInAtLeast**(`count`): `IngredientQuery`

Defined in: [ts-chocolate/src/packlets/library-runtime/queries/ingredientQuery.ts:345](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/queries/ingredientQuery.ts#L345)

Filter to ingredients used in at least N filling recipes.

#### Parameters

##### count

`number`

Minimum number of filling recipes

#### Returns

`IngredientQuery`

***

### usedInFillings()

> **usedInFillings**(): `IngredientQuery`

Defined in: [ts-chocolate/src/packlets/library-runtime/queries/ingredientQuery.ts:330](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/queries/ingredientQuery.ts#L330)

Filter to ingredients used in at least one filling recipe.

#### Returns

`IngredientQuery`

***

### vegan()

> **vegan**(): `IngredientQuery`

Defined in: [ts-chocolate/src/packlets/library-runtime/queries/ingredientQuery.ts:292](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/queries/ingredientQuery.ts#L292)

Filter to only vegan ingredients.

#### Returns

`IngredientQuery`

***

### where()

> **where**(`predicate`): `IngredientQuery`

Defined in: [ts-chocolate/src/packlets/library-runtime/queries/ingredientQuery.ts:377](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/queries/ingredientQuery.ts#L377)

Apply a custom filter predicate.

#### Parameters

##### predicate

[`IngredientFilter`](../type-aliases/IngredientFilter.md)

Custom filter function

#### Returns

`IngredientQuery`

***

### withAllTags()

> **withAllTags**(`tags`): `IngredientQuery`

Defined in: [ts-chocolate/src/packlets/library-runtime/queries/ingredientQuery.ts:265](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/queries/ingredientQuery.ts#L265)

Filter by all of the given tags.

#### Parameters

##### tags

`string`[]

Tags that must all be present

#### Returns

`IngredientQuery`

***

### withAnyTag()

> **withAnyTag**(`tags`): `IngredientQuery`

Defined in: [ts-chocolate/src/packlets/library-runtime/queries/ingredientQuery.ts:257](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/queries/ingredientQuery.ts#L257)

Filter by any of the given tags.

#### Parameters

##### tags

`string`[]

Tags to search for

#### Returns

`IngredientQuery`

***

### withCertification()

> **withCertification**(`certification`): `IngredientQuery`

Defined in: [ts-chocolate/src/packlets/library-runtime/queries/ingredientQuery.ts:319](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/queries/ingredientQuery.ts#L319)

Filter by certification.

#### Parameters

##### certification

[`Certification`](../../../../type-aliases/Certification.md)

Certification that must be present

#### Returns

`IngredientQuery`

***

### withoutAllergen()

> **withoutAllergen**(`allergen`): `IngredientQuery`

Defined in: [ts-chocolate/src/packlets/library-runtime/queries/ingredientQuery.ts:300](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/queries/ingredientQuery.ts#L300)

Filter to ingredients without specific allergen.

#### Parameters

##### allergen

[`Allergen`](../../../../type-aliases/Allergen.md)

Allergen that must not be present

#### Returns

`IngredientQuery`

***

### withoutAllergens()

> **withoutAllergens**(`allergens`): `IngredientQuery`

Defined in: [ts-chocolate/src/packlets/library-runtime/queries/ingredientQuery.ts:308](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/queries/ingredientQuery.ts#L308)

Filter to ingredients without any of the specified allergens.

#### Parameters

##### allergens

[`Allergen`](../../../../type-aliases/Allergen.md)[]

Allergens that must not be present

#### Returns

`IngredientQuery`

***

### withTag()

> **withTag**(`tag`): `IngredientQuery`

Defined in: [ts-chocolate/src/packlets/library-runtime/queries/ingredientQuery.ts:249](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/queries/ingredientQuery.ts#L249)

Filter by tag (ingredient has this tag).

#### Parameters

##### tag

`string`

Tag to search for (case-insensitive)

#### Returns

`IngredientQuery`
