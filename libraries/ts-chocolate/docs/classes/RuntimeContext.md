[Home](../README.md) > RuntimeContext

# Class: RuntimeContext

Full runtime context with session creation capabilities.

Extends LibraryRuntimeContext with the ability to create editing sessions
for filling recipes. This is the primary entry point for consumers who
need both library resolution and session management.

**Extends:** [`LibraryRuntimeContext`](LibraryRuntimeContext.md)

**Implements:** [`ISessionContext`](../interfaces/ISessionContext.md), [`IRuntimeContext`](../interfaces/IRuntimeContext.md)

## Properties

<table><thead><tr><th>

Property

</th><th>

Modifiers

</th><th>

Type

</th><th>

Description

</th></tr></thead>
<tbody>
<tr><td>

[logger](./LibraryRuntimeContext.logger.md)

</td><td>

`readonly`

</td><td>

LogReporter&lt;unknown&gt;

</td><td>

Logger used by this runtime context and its libraries.

</td></tr>
<tr><td>

[library](./LibraryRuntimeContext.library.md)

</td><td>

`readonly`

</td><td>

[ChocolateLibrary](ChocolateLibrary.md)

</td><td>

The underlying ChocolateLibrary for direct access when needed.

</td></tr>
<tr><td>

[confections](./LibraryRuntimeContext.confections.md)

</td><td>

`readonly`

</td><td>

[MaterializedLibrary](MaterializedLibrary.md)&lt;[ConfectionId](../type-aliases/ConfectionId.md), [AnyConfectionRecipeEntity](../type-aliases/AnyConfectionRecipeEntity.md), [AnyConfection](../type-aliases/AnyConfection.md), never&gt;

</td><td>

A materialized library of all confections, keyed by composite ID.

</td></tr>
<tr><td>

[molds](./LibraryRuntimeContext.molds.md)

</td><td>

`readonly`

</td><td>

[MaterializedLibrary](MaterializedLibrary.md)&lt;[MoldId](../type-aliases/MoldId.md), [IMoldEntity](../interfaces/IMoldEntity.md), [Mold](Mold.md), never&gt;

</td><td>

A materialized library of all molds, keyed by composite ID.

</td></tr>
<tr><td>

[procedures](./LibraryRuntimeContext.procedures.md)

</td><td>

`readonly`

</td><td>

[MaterializedLibrary](MaterializedLibrary.md)&lt;[ProcedureId](../type-aliases/ProcedureId.md), [IProcedureEntity](../interfaces/IProcedureEntity.md), [Procedure](Procedure.md), never&gt;

</td><td>

A materialized library of all procedures, keyed by composite ID.

</td></tr>
<tr><td>

[tasks](./LibraryRuntimeContext.tasks.md)

</td><td>

`readonly`

</td><td>

[MaterializedLibrary](MaterializedLibrary.md)&lt;[TaskId](../type-aliases/TaskId.md), [IRawTaskEntity](../interfaces/IRawTaskEntity.md), [Task](Task.md), never&gt;

</td><td>

A materialized library of all tasks, keyed by composite ID.

</td></tr>
<tr><td>

[ingredients](./LibraryRuntimeContext.ingredients.md)

</td><td>

`readonly`

</td><td>

[MaterializedLibrary](MaterializedLibrary.md)&lt;[IngredientId](../type-aliases/IngredientId.md), [IngredientEntity](../type-aliases/IngredientEntity.md), [AnyIngredient](../type-aliases/AnyIngredient.md), [IIngredientQuerySpec](../interfaces/IIngredientQuerySpec.md)&gt;

</td><td>

A searchable library of all ingredients, keyed by composite ID.

</td></tr>
<tr><td>

[fillings](./LibraryRuntimeContext.fillings.md)

</td><td>

`readonly`

</td><td>

[MaterializedLibrary](MaterializedLibrary.md)&lt;[FillingId](../type-aliases/FillingId.md), [IFillingRecipeEntity](../interfaces/IFillingRecipeEntity.md), [FillingRecipe](FillingRecipe.md), [IFillingRecipeQuerySpec](../interfaces/IFillingRecipeQuerySpec.md)&gt;

</td><td>

A searchable library of all fillings, keyed by composite ID.

</td></tr>
<tr><td>

[cachedIngredientCount](./LibraryRuntimeContext.cachedIngredientCount.md)

</td><td>

`readonly`

</td><td>

number

</td><td>

Gets the number of cached ingredients.

</td></tr>
<tr><td>

[cachedRecipeCount](./LibraryRuntimeContext.cachedRecipeCount.md)

</td><td>

`readonly`

</td><td>

number

</td><td>

Gets the number of cached recipes.

</td></tr>
<tr><td>

[cachedConfectionCount](./LibraryRuntimeContext.cachedConfectionCount.md)

</td><td>

`readonly`

</td><td>

number

</td><td>

Gets the number of cached confections.

</td></tr>
</tbody></table>

## Methods

<table><thead><tr><th>

Method

</th><th>

Modifiers

</th><th>

Description

</th></tr></thead>
<tbody>
<tr><td>

[create(params)](./RuntimeContext.create.md)

</td><td>

`static`

</td><td>

Creates a RuntimeContext with a new or default ChocolateLibrary.

</td></tr>
<tr><td>

[fromLibrary(library, preWarm)](./RuntimeContext.fromLibrary.md)

</td><td>

`static`

</td><td>

Creates a RuntimeContext wrapping an existing ChocolateLibrary.

</td></tr>
<tr><td>

[createFillingSession(filling, targetWeight)](./RuntimeContext.createFillingSession.md)

</td><td>



</td><td>

Creates an editing session for a filling recipe at a target weight.

</td></tr>
<tr><td>

[getIngredientUsage(ingredientId)](./LibraryRuntimeContext.getIngredientUsage.md)

</td><td>



</td><td>

Gets detailed usage information for an ingredient.

</td></tr>
<tr><td>

[getAllFillingTags()](./LibraryRuntimeContext.getAllFillingTags.md)

</td><td>



</td><td>

Gets all unique tags used across fillings.

</td></tr>
<tr><td>

[getAllIngredientTags()](./LibraryRuntimeContext.getAllIngredientTags.md)

</td><td>



</td><td>

Gets all unique tags used across ingredients.

</td></tr>
<tr><td>

[getAllConfectionTags()](./LibraryRuntimeContext.getAllConfectionTags.md)

</td><td>



</td><td>

Gets all unique tags used across confections.

</td></tr>
<tr><td>

[clearCache()](./LibraryRuntimeContext.clearCache.md)

</td><td>



</td><td>

Clears all cached runtime objects.

</td></tr>
<tr><td>

[warmUp()](./LibraryRuntimeContext.warmUp.md)

</td><td>



</td><td>

Pre-warms the reverse indexes for efficient queries.

</td></tr>
<tr><td>

[invalidateIndexers()](./LibraryRuntimeContext.invalidateIndexers.md)

</td><td>



</td><td>

Invalidates all indexer caches.

</td></tr>
<tr><td>

[createWeightContext()](./LibraryRuntimeContext.createWeightContext.md)

</td><td>



</td><td>

Creates a weight calculation context for unit-aware weight calculations.

</td></tr>
</tbody></table>
