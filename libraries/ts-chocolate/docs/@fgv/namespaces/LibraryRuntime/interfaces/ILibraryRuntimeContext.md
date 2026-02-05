[**@fgv/ts-chocolate**](../../../../README.md)

***

[@fgv/ts-chocolate](../../../../README.md) / [LibraryRuntime](../README.md) / ILibraryRuntimeContext

# Interface: ILibraryRuntimeContext

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:919](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L919)

Central context for the library-runtime object access layer.

Provides:
- Primary resolution methods for ingredients and recipes
- Reverse lookups (ingredient → recipes, tag → entities)
- Recipe operations (scaling, ganache calculation)
- Cache management
- Iteration over all entities

This is the main entry point for consumers who want resolved views
of recipes and ingredients with automatic reference resolution.

Note: For session creation capabilities, use IRuntimeContext from the runtime packlet.

## Extended by

- [`IRuntimeContext`](../../Runtime/interfaces/IRuntimeContext.md)

## Properties

### cachedIngredientCount

> `readonly` **cachedIngredientCount**: `number`

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:992](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L992)

Gets the number of cached ingredients.

***

### cachedRecipeCount

> `readonly` **cachedRecipeCount**: `number`

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:997](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L997)

Gets the number of cached recipes.

***

### confections

> `readonly` **confections**: [`MaterializedLibrary`](../classes/MaterializedLibrary.md)\<[`ConfectionId`](../../../../type-aliases/ConfectionId.md), [`AnyConfectionEntity`](../../Entities/type-aliases/AnyConfectionEntity.md), [`IConfectionBase`](IConfectionBase.md)\<[`AnyConfectionVersion`](../type-aliases/AnyConfectionVersion.md), [`AnyConfectionEntity`](../../Entities/type-aliases/AnyConfectionEntity.md)\>, `never`\>

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:957](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L957)

A materialized library of all confections, keyed by composite ID.
Confections are resolved lazily on access and cached.
Use `.get(id)` for ID-based lookup, `.has(id)` for existence checks,
`.values()` for iteration.

***

### fillings

> `readonly` **fillings**: [`MaterializedLibrary`](../classes/MaterializedLibrary.md)\<[`FillingId`](../../../../type-aliases/FillingId.md), [`IFillingRecipeEntity`](../../Entities/interfaces/IFillingRecipeEntity.md), [`IFillingRecipe`](IFillingRecipe.md), [`IFillingRecipeQuerySpec`](../namespaces/Indexers/interfaces/IFillingRecipeQuerySpec.md)\>

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:874](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L874)

Map of all fillings, keyed by composite ID.

#### Inherited from

`IVersionContext.fillings`

***

### ingredients

> `readonly` **ingredients**: [`MaterializedLibrary`](../classes/MaterializedLibrary.md)\<[`IngredientId`](../../../../type-aliases/IngredientId.md), [`IngredientEntity`](../../Entities/type-aliases/IngredientEntity.md), [`AnyIngredient`](../type-aliases/AnyIngredient.md), [`IIngredientQuerySpec`](../namespaces/Indexers/interfaces/IIngredientQuerySpec.md)\>

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:867](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L867)

Map of all ingredients, keyed by composite ID.

#### Inherited from

`IVersionContext.ingredients`

***

### library

> `readonly` **library**: [`ChocolateLibrary`](../../../../classes/ChocolateLibrary.md)

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:925](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L925)

The underlying ChocolateLibrary for direct access when needed.

***

### molds

> `readonly` **molds**: [`MaterializedLibrary`](../classes/MaterializedLibrary.md)\<[`MoldId`](../../../../type-aliases/MoldId.md), [`IMoldEntity`](../../Entities/interfaces/IMoldEntity.md), [`IMold`](IMold.md), `never`\>

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:933](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L933)

A materialized library of all molds, keyed by composite ID.
Molds are resolved lazily on access and cached.
Use `.get(id)` for ID-based lookup, `.has(id)` for existence checks,
`.values()` for iteration.

***

### procedures

> `readonly` **procedures**: [`MaterializedLibrary`](../classes/MaterializedLibrary.md)\<[`ProcedureId`](../../../../type-aliases/ProcedureId.md), [`IProcedureEntity`](../../Entities/interfaces/IProcedureEntity.md), [`IProcedure`](IProcedure.md), `never`\>

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:941](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L941)

A materialized library of all procedures, keyed by composite ID.
Procedures are resolved lazily on access and cached.
Use `.get(id)` for ID-based lookup, `.has(id)` for existence checks,
`.values()` for iteration.

#### Overrides

`IVersionContext.procedures`

***

### tasks

> `readonly` **tasks**: [`MaterializedLibrary`](../classes/MaterializedLibrary.md)\<[`TaskId`](../../../../type-aliases/TaskId.md), [`IRawTaskEntity`](../../Entities/interfaces/IRawTaskEntity.md), [`ITask`](ITask.md), `never`\>

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:949](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L949)

A materialized library of all tasks, keyed by composite ID.
Tasks are resolved lazily on access and cached.
Use `.get(id)` for ID-based lookup, `.has(id)` for existence checks,
`.values()` for iteration.

## Methods

### clearCache()

> **clearCache**(): `void`

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:1003](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L1003)

Clears all cached runtime objects.
Use if underlying library data has changed.

#### Returns

`void`

***

### getAllFillingTags()

> **getAllFillingTags**(): readonly `string`[]

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:980](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L980)

Gets all unique tags used across fillings.

#### Returns

readonly `string`[]

***

### getAllIngredientTags()

> **getAllIngredientTags**(): readonly `string`[]

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:985](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L985)

Gets all unique tags used across ingredients.

#### Returns

readonly `string`[]

***

### getIngredientUsage()

> **getIngredientUsage**(`ingredientId`): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<readonly [`IIngredientUsageInfo`](IIngredientUsageInfo.md)[]\>

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:973](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L973)

Gets detailed usage information for an ingredient.

#### Parameters

##### ingredientId

[`IngredientId`](../../../../type-aliases/IngredientId.md)

The ingredient ID to look up

#### Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<readonly [`IIngredientUsageInfo`](IIngredientUsageInfo.md)[]\>

Success with array of usage info, or Failure if ingredient doesn't exist

***

### warmUp()

> **warmUp**(): `void`

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:1008](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L1008)

Pre-warms the reverse indexes for efficient queries.

#### Returns

`void`
