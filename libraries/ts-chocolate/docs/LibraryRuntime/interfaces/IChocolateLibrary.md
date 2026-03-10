[Home](../../README.md) > [LibraryRuntime](../README.md) > IChocolateLibrary

# Interface: IChocolateLibrary

Central context for the library materialized object access layer.

Provides:
- Primary resolution methods for ingredients and recipes
- Reverse lookups (ingredient → recipes, tag → entities)
- Recipe operations (scaling, ganache calculation)
- Cache management
- Iteration over all entities

This is the main entry point for consumers who want resolved views
of recipes and ingredients with automatic reference resolution.

Note: For session creation capabilities, use UserLibrary (which implements ISessionContext) from the user-library packlet.

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

[entities](./IChocolateLibrary.entities.md)

</td><td>

`readonly`

</td><td>

[ChocolateEntityLibrary](../../classes/ChocolateEntityLibrary.md)

</td><td>

The underlying ChocolateEntityLibrary for direct access when needed.

</td></tr>
<tr><td>

[molds](./IChocolateLibrary.molds.md)

</td><td>

`readonly`

</td><td>

[MaterializedLibrary](../../classes/MaterializedLibrary.md)&lt;[MoldId](../../type-aliases/MoldId.md), [IMoldEntity](../../interfaces/IMoldEntity.md), [IMold](../../interfaces/IMold.md), never&gt;

</td><td>

A materialized library of all molds, keyed by composite ID.

</td></tr>
<tr><td>

[procedures](./IChocolateLibrary.procedures.md)

</td><td>

`readonly`

</td><td>

[MaterializedLibrary](../../classes/MaterializedLibrary.md)&lt;[ProcedureId](../../type-aliases/ProcedureId.md), [IProcedureEntity](../../interfaces/IProcedureEntity.md), [IProcedure](../../interfaces/IProcedure.md), never&gt;

</td><td>

A materialized library of all procedures, keyed by composite ID.

</td></tr>
<tr><td>

[tasks](./IChocolateLibrary.tasks.md)

</td><td>

`readonly`

</td><td>

[MaterializedLibrary](../../classes/MaterializedLibrary.md)&lt;[TaskId](../../type-aliases/TaskId.md), [IRawTaskEntity](../../interfaces/IRawTaskEntity.md), [ITask](../../interfaces/ITask.md), never&gt;

</td><td>

A materialized library of all tasks, keyed by composite ID.

</td></tr>
<tr><td>

[confections](./IChocolateLibrary.confections.md)

</td><td>

`readonly`

</td><td>

[MaterializedLibrary](../../classes/MaterializedLibrary.md)&lt;[ConfectionId](../../type-aliases/ConfectionId.md), [AnyConfectionRecipeEntity](../../type-aliases/AnyConfectionRecipeEntity.md), [IConfectionBase](../../interfaces/IConfectionBase.md)&lt;[AnyConfectionRecipeVariation](../../type-aliases/AnyConfectionRecipeVariation.md), [AnyConfectionRecipeEntity](../../type-aliases/AnyConfectionRecipeEntity.md)&gt;, never&gt;

</td><td>

A materialized library of all confections, keyed by composite ID.

</td></tr>
<tr><td>

[cachedIngredientCount](./IChocolateLibrary.cachedIngredientCount.md)

</td><td>

`readonly`

</td><td>

number

</td><td>

Gets the number of cached ingredients.

</td></tr>
<tr><td>

[cachedRecipeCount](./IChocolateLibrary.cachedRecipeCount.md)

</td><td>

`readonly`

</td><td>

number

</td><td>

Gets the number of cached recipes.

</td></tr>
<tr><td>

[ingredients](./IChocolateLibrary.ingredients.md)

</td><td>

`readonly`

</td><td>

[MaterializedLibrary](../../classes/MaterializedLibrary.md)&lt;[IngredientId](../../type-aliases/IngredientId.md), [IngredientEntity](../../type-aliases/IngredientEntity.md), [AnyIngredient](../../type-aliases/AnyIngredient.md), [IIngredientQuerySpec](../../interfaces/IIngredientQuerySpec.md)&gt;

</td><td>

Map of all ingredients, keyed by composite ID.

</td></tr>
<tr><td>

[fillings](./IChocolateLibrary.fillings.md)

</td><td>

`readonly`

</td><td>

[MaterializedLibrary](../../classes/MaterializedLibrary.md)&lt;[FillingId](../../type-aliases/FillingId.md), [IFillingRecipeEntity](../../interfaces/IFillingRecipeEntity.md), [IFillingRecipe](../../interfaces/IFillingRecipe.md), [IFillingRecipeQuerySpec](../../interfaces/IFillingRecipeQuerySpec.md)&gt;

</td><td>

Map of all fillings, keyed by composite ID.

</td></tr>
<tr><td>

[logger](./IChocolateLibrary.logger.md)

</td><td>

`readonly`

</td><td>

IResultReporter&lt;unknown, unknown&gt;

</td><td>

Optional logger for reporting partial resolution warnings.

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

[getIngredientUsage(ingredientId)](./IChocolateLibrary.getIngredientUsage.md)

</td><td>



</td><td>

Gets detailed usage information for an ingredient.

</td></tr>
<tr><td>

[getAllFillingTags()](./IChocolateLibrary.getAllFillingTags.md)

</td><td>



</td><td>

Gets all unique tags used across fillings.

</td></tr>
<tr><td>

[getAllIngredientTags()](./IChocolateLibrary.getAllIngredientTags.md)

</td><td>



</td><td>

Gets all unique tags used across ingredients.

</td></tr>
<tr><td>

[clearCache()](./IChocolateLibrary.clearCache.md)

</td><td>



</td><td>

Clears all cached runtime objects.

</td></tr>
<tr><td>

[warmUp()](./IChocolateLibrary.warmUp.md)

</td><td>



</td><td>

Pre-warms the reverse indexes for efficient queries.

</td></tr>
<tr><td>

[isCollectionMutable(collectionId)](./IChocolateLibrary.isCollectionMutable.md)

</td><td>



</td><td>

Check if a collection is mutable.

</td></tr>
</tbody></table>
