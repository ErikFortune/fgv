[**@fgv/ts-chocolate**](../../../../README.md)

***

[@fgv/ts-chocolate](../../../../README.md) / [Runtime](../README.md) / IRuntimeContext

# Interface: IRuntimeContext

Defined in: [ts-chocolate/src/packlets/runtime/model.ts:80](https://github.com/ErikFortune/fgv/blob/d51b0929f72c9206f7fc8c54016db3ae08502b0f/libraries/ts-chocolate/src/packlets/runtime/model.ts#L80)

Full runtime context interface with session capabilities.

Extends ILibraryRuntimeContext with:
- Session creation methods
- Confection access and caching

This is the complete entry point for consumers who need both
library resolution and session management.

## Extends

- [`ILibraryRuntimeContext`](../../LibraryRuntime/interfaces/ILibraryRuntimeContext.md)

## Properties

### cachedConfectionCount

> `readonly` **cachedConfectionCount**: `number`

Defined in: [ts-chocolate/src/packlets/runtime/model.ts:84](https://github.com/ErikFortune/fgv/blob/d51b0929f72c9206f7fc8c54016db3ae08502b0f/libraries/ts-chocolate/src/packlets/runtime/model.ts#L84)

Gets the number of cached confections.

***

### cachedIngredientCount

> `readonly` **cachedIngredientCount**: `number`

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:987](https://github.com/ErikFortune/fgv/blob/d51b0929f72c9206f7fc8c54016db3ae08502b0f/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L987)

Gets the number of cached ingredients.

#### Inherited from

[`ILibraryRuntimeContext`](../../LibraryRuntime/interfaces/ILibraryRuntimeContext.md).[`cachedIngredientCount`](../../LibraryRuntime/interfaces/ILibraryRuntimeContext.md#cachedingredientcount)

***

### cachedRecipeCount

> `readonly` **cachedRecipeCount**: `number`

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:992](https://github.com/ErikFortune/fgv/blob/d51b0929f72c9206f7fc8c54016db3ae08502b0f/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L992)

Gets the number of cached recipes.

#### Inherited from

[`ILibraryRuntimeContext`](../../LibraryRuntime/interfaces/ILibraryRuntimeContext.md).[`cachedRecipeCount`](../../LibraryRuntime/interfaces/ILibraryRuntimeContext.md#cachedrecipecount)

***

### confections

> `readonly` **confections**: [`MaterializedLibrary`](../../LibraryRuntime/classes/MaterializedLibrary.md)\<[`ConfectionId`](../../../../type-aliases/ConfectionId.md), [`AnyConfectionEntity`](../../Entities/type-aliases/AnyConfectionEntity.md), [`IConfectionBase`](../../LibraryRuntime/interfaces/IConfectionBase.md)\<[`AnyConfectionVersion`](../../LibraryRuntime/type-aliases/AnyConfectionVersion.md), [`AnyConfectionEntity`](../../Entities/type-aliases/AnyConfectionEntity.md)\>, `never`\>

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:952](https://github.com/ErikFortune/fgv/blob/d51b0929f72c9206f7fc8c54016db3ae08502b0f/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L952)

A materialized library of all confections, keyed by composite ID.
Confections are resolved lazily on access and cached.
Use `.get(id)` for ID-based lookup, `.has(id)` for existence checks,
`.values()` for iteration.

#### Inherited from

[`ILibraryRuntimeContext`](../../LibraryRuntime/interfaces/ILibraryRuntimeContext.md).[`confections`](../../LibraryRuntime/interfaces/ILibraryRuntimeContext.md#confections)

***

### fillings

> `readonly` **fillings**: [`MaterializedLibrary`](../../LibraryRuntime/classes/MaterializedLibrary.md)\<[`FillingId`](../../../../type-aliases/FillingId.md), [`IFillingRecipeEntity`](../../Entities/interfaces/IFillingRecipeEntity.md), [`IFillingRecipe`](../../LibraryRuntime/interfaces/IFillingRecipe.md), [`IFillingRecipeQuerySpec`](../../LibraryRuntime/namespaces/Indexers/interfaces/IFillingRecipeQuerySpec.md)\>

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:869](https://github.com/ErikFortune/fgv/blob/d51b0929f72c9206f7fc8c54016db3ae08502b0f/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L869)

Map of all fillings, keyed by composite ID.

#### Inherited from

[`ILibraryRuntimeContext`](../../LibraryRuntime/interfaces/ILibraryRuntimeContext.md).[`fillings`](../../LibraryRuntime/interfaces/ILibraryRuntimeContext.md#fillings)

***

### ingredients

> `readonly` **ingredients**: [`MaterializedLibrary`](../../LibraryRuntime/classes/MaterializedLibrary.md)\<[`IngredientId`](../../../../type-aliases/IngredientId.md), [`IngredientEntity`](../../Entities/type-aliases/IngredientEntity.md), [`AnyIngredient`](../../LibraryRuntime/type-aliases/AnyIngredient.md), [`IIngredientQuerySpec`](../../LibraryRuntime/namespaces/Indexers/interfaces/IIngredientQuerySpec.md)\>

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:862](https://github.com/ErikFortune/fgv/blob/d51b0929f72c9206f7fc8c54016db3ae08502b0f/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L862)

Map of all ingredients, keyed by composite ID.

#### Inherited from

[`ILibraryRuntimeContext`](../../LibraryRuntime/interfaces/ILibraryRuntimeContext.md).[`ingredients`](../../LibraryRuntime/interfaces/ILibraryRuntimeContext.md#ingredients)

***

### library

> `readonly` **library**: [`ChocolateLibrary`](../../../../classes/ChocolateLibrary.md)

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:920](https://github.com/ErikFortune/fgv/blob/d51b0929f72c9206f7fc8c54016db3ae08502b0f/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L920)

The underlying ChocolateLibrary for direct access when needed.

#### Inherited from

[`ILibraryRuntimeContext`](../../LibraryRuntime/interfaces/ILibraryRuntimeContext.md).[`library`](../../LibraryRuntime/interfaces/ILibraryRuntimeContext.md#library)

***

### molds

> `readonly` **molds**: [`MaterializedLibrary`](../../LibraryRuntime/classes/MaterializedLibrary.md)\<[`MoldId`](../../../../type-aliases/MoldId.md), [`IMoldEntity`](../../Entities/interfaces/IMoldEntity.md), [`IMold`](../../LibraryRuntime/interfaces/IMold.md), `never`\>

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:928](https://github.com/ErikFortune/fgv/blob/d51b0929f72c9206f7fc8c54016db3ae08502b0f/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L928)

A materialized library of all molds, keyed by composite ID.
Molds are resolved lazily on access and cached.
Use `.get(id)` for ID-based lookup, `.has(id)` for existence checks,
`.values()` for iteration.

#### Inherited from

[`ILibraryRuntimeContext`](../../LibraryRuntime/interfaces/ILibraryRuntimeContext.md).[`molds`](../../LibraryRuntime/interfaces/ILibraryRuntimeContext.md#molds)

***

### procedures

> `readonly` **procedures**: [`MaterializedLibrary`](../../LibraryRuntime/classes/MaterializedLibrary.md)\<[`ProcedureId`](../../../../type-aliases/ProcedureId.md), [`IProcedureEntity`](../../Entities/interfaces/IProcedureEntity.md), [`IProcedure`](../../LibraryRuntime/interfaces/IProcedure.md), `never`\>

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:936](https://github.com/ErikFortune/fgv/blob/d51b0929f72c9206f7fc8c54016db3ae08502b0f/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L936)

A materialized library of all procedures, keyed by composite ID.
Procedures are resolved lazily on access and cached.
Use `.get(id)` for ID-based lookup, `.has(id)` for existence checks,
`.values()` for iteration.

#### Inherited from

[`ILibraryRuntimeContext`](../../LibraryRuntime/interfaces/ILibraryRuntimeContext.md).[`procedures`](../../LibraryRuntime/interfaces/ILibraryRuntimeContext.md#procedures)

***

### tasks

> `readonly` **tasks**: [`MaterializedLibrary`](../../LibraryRuntime/classes/MaterializedLibrary.md)\<[`TaskId`](../../../../type-aliases/TaskId.md), [`IRawTaskEntity`](../../Entities/interfaces/IRawTaskEntity.md), [`ITask`](../../LibraryRuntime/interfaces/ITask.md), `never`\>

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:944](https://github.com/ErikFortune/fgv/blob/d51b0929f72c9206f7fc8c54016db3ae08502b0f/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L944)

A materialized library of all tasks, keyed by composite ID.
Tasks are resolved lazily on access and cached.
Use `.get(id)` for ID-based lookup, `.has(id)` for existence checks,
`.values()` for iteration.

#### Inherited from

[`ILibraryRuntimeContext`](../../LibraryRuntime/interfaces/ILibraryRuntimeContext.md).[`tasks`](../../LibraryRuntime/interfaces/ILibraryRuntimeContext.md#tasks)

## Methods

### clearCache()

> **clearCache**(): `void`

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:998](https://github.com/ErikFortune/fgv/blob/d51b0929f72c9206f7fc8c54016db3ae08502b0f/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L998)

Clears all cached runtime objects.
Use if underlying library data has changed.

#### Returns

`void`

#### Inherited from

[`ILibraryRuntimeContext`](../../LibraryRuntime/interfaces/ILibraryRuntimeContext.md).[`clearCache`](../../LibraryRuntime/interfaces/ILibraryRuntimeContext.md#clearcache)

***

### createFillingSession()

> **createFillingSession**(`filling`, `targetWeight`): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`EditingSession`](../namespaces/Session/classes/EditingSession.md)\>

Defined in: [ts-chocolate/src/packlets/runtime/model.ts:98](https://github.com/ErikFortune/fgv/blob/d51b0929f72c9206f7fc8c54016db3ae08502b0f/libraries/ts-chocolate/src/packlets/runtime/model.ts#L98)

Creates an editing session for a filling recipe at a target weight.
Used by confection sessions to manage filling scaling.

#### Parameters

##### filling

[`IFillingRecipe`](../../LibraryRuntime/interfaces/IFillingRecipe.md)

The runtime filling recipe to create a session for

##### targetWeight

[`Measurement`](../../../../type-aliases/Measurement.md)

Target weight for the filling in grams

#### Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`EditingSession`](../namespaces/Session/classes/EditingSession.md)\>

Success with EditingSession, or Failure if creation fails

***

### getAllConfectionTags()

> **getAllConfectionTags**(): readonly `string`[]

Defined in: [ts-chocolate/src/packlets/runtime/model.ts:89](https://github.com/ErikFortune/fgv/blob/d51b0929f72c9206f7fc8c54016db3ae08502b0f/libraries/ts-chocolate/src/packlets/runtime/model.ts#L89)

Gets all unique tags used across confections.

#### Returns

readonly `string`[]

***

### getAllFillingTags()

> **getAllFillingTags**(): readonly `string`[]

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:975](https://github.com/ErikFortune/fgv/blob/d51b0929f72c9206f7fc8c54016db3ae08502b0f/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L975)

Gets all unique tags used across fillings.

#### Returns

readonly `string`[]

#### Inherited from

[`ILibraryRuntimeContext`](../../LibraryRuntime/interfaces/ILibraryRuntimeContext.md).[`getAllFillingTags`](../../LibraryRuntime/interfaces/ILibraryRuntimeContext.md#getallfillingtags)

***

### getAllIngredientTags()

> **getAllIngredientTags**(): readonly `string`[]

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:980](https://github.com/ErikFortune/fgv/blob/d51b0929f72c9206f7fc8c54016db3ae08502b0f/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L980)

Gets all unique tags used across ingredients.

#### Returns

readonly `string`[]

#### Inherited from

[`ILibraryRuntimeContext`](../../LibraryRuntime/interfaces/ILibraryRuntimeContext.md).[`getAllIngredientTags`](../../LibraryRuntime/interfaces/ILibraryRuntimeContext.md#getallingredienttags)

***

### getIngredientUsage()

> **getIngredientUsage**(`ingredientId`): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<readonly [`IIngredientUsageInfo`](../../LibraryRuntime/interfaces/IIngredientUsageInfo.md)[]\>

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:968](https://github.com/ErikFortune/fgv/blob/d51b0929f72c9206f7fc8c54016db3ae08502b0f/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L968)

Gets detailed usage information for an ingredient.

#### Parameters

##### ingredientId

[`IngredientId`](../../../../type-aliases/IngredientId.md)

The ingredient ID to look up

#### Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<readonly [`IIngredientUsageInfo`](../../LibraryRuntime/interfaces/IIngredientUsageInfo.md)[]\>

Success with array of usage info, or Failure if ingredient doesn't exist

#### Inherited from

[`ILibraryRuntimeContext`](../../LibraryRuntime/interfaces/ILibraryRuntimeContext.md).[`getIngredientUsage`](../../LibraryRuntime/interfaces/ILibraryRuntimeContext.md#getingredientusage)

***

### warmUp()

> **warmUp**(): `void`

Defined in: [ts-chocolate/src/packlets/library-runtime/model.ts:1003](https://github.com/ErikFortune/fgv/blob/d51b0929f72c9206f7fc8c54016db3ae08502b0f/libraries/ts-chocolate/src/packlets/library-runtime/model.ts#L1003)

Pre-warms the reverse indexes for efficient queries.

#### Returns

`void`

#### Inherited from

[`ILibraryRuntimeContext`](../../LibraryRuntime/interfaces/ILibraryRuntimeContext.md).[`warmUp`](../../LibraryRuntime/interfaces/ILibraryRuntimeContext.md#warmup)
