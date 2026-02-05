[**@fgv/ts-chocolate**](../../../../README.md)

***

[@fgv/ts-chocolate](../../../../README.md) / [LibraryRuntime](../README.md) / LibraryRuntimeContext

# Class: LibraryRuntimeContext

Defined in: [ts-chocolate/src/packlets/library-runtime/libraryRuntimeContext.ts:97](https://github.com/ErikFortune/fgv/blob/4be6f2d0ab84c3f4b78ffd3f9b262279d2ab7172/libraries/ts-chocolate/src/packlets/library-runtime/libraryRuntimeContext.ts#L97)

Central context for the library-runtime object access layer.
Provides factory methods for runtime objects, caching, and reverse lookups.

This is the entry point for consumers who want resolved views
of recipes and ingredients with automatic reference resolution.

For session creation capabilities, use RuntimeContext from the runtime packlet.

## Extended by

- [`RuntimeContext`](../../../../classes/RuntimeContext.md)

## Implements

- [`ILibraryRuntimeContext`](../interfaces/ILibraryRuntimeContext.md)

## Constructors

### Constructor

> `protected` **new LibraryRuntimeContext**(`library`, `preWarm`): `LibraryRuntimeContext`

Defined in: [ts-chocolate/src/packlets/library-runtime/libraryRuntimeContext.ts:126](https://github.com/ErikFortune/fgv/blob/4be6f2d0ab84c3f4b78ffd3f9b262279d2ab7172/libraries/ts-chocolate/src/packlets/library-runtime/libraryRuntimeContext.ts#L126)

#### Parameters

##### library

[`ChocolateLibrary`](../../../../classes/ChocolateLibrary.md)

##### preWarm

`boolean`

#### Returns

`LibraryRuntimeContext`

## Properties

### logger

> `readonly` **logger**: [`LogReporter`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`unknown`\>

Defined in: [ts-chocolate/src/packlets/library-runtime/libraryRuntimeContext.ts:106](https://github.com/ErikFortune/fgv/blob/4be6f2d0ab84c3f4b78ffd3f9b262279d2ab7172/libraries/ts-chocolate/src/packlets/library-runtime/libraryRuntimeContext.ts#L106)

Logger used by this runtime context and its libraries.

## Accessors

### cachedConfectionCount

#### Get Signature

> **get** **cachedConfectionCount**(): `number`

Defined in: [ts-chocolate/src/packlets/library-runtime/libraryRuntimeContext.ts:494](https://github.com/ErikFortune/fgv/blob/4be6f2d0ab84c3f4b78ffd3f9b262279d2ab7172/libraries/ts-chocolate/src/packlets/library-runtime/libraryRuntimeContext.ts#L494)

Gets the number of cached confections.

##### Returns

`number`

***

### cachedIngredientCount

#### Get Signature

> **get** **cachedIngredientCount**(): `number`

Defined in: [ts-chocolate/src/packlets/library-runtime/libraryRuntimeContext.ts:480](https://github.com/ErikFortune/fgv/blob/4be6f2d0ab84c3f4b78ffd3f9b262279d2ab7172/libraries/ts-chocolate/src/packlets/library-runtime/libraryRuntimeContext.ts#L480)

Gets the number of cached ingredients.

##### Returns

`number`

Gets the number of cached ingredients.

#### Implementation of

[`ILibraryRuntimeContext`](../interfaces/ILibraryRuntimeContext.md).[`cachedIngredientCount`](../interfaces/ILibraryRuntimeContext.md#cachedingredientcount)

***

### cachedRecipeCount

#### Get Signature

> **get** **cachedRecipeCount**(): `number`

Defined in: [ts-chocolate/src/packlets/library-runtime/libraryRuntimeContext.ts:487](https://github.com/ErikFortune/fgv/blob/4be6f2d0ab84c3f4b78ffd3f9b262279d2ab7172/libraries/ts-chocolate/src/packlets/library-runtime/libraryRuntimeContext.ts#L487)

Gets the number of cached recipes.

##### Returns

`number`

Gets the number of cached recipes.

#### Implementation of

[`ILibraryRuntimeContext`](../interfaces/ILibraryRuntimeContext.md).[`cachedRecipeCount`](../interfaces/ILibraryRuntimeContext.md#cachedrecipecount)

***

### confections

#### Get Signature

> **get** **confections**(): [`MaterializedLibrary`](MaterializedLibrary.md)\<[`ConfectionId`](../../../../type-aliases/ConfectionId.md), [`AnyConfectionEntity`](../../Entities/type-aliases/AnyConfectionEntity.md), [`AnyConfection`](../type-aliases/AnyConfection.md), `never`\>

Defined in: [ts-chocolate/src/packlets/library-runtime/libraryRuntimeContext.ts:192](https://github.com/ErikFortune/fgv/blob/4be6f2d0ab84c3f4b78ffd3f9b262279d2ab7172/libraries/ts-chocolate/src/packlets/library-runtime/libraryRuntimeContext.ts#L192)

A materialized library of all confections, keyed by composite ID.
Confections are resolved lazily on access and cached.

##### Returns

[`MaterializedLibrary`](MaterializedLibrary.md)\<[`ConfectionId`](../../../../type-aliases/ConfectionId.md), [`AnyConfectionEntity`](../../Entities/type-aliases/AnyConfectionEntity.md), [`AnyConfection`](../type-aliases/AnyConfection.md), `never`\>

A materialized library of all confections, keyed by composite ID.
Confections are resolved lazily on access and cached.
Use `.get(id)` for ID-based lookup, `.has(id)` for existence checks,
`.values()` for iteration.

#### Implementation of

[`ILibraryRuntimeContext`](../interfaces/ILibraryRuntimeContext.md).[`confections`](../interfaces/ILibraryRuntimeContext.md#confections)

***

### fillings

#### Get Signature

> **get** **fillings**(): [`MaterializedLibrary`](MaterializedLibrary.md)\<[`FillingId`](../../../../type-aliases/FillingId.md), [`IFillingRecipeEntity`](../../Entities/interfaces/IFillingRecipeEntity.md), [`FillingRecipe`](FillingRecipe.md), [`IFillingRecipeQuerySpec`](../namespaces/Indexers/interfaces/IFillingRecipeQuerySpec.md)\>

Defined in: [ts-chocolate/src/packlets/library-runtime/libraryRuntimeContext.ts:266](https://github.com/ErikFortune/fgv/blob/4be6f2d0ab84c3f4b78ffd3f9b262279d2ab7172/libraries/ts-chocolate/src/packlets/library-runtime/libraryRuntimeContext.ts#L266)

A searchable library of all fillings, keyed by composite ID.
Fillings are resolved lazily on access and cached.

##### Returns

[`MaterializedLibrary`](MaterializedLibrary.md)\<[`FillingId`](../../../../type-aliases/FillingId.md), [`IFillingRecipeEntity`](../../Entities/interfaces/IFillingRecipeEntity.md), [`FillingRecipe`](FillingRecipe.md), [`IFillingRecipeQuerySpec`](../namespaces/Indexers/interfaces/IFillingRecipeQuerySpec.md)\>

Map of all fillings, keyed by composite ID.

#### Implementation of

[`ILibraryRuntimeContext`](../interfaces/ILibraryRuntimeContext.md).[`fillings`](../interfaces/ILibraryRuntimeContext.md#fillings)

***

### ingredients

#### Get Signature

> **get** **ingredients**(): [`MaterializedLibrary`](MaterializedLibrary.md)\<[`IngredientId`](../../../../type-aliases/IngredientId.md), [`IngredientEntity`](../../Entities/type-aliases/IngredientEntity.md), [`AnyIngredient`](../type-aliases/AnyIngredient.md), [`IIngredientQuerySpec`](../namespaces/Indexers/interfaces/IIngredientQuerySpec.md)\>

Defined in: [ts-chocolate/src/packlets/library-runtime/libraryRuntimeContext.ts:253](https://github.com/ErikFortune/fgv/blob/4be6f2d0ab84c3f4b78ffd3f9b262279d2ab7172/libraries/ts-chocolate/src/packlets/library-runtime/libraryRuntimeContext.ts#L253)

A searchable library of all ingredients, keyed by composite ID.
Ingredients are resolved lazily on access and cached.

##### Returns

[`MaterializedLibrary`](MaterializedLibrary.md)\<[`IngredientId`](../../../../type-aliases/IngredientId.md), [`IngredientEntity`](../../Entities/type-aliases/IngredientEntity.md), [`AnyIngredient`](../type-aliases/AnyIngredient.md), [`IIngredientQuerySpec`](../namespaces/Indexers/interfaces/IIngredientQuerySpec.md)\>

Map of all ingredients, keyed by composite ID.

#### Implementation of

[`ILibraryRuntimeContext`](../interfaces/ILibraryRuntimeContext.md).[`ingredients`](../interfaces/ILibraryRuntimeContext.md#ingredients)

***

### library

#### Get Signature

> **get** **library**(): [`ChocolateLibrary`](../../../../classes/ChocolateLibrary.md)

Defined in: [ts-chocolate/src/packlets/library-runtime/libraryRuntimeContext.ts:180](https://github.com/ErikFortune/fgv/blob/4be6f2d0ab84c3f4b78ffd3f9b262279d2ab7172/libraries/ts-chocolate/src/packlets/library-runtime/libraryRuntimeContext.ts#L180)

The underlying ChocolateLibrary for direct access when needed.

##### Returns

[`ChocolateLibrary`](../../../../classes/ChocolateLibrary.md)

The underlying ChocolateLibrary for direct access when needed.

#### Implementation of

[`ILibraryRuntimeContext`](../interfaces/ILibraryRuntimeContext.md).[`library`](../interfaces/ILibraryRuntimeContext.md#library)

***

### molds

#### Get Signature

> **get** **molds**(): [`MaterializedLibrary`](MaterializedLibrary.md)\<[`MoldId`](../../../../type-aliases/MoldId.md), [`IMoldEntity`](../../Entities/interfaces/IMoldEntity.md), [`Mold`](Mold.md), `never`\>

Defined in: [ts-chocolate/src/packlets/library-runtime/libraryRuntimeContext.ts:205](https://github.com/ErikFortune/fgv/blob/4be6f2d0ab84c3f4b78ffd3f9b262279d2ab7172/libraries/ts-chocolate/src/packlets/library-runtime/libraryRuntimeContext.ts#L205)

A materialized library of all molds, keyed by composite ID.
Molds are resolved lazily on access and cached.

##### Returns

[`MaterializedLibrary`](MaterializedLibrary.md)\<[`MoldId`](../../../../type-aliases/MoldId.md), [`IMoldEntity`](../../Entities/interfaces/IMoldEntity.md), [`Mold`](Mold.md), `never`\>

A materialized library of all molds, keyed by composite ID.
Molds are resolved lazily on access and cached.
Use `.get(id)` for ID-based lookup, `.has(id)` for existence checks,
`.values()` for iteration.

#### Implementation of

[`ILibraryRuntimeContext`](../interfaces/ILibraryRuntimeContext.md).[`molds`](../interfaces/ILibraryRuntimeContext.md#molds)

***

### procedures

#### Get Signature

> **get** **procedures**(): [`MaterializedLibrary`](MaterializedLibrary.md)\<[`ProcedureId`](../../../../type-aliases/ProcedureId.md), [`IProcedureEntity`](../../Entities/interfaces/IProcedureEntity.md), [`Procedure`](Procedure.md), `never`\>

Defined in: [ts-chocolate/src/packlets/library-runtime/libraryRuntimeContext.ts:213](https://github.com/ErikFortune/fgv/blob/4be6f2d0ab84c3f4b78ffd3f9b262279d2ab7172/libraries/ts-chocolate/src/packlets/library-runtime/libraryRuntimeContext.ts#L213)

A materialized library of all procedures, keyed by composite ID.
Procedures are resolved lazily on access and cached.

##### Returns

[`MaterializedLibrary`](MaterializedLibrary.md)\<[`ProcedureId`](../../../../type-aliases/ProcedureId.md), [`IProcedureEntity`](../../Entities/interfaces/IProcedureEntity.md), [`Procedure`](Procedure.md), `never`\>

A materialized library of all procedures, keyed by composite ID.
Procedures are resolved lazily on access and cached.
Use `.get(id)` for ID-based lookup, `.has(id)` for existence checks,
`.values()` for iteration.

#### Implementation of

[`ILibraryRuntimeContext`](../interfaces/ILibraryRuntimeContext.md).[`procedures`](../interfaces/ILibraryRuntimeContext.md#procedures)

***

### tasks

#### Get Signature

> **get** **tasks**(): [`MaterializedLibrary`](MaterializedLibrary.md)\<[`TaskId`](../../../../type-aliases/TaskId.md), [`IRawTaskEntity`](../../Entities/interfaces/IRawTaskEntity.md), [`Task`](Task.md), `never`\>

Defined in: [ts-chocolate/src/packlets/library-runtime/libraryRuntimeContext.ts:221](https://github.com/ErikFortune/fgv/blob/4be6f2d0ab84c3f4b78ffd3f9b262279d2ab7172/libraries/ts-chocolate/src/packlets/library-runtime/libraryRuntimeContext.ts#L221)

A materialized library of all tasks, keyed by composite ID.
Tasks are resolved lazily on access and cached.

##### Returns

[`MaterializedLibrary`](MaterializedLibrary.md)\<[`TaskId`](../../../../type-aliases/TaskId.md), [`IRawTaskEntity`](../../Entities/interfaces/IRawTaskEntity.md), [`Task`](Task.md), `never`\>

A materialized library of all tasks, keyed by composite ID.
Tasks are resolved lazily on access and cached.
Use `.get(id)` for ID-based lookup, `.has(id)` for existence checks,
`.values()` for iteration.

#### Implementation of

[`ILibraryRuntimeContext`](../interfaces/ILibraryRuntimeContext.md).[`tasks`](../interfaces/ILibraryRuntimeContext.md#tasks)

## Methods

### clearCache()

> **clearCache**(): `void`

Defined in: [ts-chocolate/src/packlets/library-runtime/libraryRuntimeContext.ts:502](https://github.com/ErikFortune/fgv/blob/4be6f2d0ab84c3f4b78ffd3f9b262279d2ab7172/libraries/ts-chocolate/src/packlets/library-runtime/libraryRuntimeContext.ts#L502)

Clears all cached runtime objects.
Use if underlying library data has changed.

#### Returns

`void`

#### Implementation of

[`ILibraryRuntimeContext`](../interfaces/ILibraryRuntimeContext.md).[`clearCache`](../interfaces/ILibraryRuntimeContext.md#clearcache)

***

### createWeightContext()

> **createWeightContext**(): [`IWeightCalculationContext`](../namespaces/Internal/interfaces/IWeightCalculationContext.md)

Defined in: [ts-chocolate/src/packlets/library-runtime/libraryRuntimeContext.ts:540](https://github.com/ErikFortune/fgv/blob/4be6f2d0ab84c3f4b78ffd3f9b262279d2ab7172/libraries/ts-chocolate/src/packlets/library-runtime/libraryRuntimeContext.ts#L540)

Creates a weight calculation context for unit-aware weight calculations.
The context resolves ingredient IDs to their density values.

#### Returns

[`IWeightCalculationContext`](../namespaces/Internal/interfaces/IWeightCalculationContext.md)

A weight calculation context bound to this runtime's library

***

### getAllConfectionTags()

> **getAllConfectionTags**(): readonly `string`[]

Defined in: [ts-chocolate/src/packlets/library-runtime/libraryRuntimeContext.ts:462](https://github.com/ErikFortune/fgv/blob/4be6f2d0ab84c3f4b78ffd3f9b262279d2ab7172/libraries/ts-chocolate/src/packlets/library-runtime/libraryRuntimeContext.ts#L462)

Gets all unique tags used across confections.

#### Returns

readonly `string`[]

***

### getAllFillingTags()

> **getAllFillingTags**(): readonly `string`[]

Defined in: [ts-chocolate/src/packlets/library-runtime/libraryRuntimeContext.ts:448](https://github.com/ErikFortune/fgv/blob/4be6f2d0ab84c3f4b78ffd3f9b262279d2ab7172/libraries/ts-chocolate/src/packlets/library-runtime/libraryRuntimeContext.ts#L448)

Gets all unique tags used across fillings.

#### Returns

readonly `string`[]

#### Implementation of

[`ILibraryRuntimeContext`](../interfaces/ILibraryRuntimeContext.md).[`getAllFillingTags`](../interfaces/ILibraryRuntimeContext.md#getallfillingtags)

***

### getAllIngredientTags()

> **getAllIngredientTags**(): readonly `string`[]

Defined in: [ts-chocolate/src/packlets/library-runtime/libraryRuntimeContext.ts:455](https://github.com/ErikFortune/fgv/blob/4be6f2d0ab84c3f4b78ffd3f9b262279d2ab7172/libraries/ts-chocolate/src/packlets/library-runtime/libraryRuntimeContext.ts#L455)

Gets all unique tags used across ingredients.

#### Returns

readonly `string`[]

#### Implementation of

[`ILibraryRuntimeContext`](../interfaces/ILibraryRuntimeContext.md).[`getAllIngredientTags`](../interfaces/ILibraryRuntimeContext.md#getallingredienttags)

***

### getIngredientUsage()

> **getIngredientUsage**(`ingredientId`): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<readonly [`IIngredientUsageInfo`](../interfaces/IIngredientUsageInfo.md)[]\>

Defined in: [ts-chocolate/src/packlets/library-runtime/libraryRuntimeContext.ts:434](https://github.com/ErikFortune/fgv/blob/4be6f2d0ab84c3f4b78ffd3f9b262279d2ab7172/libraries/ts-chocolate/src/packlets/library-runtime/libraryRuntimeContext.ts#L434)

Gets detailed usage information for an ingredient.

#### Parameters

##### ingredientId

[`IngredientId`](../../../../type-aliases/IngredientId.md)

The ingredient ID to look up

#### Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<readonly [`IIngredientUsageInfo`](../interfaces/IIngredientUsageInfo.md)[]\>

Success with array of usage info, or Failure if ingredient doesn't exist

#### Implementation of

[`ILibraryRuntimeContext`](../interfaces/ILibraryRuntimeContext.md).[`getIngredientUsage`](../interfaces/ILibraryRuntimeContext.md#getingredientusage)

***

### invalidateIndexers()

> **invalidateIndexers**(): `void`

Defined in: [ts-chocolate/src/packlets/library-runtime/libraryRuntimeContext.ts:529](https://github.com/ErikFortune/fgv/blob/4be6f2d0ab84c3f4b78ffd3f9b262279d2ab7172/libraries/ts-chocolate/src/packlets/library-runtime/libraryRuntimeContext.ts#L529)

Invalidates all indexer caches.
Call this when underlying library data changes.

#### Returns

`void`

***

### warmUp()

> **warmUp**(): `void`

Defined in: [ts-chocolate/src/packlets/library-runtime/libraryRuntimeContext.ts:518](https://github.com/ErikFortune/fgv/blob/4be6f2d0ab84c3f4b78ffd3f9b262279d2ab7172/libraries/ts-chocolate/src/packlets/library-runtime/libraryRuntimeContext.ts#L518)

Pre-warms the reverse indexes for efficient queries.

#### Returns

`void`

#### Implementation of

[`ILibraryRuntimeContext`](../interfaces/ILibraryRuntimeContext.md).[`warmUp`](../interfaces/ILibraryRuntimeContext.md#warmup)

***

### create()

> `static` **create**(`params?`): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`LibraryRuntimeContext`\>

Defined in: [ts-chocolate/src/packlets/library-runtime/libraryRuntimeContext.ts:156](https://github.com/ErikFortune/fgv/blob/4be6f2d0ab84c3f4b78ffd3f9b262279d2ab7172/libraries/ts-chocolate/src/packlets/library-runtime/libraryRuntimeContext.ts#L156)

Creates a LibraryRuntimeContext with a new or default ChocolateLibrary.
This is the primary factory method for most use cases.

#### Parameters

##### params?

[`ILibraryRuntimeContextCreateParams`](../interfaces/ILibraryRuntimeContextCreateParams.md)

Optional parameters for library and caching

#### Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`LibraryRuntimeContext`\>

Success with LibraryRuntimeContext, or Failure if library creation fails

***

### fromLibrary()

> `static` **fromLibrary**(`library`, `preWarm?`): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`LibraryRuntimeContext`\>

Defined in: [ts-chocolate/src/packlets/library-runtime/libraryRuntimeContext.ts:169](https://github.com/ErikFortune/fgv/blob/4be6f2d0ab84c3f4b78ffd3f9b262279d2ab7172/libraries/ts-chocolate/src/packlets/library-runtime/libraryRuntimeContext.ts#L169)

Creates a LibraryRuntimeContext wrapping an existing ChocolateLibrary.
Use this when you already have a configured library instance.

#### Parameters

##### library

[`ChocolateLibrary`](../../../../classes/ChocolateLibrary.md)

The ChocolateLibrary to wrap

##### preWarm?

`boolean`

Whether to pre-warm the reverse index

#### Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`LibraryRuntimeContext`\>

Success with LibraryRuntimeContext
