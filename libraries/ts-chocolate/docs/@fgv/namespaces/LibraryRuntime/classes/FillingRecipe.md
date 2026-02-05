[**@fgv/ts-chocolate**](../../../../README.md)

***

[@fgv/ts-chocolate](../../../../README.md) / [LibraryRuntime](../README.md) / FillingRecipe

# Class: FillingRecipe

Defined in: [ts-chocolate/src/packlets/library-runtime/fillings/fillingRecipe.ts:55](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/library-runtime/fillings/fillingRecipe.ts#L55)

A resolved view of a recipe with navigation and version access.
Immutable - does not allow modification of underlying data.

## Implements

- [`IFillingRecipe`](../interfaces/IFillingRecipe.md)

## Accessors

### baseId

#### Get Signature

> **get** **baseId**(): [`BaseFillingId`](../../../../type-aliases/BaseFillingId.md)

Defined in: [ts-chocolate/src/packlets/library-runtime/fillings/fillingRecipe.ts:120](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/library-runtime/fillings/fillingRecipe.ts#L120)

The base recipe ID within the source

##### Returns

[`BaseFillingId`](../../../../type-aliases/BaseFillingId.md)

The base recipe ID within the source.

#### Implementation of

[`IFillingRecipe`](../interfaces/IFillingRecipe.md).[`baseId`](../interfaces/IFillingRecipe.md#baseid)

***

### collectionId

#### Get Signature

> **get** **collectionId**(): [`CollectionId`](../../../../type-aliases/CollectionId.md)

Defined in: [ts-chocolate/src/packlets/library-runtime/fillings/fillingRecipe.ts:113](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/library-runtime/fillings/fillingRecipe.ts#L113)

The source ID part of the composite ID

##### Returns

[`CollectionId`](../../../../type-aliases/CollectionId.md)

The collection ID part of the composite ID.

#### Implementation of

[`IFillingRecipe`](../interfaces/IFillingRecipe.md).[`collectionId`](../interfaces/IFillingRecipe.md#collectionid)

***

### description

#### Get Signature

> **get** **description**(): `string` \| `undefined`

Defined in: [ts-chocolate/src/packlets/library-runtime/fillings/fillingRecipe.ts:138](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/library-runtime/fillings/fillingRecipe.ts#L138)

Optional description of the recipe

##### Returns

`string` \| `undefined`

Optional description of the recipe.

#### Implementation of

[`IFillingRecipe`](../interfaces/IFillingRecipe.md).[`description`](../interfaces/IFillingRecipe.md#description)

***

### entity

#### Get Signature

> **get** **entity**(): [`IFillingRecipeEntity`](../../Entities/interfaces/IFillingRecipeEntity.md)

Defined in: [ts-chocolate/src/packlets/library-runtime/fillings/fillingRecipe.ts:346](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/library-runtime/fillings/fillingRecipe.ts#L346)

Gets the underlying recipe data entity

##### Returns

[`IFillingRecipeEntity`](../../Entities/interfaces/IFillingRecipeEntity.md)

Gets the underlying filling recipe entity data.

#### Implementation of

[`IFillingRecipe`](../interfaces/IFillingRecipe.md).[`entity`](../interfaces/IFillingRecipe.md#entity)

***

### goldenVersion

#### Get Signature

> **get** **goldenVersion**(): [`FillingRecipeVersion`](FillingRecipeVersion.md)

Defined in: [ts-chocolate/src/packlets/library-runtime/fillings/fillingRecipe.ts:186](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/library-runtime/fillings/fillingRecipe.ts#L186)

The golden (default approved) version - resolved.
Resolved lazily on first access.

##### Throws

if version creation fails - prefer getGoldenVersion() for proper error handling

##### Returns

[`FillingRecipeVersion`](FillingRecipeVersion.md)

The golden (default approved) version - resolved.

#### Implementation of

[`IFillingRecipe`](../interfaces/IFillingRecipe.md).[`goldenVersion`](../interfaces/IFillingRecipe.md#goldenversion)

***

### goldenVersionSpec

#### Get Signature

> **get** **goldenVersionSpec**(): [`FillingVersionSpec`](../../../../type-aliases/FillingVersionSpec.md)

Defined in: [ts-chocolate/src/packlets/library-runtime/fillings/fillingRecipe.ts:152](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/library-runtime/fillings/fillingRecipe.ts#L152)

The golden version ID

##### Returns

[`FillingVersionSpec`](../../../../type-aliases/FillingVersionSpec.md)

The ID of the golden (approved default) version.

#### Implementation of

[`IFillingRecipe`](../interfaces/IFillingRecipe.md).[`goldenVersionSpec`](../interfaces/IFillingRecipe.md#goldenversionspec)

***

### id

#### Get Signature

> **get** **id**(): [`FillingId`](../../../../type-aliases/FillingId.md)

Defined in: [ts-chocolate/src/packlets/library-runtime/fillings/fillingRecipe.ts:106](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/library-runtime/fillings/fillingRecipe.ts#L106)

The composite recipe ID (e.g., "user.dark-ganache")

##### Returns

[`FillingId`](../../../../type-aliases/FillingId.md)

The composite recipe ID (e.g., "user.dark-ganache").
Combines source and base ID for unique identification across sources.

#### Implementation of

[`IFillingRecipe`](../interfaces/IFillingRecipe.md).[`id`](../interfaces/IFillingRecipe.md#id)

***

### latestVersion

#### Get Signature

> **get** **latestVersion**(): [`FillingRecipeVersion`](FillingRecipeVersion.md)

Defined in: [ts-chocolate/src/packlets/library-runtime/fillings/fillingRecipe.ts:266](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/library-runtime/fillings/fillingRecipe.ts#L266)

Gets the latest version (by created date).
Resolved lazily on first access.

##### Throws

if version creation fails - prefer getLatestVersion() for proper error handling

##### Returns

[`FillingRecipeVersion`](FillingRecipeVersion.md)

Gets the latest version (by created date).

#### Implementation of

[`IFillingRecipe`](../interfaces/IFillingRecipe.md).[`latestVersion`](../interfaces/IFillingRecipe.md#latestversion)

***

### name

#### Get Signature

> **get** **name**(): [`FillingName`](../../../../type-aliases/FillingName.md)

Defined in: [ts-chocolate/src/packlets/library-runtime/fillings/fillingRecipe.ts:131](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/library-runtime/fillings/fillingRecipe.ts#L131)

Human-readable recipe name

##### Returns

[`FillingName`](../../../../type-aliases/FillingName.md)

Human-readable recipe name.

#### Implementation of

[`IFillingRecipe`](../interfaces/IFillingRecipe.md).[`name`](../interfaces/IFillingRecipe.md#name)

***

### tags

#### Get Signature

> **get** **tags**(): readonly `string`[]

Defined in: [ts-chocolate/src/packlets/library-runtime/fillings/fillingRecipe.ts:145](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/library-runtime/fillings/fillingRecipe.ts#L145)

Tags for categorization and search

##### Returns

readonly `string`[]

Optional tags for categorization and search.

#### Implementation of

[`IFillingRecipe`](../interfaces/IFillingRecipe.md).[`tags`](../interfaces/IFillingRecipe.md#tags)

***

### versionCount

#### Get Signature

> **get** **versionCount**(): `number`

Defined in: [ts-chocolate/src/packlets/library-runtime/fillings/fillingRecipe.ts:273](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/library-runtime/fillings/fillingRecipe.ts#L273)

Number of versions

##### Returns

`number`

Number of versions.

#### Implementation of

[`IFillingRecipe`](../interfaces/IFillingRecipe.md).[`versionCount`](../interfaces/IFillingRecipe.md#versioncount)

***

### versions

#### Get Signature

> **get** **versions**(): readonly [`FillingRecipeVersion`](FillingRecipeVersion.md)[]

Defined in: [ts-chocolate/src/packlets/library-runtime/fillings/fillingRecipe.ts:213](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/library-runtime/fillings/fillingRecipe.ts#L213)

All versions - resolved.
Resolved lazily on first access.

##### Throws

if version creation fails - prefer getVersions() for proper error handling

##### Returns

readonly [`FillingRecipeVersion`](FillingRecipeVersion.md)[]

All versions - resolved.

#### Implementation of

[`IFillingRecipe`](../interfaces/IFillingRecipe.md).[`versions`](../interfaces/IFillingRecipe.md#versions)

## Methods

### getGoldenVersion()

> **getGoldenVersion**(): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`FillingRecipeVersion`](FillingRecipeVersion.md)\>

Defined in: [ts-chocolate/src/packlets/library-runtime/fillings/fillingRecipe.ts:166](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/library-runtime/fillings/fillingRecipe.ts#L166)

Gets the golden (default approved) version - resolved.
Resolved lazily on first access.

#### Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`FillingRecipeVersion`](FillingRecipeVersion.md)\>

Result with golden version, or Failure if creation fails

***

### getIngredientIds()

> **getIngredientIds**(`options?`): `ReadonlySet`\<[`IngredientId`](../../../../type-aliases/IngredientId.md)\>

Defined in: [ts-chocolate/src/packlets/library-runtime/fillings/fillingRecipe.ts:288](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/library-runtime/fillings/fillingRecipe.ts#L288)

Gets unique ingredient IDs used across all versions.
By default, returns only preferred ingredients (primary choice for each ingredient slot).
Pass `{ includeAlternates: true }` to include all ingredient options.

#### Parameters

##### options?

[`IIngredientQueryOptions`](../interfaces/IIngredientQueryOptions.md)

Query options

#### Returns

`ReadonlySet`\<[`IngredientId`](../../../../type-aliases/IngredientId.md)\>

Set of ingredient IDs

#### Implementation of

[`IFillingRecipe`](../interfaces/IFillingRecipe.md).[`getIngredientIds`](../interfaces/IFillingRecipe.md#getingredientids)

***

### getLatestVersion()

> **getLatestVersion**(): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`FillingRecipeVersion`](FillingRecipeVersion.md)\>

Defined in: [ts-chocolate/src/packlets/library-runtime/fillings/fillingRecipe.ts:236](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/library-runtime/fillings/fillingRecipe.ts#L236)

Gets the latest version (by created date).
Resolved lazily on first access.

#### Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`FillingRecipeVersion`](FillingRecipeVersion.md)\>

Result with latest version, or Failure if creation fails

***

### getVersion()

> **getVersion**(`versionSpec`): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`FillingRecipeVersion`](FillingRecipeVersion.md)\>

Defined in: [ts-chocolate/src/packlets/library-runtime/fillings/fillingRecipe.ts:222](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/library-runtime/fillings/fillingRecipe.ts#L222)

Gets a specific version by ID.

#### Parameters

##### versionSpec

[`FillingVersionSpec`](../../../../type-aliases/FillingVersionSpec.md)

The version ID to find

#### Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`FillingRecipeVersion`](FillingRecipeVersion.md)\>

Success with FillingRecipeVersion, or Failure if not found

#### Implementation of

[`IFillingRecipe`](../interfaces/IFillingRecipe.md).[`getVersion`](../interfaces/IFillingRecipe.md#getversion)

***

### getVersions()

> **getVersions**(): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<readonly [`FillingRecipeVersion`](FillingRecipeVersion.md)[]\>

Defined in: [ts-chocolate/src/packlets/library-runtime/fillings/fillingRecipe.ts:196](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/library-runtime/fillings/fillingRecipe.ts#L196)

Gets all versions - resolved.
Resolved lazily on first access.

#### Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<readonly [`FillingRecipeVersion`](FillingRecipeVersion.md)[]\>

Result with all versions, or Failure if any version creation fails

***

### usesIngredient()

> **usesIngredient**(`ingredientId`, `options?`): `boolean`

Defined in: [ts-chocolate/src/packlets/library-runtime/fillings/fillingRecipe.ts:339](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/library-runtime/fillings/fillingRecipe.ts#L339)

Checks if any version uses a specific ingredient.
By default, only checks preferred ingredients.
Pass `{ includeAlternates: true }` to also check alternate ingredients.

#### Parameters

##### ingredientId

[`IngredientId`](../../../../type-aliases/IngredientId.md)

The ingredient ID to check

##### options?

[`IIngredientQueryOptions`](../interfaces/IIngredientQueryOptions.md)

Query options

#### Returns

`boolean`

True if the ingredient is used in any version

#### Implementation of

[`IFillingRecipe`](../interfaces/IFillingRecipe.md).[`usesIngredient`](../interfaces/IFillingRecipe.md#usesingredient)

***

### create()

> `static` **create**(`context`, `id`, `recipe`): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`FillingRecipe`\>

Defined in: [ts-chocolate/src/packlets/library-runtime/fillings/fillingRecipe.ts:91](https://github.com/ErikFortune/fgv/blob/f0affaa177ad091881f5199fd53d6bab72652f4f/libraries/ts-chocolate/src/packlets/library-runtime/fillings/fillingRecipe.ts#L91)

Factory method for creating a FillingRecipe.

#### Parameters

##### context

[`RecipeContext`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-chocolate/docs)

The runtime context

##### id

[`FillingId`](../../../../type-aliases/FillingId.md)

The recipe ID

##### recipe

[`IFillingRecipeEntity`](../../Entities/interfaces/IFillingRecipeEntity.md)

The data layer recipe entity

#### Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`FillingRecipe`\>

Success with FillingRecipe
