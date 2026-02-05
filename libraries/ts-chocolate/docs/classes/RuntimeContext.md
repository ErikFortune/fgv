[**@fgv/ts-chocolate**](../README.md)

***

[@fgv/ts-chocolate](../README.md) / RuntimeContext

# Class: RuntimeContext

Defined in: [ts-chocolate/src/packlets/runtime/runtimeContext.ts:72](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/runtime/runtimeContext.ts#L72)

Full runtime context with session creation capabilities.

Extends LibraryRuntimeContext with the ability to create editing sessions
for filling recipes. This is the primary entry point for consumers who
need both library resolution and session management.

## Extends

- [`LibraryRuntimeContext`](../@fgv/namespaces/LibraryRuntime/classes/LibraryRuntimeContext.md)

## Implements

- [`ISessionContext`](../@fgv/namespaces/Runtime/interfaces/ISessionContext.md)
- [`IRuntimeContext`](../@fgv/namespaces/Runtime/interfaces/IRuntimeContext.md)

## Properties

### logger

> `readonly` **logger**: [`LogReporter`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`unknown`\>

Defined in: [ts-chocolate/src/packlets/library-runtime/libraryRuntimeContext.ts:106](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/libraryRuntimeContext.ts#L106)

Logger used by this runtime context and its libraries.

#### Inherited from

[`LibraryRuntimeContext`](../@fgv/namespaces/LibraryRuntime/classes/LibraryRuntimeContext.md).[`logger`](../@fgv/namespaces/LibraryRuntime/classes/LibraryRuntimeContext.md#logger)

## Accessors

### cachedConfectionCount

#### Get Signature

> **get** **cachedConfectionCount**(): `number`

Defined in: [ts-chocolate/src/packlets/library-runtime/libraryRuntimeContext.ts:494](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/libraryRuntimeContext.ts#L494)

Gets the number of cached confections.

##### Returns

`number`

Gets the number of cached confections.

#### Implementation of

[`IRuntimeContext`](../@fgv/namespaces/Runtime/interfaces/IRuntimeContext.md).[`cachedConfectionCount`](../@fgv/namespaces/Runtime/interfaces/IRuntimeContext.md#cachedconfectioncount)

#### Inherited from

[`LibraryRuntimeContext`](../@fgv/namespaces/LibraryRuntime/classes/LibraryRuntimeContext.md).[`cachedConfectionCount`](../@fgv/namespaces/LibraryRuntime/classes/LibraryRuntimeContext.md#cachedconfectioncount)

***

### cachedIngredientCount

#### Get Signature

> **get** **cachedIngredientCount**(): `number`

Defined in: [ts-chocolate/src/packlets/library-runtime/libraryRuntimeContext.ts:480](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/libraryRuntimeContext.ts#L480)

Gets the number of cached ingredients.

##### Returns

`number`

Gets the number of cached ingredients.

#### Implementation of

[`IRuntimeContext`](../@fgv/namespaces/Runtime/interfaces/IRuntimeContext.md).[`cachedIngredientCount`](../@fgv/namespaces/Runtime/interfaces/IRuntimeContext.md#cachedingredientcount)

#### Inherited from

[`LibraryRuntimeContext`](../@fgv/namespaces/LibraryRuntime/classes/LibraryRuntimeContext.md).[`cachedIngredientCount`](../@fgv/namespaces/LibraryRuntime/classes/LibraryRuntimeContext.md#cachedingredientcount)

***

### cachedRecipeCount

#### Get Signature

> **get** **cachedRecipeCount**(): `number`

Defined in: [ts-chocolate/src/packlets/library-runtime/libraryRuntimeContext.ts:487](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/libraryRuntimeContext.ts#L487)

Gets the number of cached recipes.

##### Returns

`number`

Gets the number of cached recipes.

#### Implementation of

[`IRuntimeContext`](../@fgv/namespaces/Runtime/interfaces/IRuntimeContext.md).[`cachedRecipeCount`](../@fgv/namespaces/Runtime/interfaces/IRuntimeContext.md#cachedrecipecount)

#### Inherited from

[`LibraryRuntimeContext`](../@fgv/namespaces/LibraryRuntime/classes/LibraryRuntimeContext.md).[`cachedRecipeCount`](../@fgv/namespaces/LibraryRuntime/classes/LibraryRuntimeContext.md#cachedrecipecount)

***

### confections

#### Get Signature

> **get** **confections**(): [`MaterializedLibrary`](../@fgv/namespaces/LibraryRuntime/classes/MaterializedLibrary.md)\<[`ConfectionId`](../type-aliases/ConfectionId.md), [`AnyConfectionEntity`](../@fgv/namespaces/Entities/type-aliases/AnyConfectionEntity.md), [`AnyConfection`](../@fgv/namespaces/LibraryRuntime/type-aliases/AnyConfection.md), `never`\>

Defined in: [ts-chocolate/src/packlets/library-runtime/libraryRuntimeContext.ts:192](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/libraryRuntimeContext.ts#L192)

A materialized library of all confections, keyed by composite ID.
Confections are resolved lazily on access and cached.

##### Returns

[`MaterializedLibrary`](../@fgv/namespaces/LibraryRuntime/classes/MaterializedLibrary.md)\<[`ConfectionId`](../type-aliases/ConfectionId.md), [`AnyConfectionEntity`](../@fgv/namespaces/Entities/type-aliases/AnyConfectionEntity.md), [`AnyConfection`](../@fgv/namespaces/LibraryRuntime/type-aliases/AnyConfection.md), `never`\>

Materialized library of runtime confections.
Used for parent navigation from versions.

#### Implementation of

[`IRuntimeContext`](../@fgv/namespaces/Runtime/interfaces/IRuntimeContext.md).[`confections`](../@fgv/namespaces/Runtime/interfaces/IRuntimeContext.md#confections)

#### Inherited from

[`LibraryRuntimeContext`](../@fgv/namespaces/LibraryRuntime/classes/LibraryRuntimeContext.md).[`confections`](../@fgv/namespaces/LibraryRuntime/classes/LibraryRuntimeContext.md#confections)

***

### fillings

#### Get Signature

> **get** **fillings**(): [`MaterializedLibrary`](../@fgv/namespaces/LibraryRuntime/classes/MaterializedLibrary.md)\<[`FillingId`](../type-aliases/FillingId.md), [`IFillingRecipeEntity`](../@fgv/namespaces/Entities/interfaces/IFillingRecipeEntity.md), [`FillingRecipe`](../@fgv/namespaces/LibraryRuntime/classes/FillingRecipe.md), [`IFillingRecipeQuerySpec`](../@fgv/namespaces/LibraryRuntime/namespaces/Indexers/interfaces/IFillingRecipeQuerySpec.md)\>

Defined in: [ts-chocolate/src/packlets/library-runtime/libraryRuntimeContext.ts:266](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/libraryRuntimeContext.ts#L266)

A searchable library of all fillings, keyed by composite ID.
Fillings are resolved lazily on access and cached.

##### Returns

[`MaterializedLibrary`](../@fgv/namespaces/LibraryRuntime/classes/MaterializedLibrary.md)\<[`FillingId`](../type-aliases/FillingId.md), [`IFillingRecipeEntity`](../@fgv/namespaces/Entities/interfaces/IFillingRecipeEntity.md), [`FillingRecipe`](../@fgv/namespaces/LibraryRuntime/classes/FillingRecipe.md), [`IFillingRecipeQuerySpec`](../@fgv/namespaces/LibraryRuntime/namespaces/Indexers/interfaces/IFillingRecipeQuerySpec.md)\>

Map of all fillings, keyed by composite ID.

#### Implementation of

[`IRuntimeContext`](../@fgv/namespaces/Runtime/interfaces/IRuntimeContext.md).[`fillings`](../@fgv/namespaces/Runtime/interfaces/IRuntimeContext.md#fillings)

#### Inherited from

[`LibraryRuntimeContext`](../@fgv/namespaces/LibraryRuntime/classes/LibraryRuntimeContext.md).[`fillings`](../@fgv/namespaces/LibraryRuntime/classes/LibraryRuntimeContext.md#fillings)

***

### ingredients

#### Get Signature

> **get** **ingredients**(): [`MaterializedLibrary`](../@fgv/namespaces/LibraryRuntime/classes/MaterializedLibrary.md)\<[`IngredientId`](../type-aliases/IngredientId.md), [`IngredientEntity`](../@fgv/namespaces/Entities/type-aliases/IngredientEntity.md), [`AnyIngredient`](../@fgv/namespaces/LibraryRuntime/type-aliases/AnyIngredient.md), [`IIngredientQuerySpec`](../@fgv/namespaces/LibraryRuntime/namespaces/Indexers/interfaces/IIngredientQuerySpec.md)\>

Defined in: [ts-chocolate/src/packlets/library-runtime/libraryRuntimeContext.ts:253](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/libraryRuntimeContext.ts#L253)

A searchable library of all ingredients, keyed by composite ID.
Ingredients are resolved lazily on access and cached.

##### Returns

[`MaterializedLibrary`](../@fgv/namespaces/LibraryRuntime/classes/MaterializedLibrary.md)\<[`IngredientId`](../type-aliases/IngredientId.md), [`IngredientEntity`](../@fgv/namespaces/Entities/type-aliases/IngredientEntity.md), [`AnyIngredient`](../@fgv/namespaces/LibraryRuntime/type-aliases/AnyIngredient.md), [`IIngredientQuerySpec`](../@fgv/namespaces/LibraryRuntime/namespaces/Indexers/interfaces/IIngredientQuerySpec.md)\>

Map of all ingredients, keyed by composite ID.

#### Implementation of

[`IRuntimeContext`](../@fgv/namespaces/Runtime/interfaces/IRuntimeContext.md).[`ingredients`](../@fgv/namespaces/Runtime/interfaces/IRuntimeContext.md#ingredients)

#### Inherited from

[`LibraryRuntimeContext`](../@fgv/namespaces/LibraryRuntime/classes/LibraryRuntimeContext.md).[`ingredients`](../@fgv/namespaces/LibraryRuntime/classes/LibraryRuntimeContext.md#ingredients)

***

### library

#### Get Signature

> **get** **library**(): [`ChocolateLibrary`](ChocolateLibrary.md)

Defined in: [ts-chocolate/src/packlets/library-runtime/libraryRuntimeContext.ts:180](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/libraryRuntimeContext.ts#L180)

The underlying ChocolateLibrary for direct access when needed.

##### Returns

[`ChocolateLibrary`](ChocolateLibrary.md)

The underlying ChocolateLibrary for direct access when needed.

#### Implementation of

[`IRuntimeContext`](../@fgv/namespaces/Runtime/interfaces/IRuntimeContext.md).[`library`](../@fgv/namespaces/Runtime/interfaces/IRuntimeContext.md#library)

#### Inherited from

[`LibraryRuntimeContext`](../@fgv/namespaces/LibraryRuntime/classes/LibraryRuntimeContext.md).[`library`](../@fgv/namespaces/LibraryRuntime/classes/LibraryRuntimeContext.md#library)

***

### molds

#### Get Signature

> **get** **molds**(): [`MaterializedLibrary`](../@fgv/namespaces/LibraryRuntime/classes/MaterializedLibrary.md)\<[`MoldId`](../type-aliases/MoldId.md), [`IMoldEntity`](../@fgv/namespaces/Entities/interfaces/IMoldEntity.md), [`Mold`](../@fgv/namespaces/LibraryRuntime/classes/Mold.md), `never`\>

Defined in: [ts-chocolate/src/packlets/library-runtime/libraryRuntimeContext.ts:205](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/libraryRuntimeContext.ts#L205)

A materialized library of all molds, keyed by composite ID.
Molds are resolved lazily on access and cached.

##### Returns

[`MaterializedLibrary`](../@fgv/namespaces/LibraryRuntime/classes/MaterializedLibrary.md)\<[`MoldId`](../type-aliases/MoldId.md), [`IMoldEntity`](../@fgv/namespaces/Entities/interfaces/IMoldEntity.md), [`Mold`](../@fgv/namespaces/LibraryRuntime/classes/Mold.md), `never`\>

Materialized library of runtime molds.
Used for resolving mold references.

#### Implementation of

[`IRuntimeContext`](../@fgv/namespaces/Runtime/interfaces/IRuntimeContext.md).[`molds`](../@fgv/namespaces/Runtime/interfaces/IRuntimeContext.md#molds)

#### Inherited from

[`LibraryRuntimeContext`](../@fgv/namespaces/LibraryRuntime/classes/LibraryRuntimeContext.md).[`molds`](../@fgv/namespaces/LibraryRuntime/classes/LibraryRuntimeContext.md#molds)

***

### procedures

#### Get Signature

> **get** **procedures**(): [`MaterializedLibrary`](../@fgv/namespaces/LibraryRuntime/classes/MaterializedLibrary.md)\<[`ProcedureId`](../type-aliases/ProcedureId.md), [`IProcedureEntity`](../@fgv/namespaces/Entities/interfaces/IProcedureEntity.md), [`Procedure`](../@fgv/namespaces/LibraryRuntime/classes/Procedure.md), `never`\>

Defined in: [ts-chocolate/src/packlets/library-runtime/libraryRuntimeContext.ts:213](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/libraryRuntimeContext.ts#L213)

A materialized library of all procedures, keyed by composite ID.
Procedures are resolved lazily on access and cached.

##### Returns

[`MaterializedLibrary`](../@fgv/namespaces/LibraryRuntime/classes/MaterializedLibrary.md)\<[`ProcedureId`](../type-aliases/ProcedureId.md), [`IProcedureEntity`](../@fgv/namespaces/Entities/interfaces/IProcedureEntity.md), [`Procedure`](../@fgv/namespaces/LibraryRuntime/classes/Procedure.md), `never`\>

Map of all procedures, keyed by composite ID.

#### Implementation of

[`IRuntimeContext`](../@fgv/namespaces/Runtime/interfaces/IRuntimeContext.md).[`procedures`](../@fgv/namespaces/Runtime/interfaces/IRuntimeContext.md#procedures)

#### Inherited from

[`LibraryRuntimeContext`](../@fgv/namespaces/LibraryRuntime/classes/LibraryRuntimeContext.md).[`procedures`](../@fgv/namespaces/LibraryRuntime/classes/LibraryRuntimeContext.md#procedures)

***

### tasks

#### Get Signature

> **get** **tasks**(): [`MaterializedLibrary`](../@fgv/namespaces/LibraryRuntime/classes/MaterializedLibrary.md)\<[`TaskId`](../type-aliases/TaskId.md), [`IRawTaskEntity`](../@fgv/namespaces/Entities/interfaces/IRawTaskEntity.md), [`Task`](../@fgv/namespaces/LibraryRuntime/classes/Task.md), `never`\>

Defined in: [ts-chocolate/src/packlets/library-runtime/libraryRuntimeContext.ts:221](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/libraryRuntimeContext.ts#L221)

A materialized library of all tasks, keyed by composite ID.
Tasks are resolved lazily on access and cached.

##### Returns

[`MaterializedLibrary`](../@fgv/namespaces/LibraryRuntime/classes/MaterializedLibrary.md)\<[`TaskId`](../type-aliases/TaskId.md), [`IRawTaskEntity`](../@fgv/namespaces/Entities/interfaces/IRawTaskEntity.md), [`Task`](../@fgv/namespaces/LibraryRuntime/classes/Task.md), `never`\>

A materialized library of all tasks, keyed by composite ID.
Tasks are resolved lazily on access and cached.
Use `.get(id)` for ID-based lookup, `.has(id)` for existence checks,
`.values()` for iteration.

#### Implementation of

[`IRuntimeContext`](../@fgv/namespaces/Runtime/interfaces/IRuntimeContext.md).[`tasks`](../@fgv/namespaces/Runtime/interfaces/IRuntimeContext.md#tasks)

#### Inherited from

[`LibraryRuntimeContext`](../@fgv/namespaces/LibraryRuntime/classes/LibraryRuntimeContext.md).[`tasks`](../@fgv/namespaces/LibraryRuntime/classes/LibraryRuntimeContext.md#tasks)

## Methods

### clearCache()

> **clearCache**(): `void`

Defined in: [ts-chocolate/src/packlets/library-runtime/libraryRuntimeContext.ts:502](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/libraryRuntimeContext.ts#L502)

Clears all cached runtime objects.
Use if underlying library data has changed.

#### Returns

`void`

#### Implementation of

[`IRuntimeContext`](../@fgv/namespaces/Runtime/interfaces/IRuntimeContext.md).[`clearCache`](../@fgv/namespaces/Runtime/interfaces/IRuntimeContext.md#clearcache)

#### Inherited from

[`LibraryRuntimeContext`](../@fgv/namespaces/LibraryRuntime/classes/LibraryRuntimeContext.md).[`clearCache`](../@fgv/namespaces/LibraryRuntime/classes/LibraryRuntimeContext.md#clearcache)

***

### createFillingSession()

> **createFillingSession**(`filling`, `targetWeight`): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`EditingSession`](../@fgv/namespaces/Runtime/namespaces/Session/classes/EditingSession.md)\>

Defined in: [ts-chocolate/src/packlets/runtime/runtimeContext.ts:116](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/runtime/runtimeContext.ts#L116)

Creates an editing session for a filling recipe at a target weight.
Used by confection sessions to manage filling scaling.

#### Parameters

##### filling

[`IFillingRecipe`](../@fgv/namespaces/LibraryRuntime/interfaces/IFillingRecipe.md)

The runtime filling recipe

##### targetWeight

[`Measurement`](../type-aliases/Measurement.md)

Target weight for the filling in grams

#### Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`EditingSession`](../@fgv/namespaces/Runtime/namespaces/Session/classes/EditingSession.md)\>

Success with EditingSession, or Failure if creation fails

#### Implementation of

[`IRuntimeContext`](../@fgv/namespaces/Runtime/interfaces/IRuntimeContext.md).[`createFillingSession`](../@fgv/namespaces/Runtime/interfaces/IRuntimeContext.md#createfillingsession)

***

### createWeightContext()

> **createWeightContext**(): [`IWeightCalculationContext`](../@fgv/namespaces/LibraryRuntime/namespaces/Internal/interfaces/IWeightCalculationContext.md)

Defined in: [ts-chocolate/src/packlets/library-runtime/libraryRuntimeContext.ts:540](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/libraryRuntimeContext.ts#L540)

Creates a weight calculation context for unit-aware weight calculations.
The context resolves ingredient IDs to their density values.

#### Returns

[`IWeightCalculationContext`](../@fgv/namespaces/LibraryRuntime/namespaces/Internal/interfaces/IWeightCalculationContext.md)

A weight calculation context bound to this runtime's library

#### Inherited from

[`LibraryRuntimeContext`](../@fgv/namespaces/LibraryRuntime/classes/LibraryRuntimeContext.md).[`createWeightContext`](../@fgv/namespaces/LibraryRuntime/classes/LibraryRuntimeContext.md#createweightcontext)

***

### getAllConfectionTags()

> **getAllConfectionTags**(): readonly `string`[]

Defined in: [ts-chocolate/src/packlets/library-runtime/libraryRuntimeContext.ts:462](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/libraryRuntimeContext.ts#L462)

Gets all unique tags used across confections.

#### Returns

readonly `string`[]

#### Implementation of

[`IRuntimeContext`](../@fgv/namespaces/Runtime/interfaces/IRuntimeContext.md).[`getAllConfectionTags`](../@fgv/namespaces/Runtime/interfaces/IRuntimeContext.md#getallconfectiontags)

#### Inherited from

[`LibraryRuntimeContext`](../@fgv/namespaces/LibraryRuntime/classes/LibraryRuntimeContext.md).[`getAllConfectionTags`](../@fgv/namespaces/LibraryRuntime/classes/LibraryRuntimeContext.md#getallconfectiontags)

***

### getAllFillingTags()

> **getAllFillingTags**(): readonly `string`[]

Defined in: [ts-chocolate/src/packlets/library-runtime/libraryRuntimeContext.ts:448](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/libraryRuntimeContext.ts#L448)

Gets all unique tags used across fillings.

#### Returns

readonly `string`[]

#### Implementation of

[`IRuntimeContext`](../@fgv/namespaces/Runtime/interfaces/IRuntimeContext.md).[`getAllFillingTags`](../@fgv/namespaces/Runtime/interfaces/IRuntimeContext.md#getallfillingtags)

#### Inherited from

[`LibraryRuntimeContext`](../@fgv/namespaces/LibraryRuntime/classes/LibraryRuntimeContext.md).[`getAllFillingTags`](../@fgv/namespaces/LibraryRuntime/classes/LibraryRuntimeContext.md#getallfillingtags)

***

### getAllIngredientTags()

> **getAllIngredientTags**(): readonly `string`[]

Defined in: [ts-chocolate/src/packlets/library-runtime/libraryRuntimeContext.ts:455](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/libraryRuntimeContext.ts#L455)

Gets all unique tags used across ingredients.

#### Returns

readonly `string`[]

#### Implementation of

[`IRuntimeContext`](../@fgv/namespaces/Runtime/interfaces/IRuntimeContext.md).[`getAllIngredientTags`](../@fgv/namespaces/Runtime/interfaces/IRuntimeContext.md#getallingredienttags)

#### Inherited from

[`LibraryRuntimeContext`](../@fgv/namespaces/LibraryRuntime/classes/LibraryRuntimeContext.md).[`getAllIngredientTags`](../@fgv/namespaces/LibraryRuntime/classes/LibraryRuntimeContext.md#getallingredienttags)

***

### getIngredientUsage()

> **getIngredientUsage**(`ingredientId`): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<readonly [`IIngredientUsageInfo`](../@fgv/namespaces/LibraryRuntime/interfaces/IIngredientUsageInfo.md)[]\>

Defined in: [ts-chocolate/src/packlets/library-runtime/libraryRuntimeContext.ts:434](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/libraryRuntimeContext.ts#L434)

Gets detailed usage information for an ingredient.

#### Parameters

##### ingredientId

[`IngredientId`](../type-aliases/IngredientId.md)

The ingredient ID to look up

#### Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<readonly [`IIngredientUsageInfo`](../@fgv/namespaces/LibraryRuntime/interfaces/IIngredientUsageInfo.md)[]\>

Success with array of usage info, or Failure if ingredient doesn't exist

#### Implementation of

[`IRuntimeContext`](../@fgv/namespaces/Runtime/interfaces/IRuntimeContext.md).[`getIngredientUsage`](../@fgv/namespaces/Runtime/interfaces/IRuntimeContext.md#getingredientusage)

#### Inherited from

[`LibraryRuntimeContext`](../@fgv/namespaces/LibraryRuntime/classes/LibraryRuntimeContext.md).[`getIngredientUsage`](../@fgv/namespaces/LibraryRuntime/classes/LibraryRuntimeContext.md#getingredientusage)

***

### invalidateIndexers()

> **invalidateIndexers**(): `void`

Defined in: [ts-chocolate/src/packlets/library-runtime/libraryRuntimeContext.ts:529](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/libraryRuntimeContext.ts#L529)

Invalidates all indexer caches.
Call this when underlying library data changes.

#### Returns

`void`

#### Inherited from

[`LibraryRuntimeContext`](../@fgv/namespaces/LibraryRuntime/classes/LibraryRuntimeContext.md).[`invalidateIndexers`](../@fgv/namespaces/LibraryRuntime/classes/LibraryRuntimeContext.md#invalidateindexers)

***

### warmUp()

> **warmUp**(): `void`

Defined in: [ts-chocolate/src/packlets/library-runtime/libraryRuntimeContext.ts:518](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/library-runtime/libraryRuntimeContext.ts#L518)

Pre-warms the reverse indexes for efficient queries.

#### Returns

`void`

#### Implementation of

[`IRuntimeContext`](../@fgv/namespaces/Runtime/interfaces/IRuntimeContext.md).[`warmUp`](../@fgv/namespaces/Runtime/interfaces/IRuntimeContext.md#warmup)

#### Inherited from

[`LibraryRuntimeContext`](../@fgv/namespaces/LibraryRuntime/classes/LibraryRuntimeContext.md).[`warmUp`](../@fgv/namespaces/LibraryRuntime/classes/LibraryRuntimeContext.md#warmup)

***

### create()

> `static` **create**(`params?`): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`RuntimeContext`\>

Defined in: [ts-chocolate/src/packlets/runtime/runtimeContext.ts:88](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/runtime/runtimeContext.ts#L88)

Creates a RuntimeContext with a new or default ChocolateLibrary.
This is the primary factory method for most use cases.

#### Parameters

##### params?

[`IRuntimeContextCreateParams`](../@fgv/namespaces/Runtime/interfaces/IRuntimeContextCreateParams.md)

Optional parameters for library and caching

#### Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`RuntimeContext`\>

Success with RuntimeContext, or Failure if library creation fails

#### Overrides

[`LibraryRuntimeContext`](../@fgv/namespaces/LibraryRuntime/classes/LibraryRuntimeContext.md).[`create`](../@fgv/namespaces/LibraryRuntime/classes/LibraryRuntimeContext.md#create)

***

### fromLibrary()

> `static` **fromLibrary**(`library`, `preWarm?`): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`RuntimeContext`\>

Defined in: [ts-chocolate/src/packlets/runtime/runtimeContext.ts:101](https://github.com/ErikFortune/fgv/blob/6a81ac1979f777618ccb57679446c91700746f00/libraries/ts-chocolate/src/packlets/runtime/runtimeContext.ts#L101)

Creates a RuntimeContext wrapping an existing ChocolateLibrary.
Use this when you already have a configured library instance.

#### Parameters

##### library

[`ChocolateLibrary`](ChocolateLibrary.md)

The ChocolateLibrary to wrap

##### preWarm?

`boolean`

Whether to pre-warm the reverse index

#### Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`RuntimeContext`\>

Success with RuntimeContext

#### Overrides

[`LibraryRuntimeContext`](../@fgv/namespaces/LibraryRuntime/classes/LibraryRuntimeContext.md).[`fromLibrary`](../@fgv/namespaces/LibraryRuntime/classes/LibraryRuntimeContext.md#fromlibrary)
