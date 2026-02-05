[Home](../README.md) > IRuntimeContext

# Interface: IRuntimeContext

Full runtime context interface with session capabilities.

Extends ILibraryRuntimeContext with:
- Session creation methods
- Confection access and caching

This is the complete entry point for consumers who need both
library resolution and session management.

**Extends:** [`ILibraryRuntimeContext`](ILibraryRuntimeContext.md)

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

[cachedConfectionCount](./IRuntimeContext.cachedConfectionCount.md)

</td><td>

`readonly`

</td><td>

number

</td><td>

Gets the number of cached confections.

</td></tr>
<tr><td>

[library](./ILibraryRuntimeContext.library.md)

</td><td>

`readonly`

</td><td>

[ChocolateLibrary](../classes/ChocolateLibrary.md)

</td><td>

The underlying ChocolateLibrary for direct access when needed.

</td></tr>
<tr><td>

[molds](./ILibraryRuntimeContext.molds.md)

</td><td>

`readonly`

</td><td>

[MaterializedLibrary](../classes/MaterializedLibrary.md)&lt;[MoldId](../type-aliases/MoldId.md), [IMoldEntity](IMoldEntity.md), [IMold](IMold.md), never&gt;

</td><td>

A materialized library of all molds, keyed by composite ID.

</td></tr>
<tr><td>

[procedures](./ILibraryRuntimeContext.procedures.md)

</td><td>

`readonly`

</td><td>

[MaterializedLibrary](../classes/MaterializedLibrary.md)&lt;[ProcedureId](../type-aliases/ProcedureId.md), [IProcedureEntity](IProcedureEntity.md), [IProcedure](IProcedure.md), never&gt;

</td><td>

A materialized library of all procedures, keyed by composite ID.

</td></tr>
<tr><td>

[tasks](./ILibraryRuntimeContext.tasks.md)

</td><td>

`readonly`

</td><td>

[MaterializedLibrary](../classes/MaterializedLibrary.md)&lt;[TaskId](../type-aliases/TaskId.md), [IRawTaskEntity](IRawTaskEntity.md), [ITask](ITask.md), never&gt;

</td><td>

A materialized library of all tasks, keyed by composite ID.

</td></tr>
<tr><td>

[confections](./ILibraryRuntimeContext.confections.md)

</td><td>

`readonly`

</td><td>

[MaterializedLibrary](../classes/MaterializedLibrary.md)&lt;[ConfectionId](../type-aliases/ConfectionId.md), [AnyConfectionEntity](../type-aliases/AnyConfectionEntity.md), [IConfectionBase](IConfectionBase.md)&lt;[AnyConfectionVersion](../type-aliases/AnyConfectionVersion.md), [AnyConfectionEntity](../type-aliases/AnyConfectionEntity.md)&gt;, never&gt;

</td><td>

A materialized library of all confections, keyed by composite ID.

</td></tr>
<tr><td>

[cachedIngredientCount](./ILibraryRuntimeContext.cachedIngredientCount.md)

</td><td>

`readonly`

</td><td>

number

</td><td>

Gets the number of cached ingredients.

</td></tr>
<tr><td>

[cachedRecipeCount](./ILibraryRuntimeContext.cachedRecipeCount.md)

</td><td>

`readonly`

</td><td>

number

</td><td>

Gets the number of cached recipes.

</td></tr>
<tr><td>

[ingredients](./ILibraryRuntimeContext.ingredients.md)

</td><td>

`readonly`

</td><td>

[MaterializedLibrary](../classes/MaterializedLibrary.md)&lt;[IngredientId](../type-aliases/IngredientId.md), [IngredientEntity](../type-aliases/IngredientEntity.md), [AnyIngredient](../type-aliases/AnyIngredient.md), [IIngredientQuerySpec](IIngredientQuerySpec.md)&gt;

</td><td>

Map of all ingredients, keyed by composite ID.

</td></tr>
<tr><td>

[fillings](./ILibraryRuntimeContext.fillings.md)

</td><td>

`readonly`

</td><td>

[MaterializedLibrary](../classes/MaterializedLibrary.md)&lt;[FillingId](../type-aliases/FillingId.md), [IFillingRecipeEntity](IFillingRecipeEntity.md), [IFillingRecipe](IFillingRecipe.md), [IFillingRecipeQuerySpec](IFillingRecipeQuerySpec.md)&gt;

</td><td>

Map of all fillings, keyed by composite ID.

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

[getAllConfectionTags()](./IRuntimeContext.getAllConfectionTags.md)

</td><td>



</td><td>

Gets all unique tags used across confections.

</td></tr>
<tr><td>

[createFillingSession(filling, targetWeight)](./IRuntimeContext.createFillingSession.md)

</td><td>



</td><td>

Creates an editing session for a filling recipe at a target weight.

</td></tr>
<tr><td>

[getIngredientUsage(ingredientId)](./ILibraryRuntimeContext.getIngredientUsage.md)

</td><td>



</td><td>

Gets detailed usage information for an ingredient.

</td></tr>
<tr><td>

[getAllFillingTags()](./ILibraryRuntimeContext.getAllFillingTags.md)

</td><td>



</td><td>

Gets all unique tags used across fillings.

</td></tr>
<tr><td>

[getAllIngredientTags()](./ILibraryRuntimeContext.getAllIngredientTags.md)

</td><td>



</td><td>

Gets all unique tags used across ingredients.

</td></tr>
<tr><td>

[clearCache()](./ILibraryRuntimeContext.clearCache.md)

</td><td>



</td><td>

Clears all cached runtime objects.

</td></tr>
<tr><td>

[warmUp()](./ILibraryRuntimeContext.warmUp.md)

</td><td>



</td><td>

Pre-warms the reverse indexes for efficient queries.

</td></tr>
</tbody></table>
