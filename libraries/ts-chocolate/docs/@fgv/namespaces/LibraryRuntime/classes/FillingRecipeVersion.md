[**@fgv/ts-chocolate**](../../../../README.md)

***

[@fgv/ts-chocolate](../../../../README.md) / [LibraryRuntime](../README.md) / FillingRecipeVersion

# Class: FillingRecipeVersion

Defined in: [ts-chocolate/src/packlets/library-runtime/fillings/fillingRecipeVersion.ts:106](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/library-runtime/fillings/fillingRecipeVersion.ts#L106)

A resolved view of a recipe version with all ingredients resolved.

## Implements

- [`IFillingRecipeVersion`](../interfaces/IFillingRecipeVersion.md)

## Accessors

### baseWeight

#### Get Signature

> **get** **baseWeight**(): [`Measurement`](../../../../type-aliases/Measurement.md)

Defined in: [ts-chocolate/src/packlets/library-runtime/fillings/fillingRecipeVersion.ts:202](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/library-runtime/fillings/fillingRecipeVersion.ts#L202)

Base weight of the recipe (sum of all ingredient amounts)

##### Returns

[`Measurement`](../../../../type-aliases/Measurement.md)

Base weight of the recipe (sum of all ingredient amounts).

#### Implementation of

[`IFillingRecipeVersion`](../interfaces/IFillingRecipeVersion.md).[`baseWeight`](../interfaces/IFillingRecipeVersion.md#baseweight)

***

### createdDate

#### Get Signature

> **get** **createdDate**(): `string`

Defined in: [ts-chocolate/src/packlets/library-runtime/fillings/fillingRecipeVersion.ts:164](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/library-runtime/fillings/fillingRecipeVersion.ts#L164)

Date this version was created (ISO 8601 format)

##### Returns

`string`

Date this version was created (ISO 8601 format).

#### Implementation of

[`IFillingRecipeVersion`](../interfaces/IFillingRecipeVersion.md).[`createdDate`](../interfaces/IFillingRecipeVersion.md#createddate)

***

### entity

#### Get Signature

> **get** **entity**(): [`IFillingRecipeVersionEntity`](../../Entities/interfaces/IFillingRecipeVersionEntity.md)

Defined in: [ts-chocolate/src/packlets/library-runtime/fillings/fillingRecipeVersion.ts:410](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/library-runtime/fillings/fillingRecipeVersion.ts#L410)

Gets the underlying version entity data

##### Returns

[`IFillingRecipeVersionEntity`](../../Entities/interfaces/IFillingRecipeVersionEntity.md)

Gets the underlying entity version data.

#### Implementation of

[`IFillingRecipeVersion`](../interfaces/IFillingRecipeVersion.md).[`entity`](../interfaces/IFillingRecipeVersion.md#entity)

***

### fillingId

#### Get Signature

> **get** **fillingId**(): [`FillingId`](../../../../type-aliases/FillingId.md)

Defined in: [ts-chocolate/src/packlets/library-runtime/fillings/fillingRecipeVersion.ts:171](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/library-runtime/fillings/fillingRecipeVersion.ts#L171)

The parent filling ID

##### Returns

[`FillingId`](../../../../type-aliases/FillingId.md)

The parent filling ID.

#### Implementation of

[`IFillingRecipeVersion`](../interfaces/IFillingRecipeVersion.md).[`fillingId`](../interfaces/IFillingRecipeVersion.md#fillingid)

***

### fillingRecipe

#### Get Signature

> **get** **fillingRecipe**(): [`IFillingRecipe`](../interfaces/IFillingRecipe.md)

Defined in: [ts-chocolate/src/packlets/library-runtime/fillings/fillingRecipeVersion.ts:179](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/library-runtime/fillings/fillingRecipeVersion.ts#L179)

The parent filling recipe - resolved.
Enables navigation: `version.fillingRecipe.name`

##### Returns

[`IFillingRecipe`](../interfaces/IFillingRecipe.md)

The parent filling recipe - resolved.
Enables navigation: `version.fillingRecipe.name`

#### Implementation of

[`IFillingRecipeVersion`](../interfaces/IFillingRecipeVersion.md).[`fillingRecipe`](../interfaces/IFillingRecipeVersion.md#fillingrecipe)

***

### notes

#### Get Signature

> **get** **notes**(): readonly [`ICategorizedNote`](../../Model/interfaces/ICategorizedNote.md)[] \| `undefined`

Defined in: [ts-chocolate/src/packlets/library-runtime/fillings/fillingRecipeVersion.ts:216](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/library-runtime/fillings/fillingRecipeVersion.ts#L216)

Optional categorized notes about this version

##### Returns

readonly [`ICategorizedNote`](../../Model/interfaces/ICategorizedNote.md)[] \| `undefined`

Optional notes about this version.

#### Implementation of

[`IFillingRecipeVersion`](../interfaces/IFillingRecipeVersion.md).[`notes`](../interfaces/IFillingRecipeVersion.md#notes)

***

### preferredProcedure

#### Get Signature

> **get** **preferredProcedure**(): [`IResolvedFillingRecipeProcedure`](../interfaces/IResolvedFillingRecipeProcedure.md) \| `undefined`

Defined in: [ts-chocolate/src/packlets/library-runtime/fillings/fillingRecipeVersion.ts:346](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/library-runtime/fillings/fillingRecipeVersion.ts#L346)

Gets the preferred procedure, falling back to first available.

##### Returns

[`IResolvedFillingRecipeProcedure`](../interfaces/IResolvedFillingRecipeProcedure.md) \| `undefined`

Gets the preferred procedure, falling back to first available.

#### Implementation of

[`IFillingRecipeVersion`](../interfaces/IFillingRecipeVersion.md).[`preferredProcedure`](../interfaces/IFillingRecipeVersion.md#preferredprocedure)

***

### procedures

#### Get Signature

> **get** **procedures**(): [`IResolvedProcedures`](../interfaces/IResolvedProcedures.md) \| `undefined`

Defined in: [ts-chocolate/src/packlets/library-runtime/fillings/fillingRecipeVersion.ts:330](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/library-runtime/fillings/fillingRecipeVersion.ts#L330)

Resolved procedures associated with this version.
Undefined if the version has no associated procedures.
Resolved lazily on first access.

##### Returns

[`IResolvedProcedures`](../interfaces/IResolvedProcedures.md) \| `undefined`

Resolved procedures associated with this version.
Undefined if the version has no associated procedures.

#### Implementation of

[`IFillingRecipeVersion`](../interfaces/IFillingRecipeVersion.md).[`procedures`](../interfaces/IFillingRecipeVersion.md#procedures)

***

### ratings

#### Get Signature

> **get** **ratings**(): readonly [`IFillingRating`](../../Entities/interfaces/IFillingRating.md)[]

Defined in: [ts-chocolate/src/packlets/library-runtime/fillings/fillingRecipeVersion.ts:223](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/library-runtime/fillings/fillingRecipeVersion.ts#L223)

Optional ratings for this version

##### Returns

readonly [`IFillingRating`](../../Entities/interfaces/IFillingRating.md)[]

Optional ratings for this version.

#### Implementation of

[`IFillingRecipeVersion`](../interfaces/IFillingRecipeVersion.md).[`ratings`](../interfaces/IFillingRecipeVersion.md#ratings)

***

### version

#### Get Signature

> **get** **version**(): [`IFillingRecipeVersionEntity`](../../Entities/interfaces/IFillingRecipeVersionEntity.md)

Defined in: [ts-chocolate/src/packlets/library-runtime/fillings/fillingRecipeVersion.ts:191](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/library-runtime/fillings/fillingRecipeVersion.ts#L191)

The underlying filling recipe version.
Use this to get the data layer version entity for persistence or journaling.

##### Returns

[`IFillingRecipeVersionEntity`](../../Entities/interfaces/IFillingRecipeVersionEntity.md)

The underlying filling recipe version.
Use this to get the entity version data for persistence or journaling.

#### Implementation of

[`IFillingRecipeVersion`](../interfaces/IFillingRecipeVersion.md).[`version`](../interfaces/IFillingRecipeVersion.md#version)

***

### versionId

#### Get Signature

> **get** **versionId**(): [`FillingVersionId`](../../../../type-aliases/FillingVersionId.md)

Defined in: [ts-chocolate/src/packlets/library-runtime/fillings/fillingRecipeVersion.ts:150](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/library-runtime/fillings/fillingRecipeVersion.ts#L150)

Qualified identifier for this version (fillingId@versionSpec).

##### Returns

[`FillingVersionId`](../../../../type-aliases/FillingVersionId.md)

Qualified identifier for this version (recipeId@versionSpec).

#### Implementation of

[`IFillingRecipeVersion`](../interfaces/IFillingRecipeVersion.md).[`versionId`](../interfaces/IFillingRecipeVersion.md#versionid)

***

### versionSpec

#### Get Signature

> **get** **versionSpec**(): [`FillingVersionSpec`](../../../../type-aliases/FillingVersionSpec.md)

Defined in: [ts-chocolate/src/packlets/library-runtime/fillings/fillingRecipeVersion.ts:157](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/library-runtime/fillings/fillingRecipeVersion.ts#L157)

The version specifier

##### Returns

[`FillingVersionSpec`](../../../../type-aliases/FillingVersionSpec.md)

Version spec portion of the identifier.

#### Implementation of

[`IFillingRecipeVersion`](../interfaces/IFillingRecipeVersion.md).[`versionSpec`](../interfaces/IFillingRecipeVersion.md#versionspec)

***

### yield

#### Get Signature

> **get** **yield**(): `string` \| `undefined`

Defined in: [ts-chocolate/src/packlets/library-runtime/fillings/fillingRecipeVersion.ts:209](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/library-runtime/fillings/fillingRecipeVersion.ts#L209)

Optional yield description (e.g., "50 bonbons")

##### Returns

`string` \| `undefined`

Optional yield description (e.g., "50 bonbons").

#### Implementation of

[`IFillingRecipeVersion`](../interfaces/IFillingRecipeVersion.md).[`yield`](../interfaces/IFillingRecipeVersion.md#yield)

## Methods

### calculateGanache()

> **calculateGanache**(): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`IGanacheCalculation`](../interfaces/IGanacheCalculation.md)\>

Defined in: [ts-chocolate/src/packlets/library-runtime/fillings/fillingRecipeVersion.ts:303](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/library-runtime/fillings/fillingRecipeVersion.ts#L303)

Calculates ganache characteristics for this version.

#### Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`IGanacheCalculation`](../interfaces/IGanacheCalculation.md)\>

Success with ganache calculation, or Failure if calculation fails

#### Implementation of

[`IFillingRecipeVersion`](../interfaces/IFillingRecipeVersion.md).[`calculateGanache`](../interfaces/IFillingRecipeVersion.md#calculateganache)

***

### getIngredients()

> **getIngredients**(`filter?`): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`IterableIterator`\<[`IResolvedFillingIngredient`](../interfaces/IResolvedFillingIngredient.md)\<[`AnyIngredient`](../type-aliases/AnyIngredient.md)\>, `any`, `any`\>\>

Defined in: [ts-chocolate/src/packlets/library-runtime/fillings/fillingRecipeVersion.ts:241](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/library-runtime/fillings/fillingRecipeVersion.ts#L241)

Gets ingredients, optionally filtered.

#### Parameters

##### filter?

[`FillingRecipeIngredientsFilter`](../type-aliases/FillingRecipeIngredientsFilter.md)[]

Optional array of filters (OR semantics)
  - `undefined`/omitted: returns all ingredients
  - Empty array `[]`: returns nothing (empty iterator)
  - Non-empty array: returns ingredients matching at least one filter

#### Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`IterableIterator`\<[`IResolvedFillingIngredient`](../interfaces/IResolvedFillingIngredient.md)\<[`AnyIngredient`](../type-aliases/AnyIngredient.md)\>, `any`, `any`\>\>

Success with matching ingredients iterator, or Failure if resolution fails

#### Implementation of

[`IFillingRecipeVersion`](../interfaces/IFillingRecipeVersion.md).[`getIngredients`](../interfaces/IFillingRecipeVersion.md#getingredients)

***

### usesIngredient()

> **usesIngredient**(`ingredientId`): `boolean`

Defined in: [ts-chocolate/src/packlets/library-runtime/fillings/fillingRecipeVersion.ts:291](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/library-runtime/fillings/fillingRecipeVersion.ts#L291)

Checks if this version uses a specific ingredient (as primary).

#### Parameters

##### ingredientId

[`IngredientId`](../../../../type-aliases/IngredientId.md)

The ingredient ID to check

#### Returns

`boolean`

True if the ingredient is used in this version

#### Implementation of

[`IFillingRecipeVersion`](../interfaces/IFillingRecipeVersion.md).[`usesIngredient`](../interfaces/IFillingRecipeVersion.md#usesingredient)

***

### create()

> `static` **create**(`context`, `fillingId`, `version`): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`FillingRecipeVersion`\>

Defined in: [ts-chocolate/src/packlets/library-runtime/fillings/fillingRecipeVersion.ts:135](https://github.com/ErikFortune/fgv/blob/dea589ed45bb6093e848af2128364707c1440c79/libraries/ts-chocolate/src/packlets/library-runtime/fillings/fillingRecipeVersion.ts#L135)

Factory method for creating a RuntimeFillingRecipeVersion.

#### Parameters

##### context

[`VersionContext`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-chocolate/docs)

The runtime context

##### fillingId

[`FillingId`](../../../../type-aliases/FillingId.md)

The parent recipe ID

##### version

[`IFillingRecipeVersionEntity`](../../Entities/interfaces/IFillingRecipeVersionEntity.md)

The data layer version entity

#### Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`FillingRecipeVersion`\>

Success with RuntimeFillingRecipeVersion
