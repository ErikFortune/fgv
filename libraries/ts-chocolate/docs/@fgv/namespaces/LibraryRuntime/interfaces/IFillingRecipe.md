[**@fgv/ts-chocolate**](../../../../README.md)

***

[@fgv/ts-chocolate](../../../../README.md) / [LibraryRuntime](../README.md) / IFillingRecipe

# Interface: IFillingRecipe

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:570](https://github.com/ErikFortune/fgv/blob/4be6f2d0ab84c3f4b78ffd3f9b262279d2ab7172/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L570)

A resolved runtime view of a recipe with navigation and version access.

This interface provides runtime-layer access to recipe data with:
- Composite identity (`id`, `collectionId`) for cross-source references
- Resolved version access (full objects, not just entity data)
- Scaling and calculation operations
- Usage and ingredient queries
- Resolved procedure access

Note: Does not extend [IFillingRecipeEntity](../../Entities/interfaces/IFillingRecipeEntity.md)
directly because `versions` has a different type (resolved vs data layer entity versions).

## Properties

### baseId

> `readonly` **baseId**: [`BaseFillingId`](../../../../type-aliases/BaseFillingId.md)

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:587](https://github.com/ErikFortune/fgv/blob/4be6f2d0ab84c3f4b78ffd3f9b262279d2ab7172/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L587)

The base recipe ID within the source.

***

### collectionId

> `readonly` **collectionId**: [`CollectionId`](../../../../type-aliases/CollectionId.md)

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:582](https://github.com/ErikFortune/fgv/blob/4be6f2d0ab84c3f4b78ffd3f9b262279d2ab7172/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L582)

The collection ID part of the composite ID.

***

### description?

> `readonly` `optional` **description**: `string`

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:599](https://github.com/ErikFortune/fgv/blob/4be6f2d0ab84c3f4b78ffd3f9b262279d2ab7172/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L599)

Optional description of the recipe.

***

### entity

> `readonly` **entity**: [`IFillingRecipeEntity`](../../Entities/interfaces/IFillingRecipeEntity.md)

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:666](https://github.com/ErikFortune/fgv/blob/4be6f2d0ab84c3f4b78ffd3f9b262279d2ab7172/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L666)

Gets the underlying filling recipe entity data.

***

### goldenVersion

> `readonly` **goldenVersion**: [`IFillingRecipeVersion`](IFillingRecipeVersion.md)

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:616](https://github.com/ErikFortune/fgv/blob/4be6f2d0ab84c3f4b78ffd3f9b262279d2ab7172/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L616)

The golden (default approved) version - resolved.

***

### goldenVersionSpec

> `readonly` **goldenVersionSpec**: [`FillingVersionSpec`](../../../../type-aliases/FillingVersionSpec.md)

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:609](https://github.com/ErikFortune/fgv/blob/4be6f2d0ab84c3f4b78ffd3f9b262279d2ab7172/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L609)

The ID of the golden (approved default) version.

***

### id

> `readonly` **id**: [`FillingId`](../../../../type-aliases/FillingId.md)

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:577](https://github.com/ErikFortune/fgv/blob/4be6f2d0ab84c3f4b78ffd3f9b262279d2ab7172/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L577)

The composite recipe ID (e.g., "user.dark-ganache").
Combines source and base ID for unique identification across sources.

***

### latestVersion

> `readonly` **latestVersion**: [`IFillingRecipeVersion`](IFillingRecipeVersion.md)

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:633](https://github.com/ErikFortune/fgv/blob/4be6f2d0ab84c3f4b78ffd3f9b262279d2ab7172/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L633)

Gets the latest version (by created date).

***

### name

> `readonly` **name**: [`FillingName`](../../../../type-aliases/FillingName.md)

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:594](https://github.com/ErikFortune/fgv/blob/4be6f2d0ab84c3f4b78ffd3f9b262279d2ab7172/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L594)

Human-readable recipe name.

***

### tags?

> `readonly` `optional` **tags**: readonly `string`[]

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:604](https://github.com/ErikFortune/fgv/blob/4be6f2d0ab84c3f4b78ffd3f9b262279d2ab7172/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L604)

Optional tags for categorization and search.

***

### versionCount

> `readonly` **versionCount**: `number`

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:638](https://github.com/ErikFortune/fgv/blob/4be6f2d0ab84c3f4b78ffd3f9b262279d2ab7172/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L638)

Number of versions.

***

### versions

> `readonly` **versions**: readonly [`IFillingRecipeVersion`](IFillingRecipeVersion.md)[]

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:621](https://github.com/ErikFortune/fgv/blob/4be6f2d0ab84c3f4b78ffd3f9b262279d2ab7172/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L621)

All versions - resolved.

## Methods

### getIngredientIds()

> **getIngredientIds**(`options?`): `ReadonlySet`\<[`IngredientId`](../../../../type-aliases/IngredientId.md)\>

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:649](https://github.com/ErikFortune/fgv/blob/4be6f2d0ab84c3f4b78ffd3f9b262279d2ab7172/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L649)

Gets unique ingredient IDs used across all versions.
By default, returns only preferred ingredients (primary choice for each ingredient slot).
Pass `{ includeAlternates: true }` to include all ingredient options.

#### Parameters

##### options?

[`IIngredientQueryOptions`](IIngredientQueryOptions.md)

Query options

#### Returns

`ReadonlySet`\<[`IngredientId`](../../../../type-aliases/IngredientId.md)\>

Set of ingredient IDs

***

### getVersion()

> **getVersion**(`versionSpec`): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`IFillingRecipeVersion`](IFillingRecipeVersion.md)\>

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:628](https://github.com/ErikFortune/fgv/blob/4be6f2d0ab84c3f4b78ffd3f9b262279d2ab7172/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L628)

Gets a specific version by [version specifier](../../../../type-aliases/FillingVersionSpec.md).

#### Parameters

##### versionSpec

[`FillingVersionSpec`](../../../../type-aliases/FillingVersionSpec.md)

The version specifier to find

#### Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`IFillingRecipeVersion`](IFillingRecipeVersion.md)\>

Success with RuntimeFillingRecipeVersion, or Failure if not found

***

### usesIngredient()

> **usesIngredient**(`ingredientId`, `options?`): `boolean`

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:659](https://github.com/ErikFortune/fgv/blob/4be6f2d0ab84c3f4b78ffd3f9b262279d2ab7172/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L659)

Checks if any version uses a specific ingredient.
By default, only checks preferred ingredients.
Pass `{ includeAlternates: true }` to also check alternate ingredients.

#### Parameters

##### ingredientId

[`IngredientId`](../../../../type-aliases/IngredientId.md)

The ingredient ID to check

##### options?

[`IIngredientQueryOptions`](IIngredientQueryOptions.md)

Query options

#### Returns

`boolean`

True if the ingredient is used in any version
