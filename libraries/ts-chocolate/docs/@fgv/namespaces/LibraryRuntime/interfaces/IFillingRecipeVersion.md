[**@fgv/ts-chocolate**](../../../../README.md)

***

[@fgv/ts-chocolate](../../../../README.md) / [LibraryRuntime](../README.md) / IFillingRecipeVersion

# Interface: IFillingRecipeVersion

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:374](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L374)

A resolved runtime view of a recipe version with resolved ingredients.

This interface provides runtime-layer access to version data with:
- Parent recipe reference (both ID and resolved object)
- Resolved ingredient access via flexible filtering
- Ganache calculation

Note: Does not directly extend `IFillingRecipeVersionEntity` because `ingredients` has a different
type (resolved vs entity references).

## Properties

### baseWeight

> `readonly` **baseWeight**: [`Measurement`](../../../../type-aliases/Measurement.md)

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:414](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L414)

Base weight of the recipe (sum of all ingredient amounts).

***

### createdDate

> `readonly` **createdDate**: `string`

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:390](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L390)

Date this version was created (ISO 8601 format).

***

### entity

> `readonly` **entity**: [`IFillingRecipeVersionEntity`](../../Entities/interfaces/IFillingRecipeVersionEntity.md)

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:505](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L505)

Gets the underlying entity version data.

***

### fillingId

> `readonly` **fillingId**: [`FillingId`](../../../../type-aliases/FillingId.md)

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:395](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L395)

The parent filling ID.

***

### fillingRecipe

> `readonly` **fillingRecipe**: [`IFillingRecipe`](IFillingRecipe.md)

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:401](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L401)

The parent filling recipe - resolved.
Enables navigation: `version.fillingRecipe.name`

***

### notes?

> `readonly` `optional` **notes**: readonly [`ICategorizedNote`](../../Model/interfaces/ICategorizedNote.md)[]

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:424](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L424)

Optional notes about this version.

***

### preferredProcedure

> `readonly` **preferredProcedure**: [`IResolvedFillingRecipeProcedure`](IResolvedFillingRecipeProcedure.md) \| `undefined`

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:498](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L498)

Gets the preferred procedure, falling back to first available.

***

### procedures?

> `readonly` `optional` **procedures**: [`IResolvedProcedures`](IResolvedProcedures.md)

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:493](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L493)

Resolved procedures associated with this version.
Undefined if the version has no associated procedures.

***

### ratings

> `readonly` **ratings**: readonly [`IFillingRating`](../../Entities/interfaces/IFillingRating.md)[]

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:429](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L429)

Optional ratings for this version.

***

### version

> `readonly` **version**: [`IFillingRecipeVersionEntity`](../../Entities/interfaces/IFillingRecipeVersionEntity.md)

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:407](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L407)

The underlying filling recipe version.
Use this to get the entity version data for persistence or journaling.

***

### versionId

> `readonly` **versionId**: [`FillingVersionId`](../../../../type-aliases/FillingVersionId.md)

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:380](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L380)

Qualified identifier for this version (recipeId@versionSpec).

***

### versionSpec

> `readonly` **versionSpec**: [`FillingVersionSpec`](../../../../type-aliases/FillingVersionSpec.md)

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:385](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L385)

Version spec portion of the identifier.

***

### yield?

> `readonly` `optional` **yield**: `string`

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:419](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L419)

Optional yield description (e.g., "50 bonbons").

## Methods

### calculateGanache()

> **calculateGanache**(): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`IGanacheCalculation`](IGanacheCalculation.md)\>

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:485](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L485)

Calculates ganache characteristics for this version.

#### Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`IGanacheCalculation`](IGanacheCalculation.md)\>

Success with ganache calculation, or Failure if calculation fails

***

### getIngredients()

> **getIngredients**(`filter?`): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`IterableIterator`\<[`IResolvedFillingIngredient`](IResolvedFillingIngredient.md)\<[`IIngredient`](IIngredient.md)\>, `any`, `any`\>\>

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:466](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L466)

Gets ingredients, optionally filtered.

#### Parameters

##### filter?

[`FillingRecipeIngredientsFilter`](../type-aliases/FillingRecipeIngredientsFilter.md)[]

Optional array of filters (OR semantics)
  - `undefined`/omitted: returns all ingredients
  - Empty array `[]`: returns nothing (empty iterator)
  - Non-empty array: returns ingredients matching at least one filter

Filter types:
  - `string`: Match ingredient ID exactly
  - `RegExp`: Match ingredient ID by pattern
  - `ICategoryFilter`: Match by category (literal or regex)

#### Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`IterableIterator`\<[`IResolvedFillingIngredient`](IResolvedFillingIngredient.md)\<[`IIngredient`](IIngredient.md)\>, `any`, `any`\>\>

Success with matching ingredients iterator, or Failure if resolution fails

#### Example

```typescript
// All ingredients
for (const ri of version.getIngredients().orThrow()) { ... }

// Chocolate ingredients only
version.getIngredients([{ category: 'chocolate' }])

// Multiple specific ingredients
version.getIngredients(['felchlin.maracaibo-65', 'valrhona.guanaja-70'])

// Pattern matching
version.getIngredients([/^felchlin\./])

// Mix of filters (OR semantics)
version.getIngredients(['specific-id', { category: 'dairy' }, /^valrhona\./])
```

***

### usesIngredient()

> **usesIngredient**(`ingredientId`): `boolean`

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:477](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L477)

Checks if this version uses a specific ingredient (as primary).

#### Parameters

##### ingredientId

[`IngredientId`](../../../../type-aliases/IngredientId.md)

The ingredient ID to check

#### Returns

`boolean`

True if the ingredient is used in this version
