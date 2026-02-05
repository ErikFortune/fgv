[**@fgv/ts-chocolate**](../../../../README.md)

***

[@fgv/ts-chocolate](../../../../README.md) / [LibraryRuntime](../README.md) / FillingRecipeQuery

# Class: FillingRecipeQuery

Defined in: [ts-chocolate/src/packlets/library-runtime/queries/fillingRecipeQuery.ts:48](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/queries/fillingRecipeQuery.ts#L48)

Fluent query builder for recipes.
Allows chaining filters to build complex queries.

## Constructors

### Constructor

> **new FillingRecipeQuery**(`context`): `FillingRecipeQuery`

Defined in: [ts-chocolate/src/packlets/library-runtime/queries/fillingRecipeQuery.ts:56](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/queries/fillingRecipeQuery.ts#L56)

Creates a new FillingRecipeQuery.

#### Parameters

##### context

[`LibraryRuntimeContext`](LibraryRuntimeContext.md)

The runtime context to query

#### Returns

`FillingRecipeQuery`

## Methods

### count()

> **count**(): `number`

Defined in: [ts-chocolate/src/packlets/library-runtime/queries/fillingRecipeQuery.ts:322](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/queries/fillingRecipeQuery.ts#L322)

Execute and return count of matching recipes.

#### Returns

`number`

***

### descriptionContains()

> **descriptionContains**(`text`): `FillingRecipeQuery`

Defined in: [ts-chocolate/src/packlets/library-runtime/queries/fillingRecipeQuery.ts:273](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/queries/fillingRecipeQuery.ts#L273)

Search by description (case-insensitive partial match).

#### Parameters

##### text

`string`

Text to search for

#### Returns

`FillingRecipeQuery`

***

### execute()

> **execute**(): readonly [`FillingRecipe`](FillingRecipe.md)[]

Defined in: [ts-chocolate/src/packlets/library-runtime/queries/fillingRecipeQuery.ts:296](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/queries/fillingRecipeQuery.ts#L296)

Execute query and return matching recipes.

#### Returns

readonly [`FillingRecipe`](FillingRecipe.md)[]

***

### exists()

> **exists**(): `boolean`

Defined in: [ts-chocolate/src/packlets/library-runtime/queries/fillingRecipeQuery.ts:335](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/queries/fillingRecipeQuery.ts#L335)

Check if any recipes match the query.

#### Returns

`boolean`

***

### first()

> **first**(): [`FillingRecipe`](FillingRecipe.md) \| `undefined`

Defined in: [ts-chocolate/src/packlets/library-runtime/queries/fillingRecipeQuery.ts:309](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/queries/fillingRecipeQuery.ts#L309)

Execute and return first matching recipe.

#### Returns

[`FillingRecipe`](FillingRecipe.md) \| `undefined`

***

### fromSource()

> **fromSource**(`sourceId`): `FillingRecipeQuery`

Defined in: [ts-chocolate/src/packlets/library-runtime/queries/fillingRecipeQuery.ts:180](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/queries/fillingRecipeQuery.ts#L180)

Filter by source.

#### Parameters

##### sourceId

[`CollectionId`](../../../../type-aliases/CollectionId.md)

Source ID to filter by

#### Returns

`FillingRecipeQuery`

***

### ganacheFatContent()

> **ganacheFatContent**(`min`, `max?`): `FillingRecipeQuery`

Defined in: [ts-chocolate/src/packlets/library-runtime/queries/fillingRecipeQuery.ts:194](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/queries/fillingRecipeQuery.ts#L194)

Filter by ganache fat content range.
Note: Calculates ganache for each recipe, which may be slow for large sets.

#### Parameters

##### min

[`Percentage`](../../../../type-aliases/Percentage.md)

Minimum fat percentage

##### max?

[`Percentage`](../../../../type-aliases/Percentage.md)

Optional maximum fat percentage

#### Returns

`FillingRecipeQuery`

***

### ganacheWithWarnings()

> **ganacheWithWarnings**(): `FillingRecipeQuery`

Defined in: [ts-chocolate/src/packlets/library-runtime/queries/fillingRecipeQuery.ts:226](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/queries/fillingRecipeQuery.ts#L226)

Filter to recipes with ganache warnings (but still valid).

#### Returns

`FillingRecipeQuery`

***

### hasMultipleVersions()

> **hasMultipleVersions**(): `FillingRecipeQuery`

Defined in: [ts-chocolate/src/packlets/library-runtime/queries/fillingRecipeQuery.ts:245](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/queries/fillingRecipeQuery.ts#L245)

Filter to recipes with multiple versions.

#### Returns

`FillingRecipeQuery`

***

### minVersions()

> **minVersions**(`count`): `FillingRecipeQuery`

Defined in: [ts-chocolate/src/packlets/library-runtime/queries/fillingRecipeQuery.ts:253](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/queries/fillingRecipeQuery.ts#L253)

Filter by minimum version count.

#### Parameters

##### count

`number`

Minimum number of versions

#### Returns

`FillingRecipeQuery`

***

### nameContains()

> **nameContains**(`text`): `FillingRecipeQuery`

Defined in: [ts-chocolate/src/packlets/library-runtime/queries/fillingRecipeQuery.ts:265](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/queries/fillingRecipeQuery.ts#L265)

Search by name (case-insensitive partial match).

#### Parameters

##### text

`string`

Text to search for

#### Returns

`FillingRecipeQuery`

***

### validGanache()

> **validGanache**(): `FillingRecipeQuery`

Defined in: [ts-chocolate/src/packlets/library-runtime/queries/fillingRecipeQuery.ts:212](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/queries/fillingRecipeQuery.ts#L212)

Filter to recipes with valid ganache characteristics.

#### Returns

`FillingRecipeQuery`

***

### where()

> **where**(`predicate`): `FillingRecipeQuery`

Defined in: [ts-chocolate/src/packlets/library-runtime/queries/fillingRecipeQuery.ts:285](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/queries/fillingRecipeQuery.ts#L285)

Apply a custom filter predicate.

#### Parameters

##### predicate

[`FillingRecipeFilter`](../type-aliases/FillingRecipeFilter.md)

Custom filter function

#### Returns

`FillingRecipeQuery`

***

### withAllIngredients()

> **withAllIngredients**(`ingredientIds`): `FillingRecipeQuery`

Defined in: [ts-chocolate/src/packlets/library-runtime/queries/fillingRecipeQuery.ts:85](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/queries/fillingRecipeQuery.ts#L85)

Filter to recipes using all of the given ingredients.

#### Parameters

##### ingredientIds

[`IngredientId`](../../../../type-aliases/IngredientId.md)[]

Ingredient IDs that must all be present

#### Returns

`FillingRecipeQuery`

***

### withAllTags()

> **withAllTags**(`tags`): `FillingRecipeQuery`

Defined in: [ts-chocolate/src/packlets/library-runtime/queries/fillingRecipeQuery.ts:168](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/queries/fillingRecipeQuery.ts#L168)

Filter by all of the given tags.

#### Parameters

##### tags

`string`[]

Tags that must all be present

#### Returns

`FillingRecipeQuery`

***

### withAnyIngredient()

> **withAnyIngredient**(`ingredientIds`): `FillingRecipeQuery`

Defined in: [ts-chocolate/src/packlets/library-runtime/queries/fillingRecipeQuery.ts:77](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/queries/fillingRecipeQuery.ts#L77)

Filter to recipes using any of the given ingredients.

#### Parameters

##### ingredientIds

[`IngredientId`](../../../../type-aliases/IngredientId.md)[]

Ingredient IDs to search for

#### Returns

`FillingRecipeQuery`

***

### withAnyTag()

> **withAnyTag**(`tags`): `FillingRecipeQuery`

Defined in: [ts-chocolate/src/packlets/library-runtime/queries/fillingRecipeQuery.ts:160](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/queries/fillingRecipeQuery.ts#L160)

Filter by any of the given tags.

#### Parameters

##### tags

`string`[]

Tags to search for

#### Returns

`FillingRecipeQuery`

***

### withChocolateType()

> **withChocolateType**(`type`): `FillingRecipeQuery`

Defined in: [ts-chocolate/src/packlets/library-runtime/queries/fillingRecipeQuery.ts:134](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/queries/fillingRecipeQuery.ts#L134)

Filter by any chocolate type.
Uses the reverse index for efficiency.

#### Parameters

##### type

[`ChocolateType`](../../../../type-aliases/ChocolateType.md)

Chocolate type to filter by

#### Returns

`FillingRecipeQuery`

***

### withDarkChocolate()

> **withDarkChocolate**(): `FillingRecipeQuery`

Defined in: [ts-chocolate/src/packlets/library-runtime/queries/fillingRecipeQuery.ts:104](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/queries/fillingRecipeQuery.ts#L104)

Filter to recipes containing dark chocolate (in golden version).

#### Returns

`FillingRecipeQuery`

***

### withIngredient()

> **withIngredient**(`ingredientId`): `FillingRecipeQuery`

Defined in: [ts-chocolate/src/packlets/library-runtime/queries/fillingRecipeQuery.ts:69](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/queries/fillingRecipeQuery.ts#L69)

Filter to recipes using a specific ingredient (any version, as primary).

#### Parameters

##### ingredientId

[`IngredientId`](../../../../type-aliases/IngredientId.md)

Ingredient ID to search for

#### Returns

`FillingRecipeQuery`

***

### withMilkChocolate()

> **withMilkChocolate**(): `FillingRecipeQuery`

Defined in: [ts-chocolate/src/packlets/library-runtime/queries/fillingRecipeQuery.ts:111](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/queries/fillingRecipeQuery.ts#L111)

Filter to recipes containing milk chocolate.

#### Returns

`FillingRecipeQuery`

***

### withoutIngredient()

> **withoutIngredient**(`ingredientId`): `FillingRecipeQuery`

Defined in: [ts-chocolate/src/packlets/library-runtime/queries/fillingRecipeQuery.ts:93](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/queries/fillingRecipeQuery.ts#L93)

Filter to recipes NOT using a specific ingredient.

#### Parameters

##### ingredientId

[`IngredientId`](../../../../type-aliases/IngredientId.md)

Ingredient ID that must not be present

#### Returns

`FillingRecipeQuery`

***

### withRubyChocolate()

> **withRubyChocolate**(): `FillingRecipeQuery`

Defined in: [ts-chocolate/src/packlets/library-runtime/queries/fillingRecipeQuery.ts:125](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/queries/fillingRecipeQuery.ts#L125)

Filter to recipes containing ruby chocolate.

#### Returns

`FillingRecipeQuery`

***

### withTag()

> **withTag**(`tag`): `FillingRecipeQuery`

Defined in: [ts-chocolate/src/packlets/library-runtime/queries/fillingRecipeQuery.ts:152](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/queries/fillingRecipeQuery.ts#L152)

Filter by tag.

#### Parameters

##### tag

`string`

Tag to search for (case-insensitive)

#### Returns

`FillingRecipeQuery`

***

### withWhiteChocolate()

> **withWhiteChocolate**(): `FillingRecipeQuery`

Defined in: [ts-chocolate/src/packlets/library-runtime/queries/fillingRecipeQuery.ts:118](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/queries/fillingRecipeQuery.ts#L118)

Filter to recipes containing white chocolate.

#### Returns

`FillingRecipeQuery`
