[Home](../README.md) > ChocolateLibrary

# Class: ChocolateLibrary

Central context for the library-runtime object access layer.
Provides factory methods for runtime objects, caching, and reverse lookups.

This is the entry point for consumers who want resolved views
of recipes and ingredients with automatic reference resolution.

For session creation capabilities, use UserLibrary from the user-library packlet.

**Implements:** [`IChocolateLibrary`](../interfaces/IChocolateLibrary.md)

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

[logger](./ChocolateLibrary.logger.md)

</td><td>

`readonly`

</td><td>

LogReporter&lt;unknown&gt;

</td><td>

Logger used by this runtime context and its libraries.

</td></tr>
<tr><td>

[entities](./ChocolateLibrary.entities.md)

</td><td>

`readonly`

</td><td>

[ChocolateEntityLibrary](ChocolateEntityLibrary.md)

</td><td>

The underlying ChocolateEntityLibrary for direct access when needed.

</td></tr>
<tr><td>

[confections](./ChocolateLibrary.confections.md)

</td><td>

`readonly`

</td><td>

[MaterializedLibrary](MaterializedLibrary.md)&lt;[ConfectionId](../type-aliases/ConfectionId.md), [AnyConfectionRecipeEntity](../type-aliases/AnyConfectionRecipeEntity.md), [AnyConfection](../type-aliases/AnyConfection.md), never&gt;

</td><td>

A materialized library of all confections, keyed by composite ID.

</td></tr>
<tr><td>

[molds](./ChocolateLibrary.molds.md)

</td><td>

`readonly`

</td><td>

[MaterializedLibrary](MaterializedLibrary.md)&lt;[MoldId](../type-aliases/MoldId.md), [IMoldEntity](../interfaces/IMoldEntity.md), [Mold](Mold.md), never&gt;

</td><td>

A materialized library of all molds, keyed by composite ID.

</td></tr>
<tr><td>

[procedures](./ChocolateLibrary.procedures.md)

</td><td>

`readonly`

</td><td>

[MaterializedLibrary](MaterializedLibrary.md)&lt;[ProcedureId](../type-aliases/ProcedureId.md), [IProcedureEntity](../interfaces/IProcedureEntity.md), [Procedure](Procedure.md), never&gt;

</td><td>

A materialized library of all procedures, keyed by composite ID.

</td></tr>
<tr><td>

[tasks](./ChocolateLibrary.tasks.md)

</td><td>

`readonly`

</td><td>

[MaterializedLibrary](MaterializedLibrary.md)&lt;[TaskId](../type-aliases/TaskId.md), [IRawTaskEntity](../interfaces/IRawTaskEntity.md), [Task](Task.md), never&gt;

</td><td>

A materialized library of all tasks, keyed by composite ID.

</td></tr>
<tr><td>

[ingredients](./ChocolateLibrary.ingredients.md)

</td><td>

`readonly`

</td><td>

[MaterializedLibrary](MaterializedLibrary.md)&lt;[IngredientId](../type-aliases/IngredientId.md), [IngredientEntity](../type-aliases/IngredientEntity.md), [AnyIngredient](../type-aliases/AnyIngredient.md), [IIngredientQuerySpec](../interfaces/IIngredientQuerySpec.md)&gt;

</td><td>

A searchable library of all ingredients, keyed by composite ID.

</td></tr>
<tr><td>

[fillings](./ChocolateLibrary.fillings.md)

</td><td>

`readonly`

</td><td>

[MaterializedLibrary](MaterializedLibrary.md)&lt;[FillingId](../type-aliases/FillingId.md), [IFillingRecipeEntity](../interfaces/IFillingRecipeEntity.md), [FillingRecipe](FillingRecipe.md), [IFillingRecipeQuerySpec](../interfaces/IFillingRecipeQuerySpec.md)&gt;

</td><td>

A searchable library of all fillings, keyed by composite ID.

</td></tr>
<tr><td>

[cachedIngredientCount](./ChocolateLibrary.cachedIngredientCount.md)

</td><td>

`readonly`

</td><td>

number

</td><td>

Gets the number of cached ingredients.

</td></tr>
<tr><td>

[cachedRecipeCount](./ChocolateLibrary.cachedRecipeCount.md)

</td><td>

`readonly`

</td><td>

number

</td><td>

Gets the number of cached recipes.

</td></tr>
<tr><td>

[cachedConfectionCount](./ChocolateLibrary.cachedConfectionCount.md)

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

[create(params)](./ChocolateLibrary.create.md)

</td><td>

`static`

</td><td>

Creates a ChocolateLibrary with a new or default ChocolateEntityLibrary.

</td></tr>
<tr><td>

[fromChocolateEntityLibrary(library, preWarm)](./ChocolateLibrary.fromChocolateEntityLibrary.md)

</td><td>

`static`

</td><td>

Creates a ChocolateLibrary wrapping an existing ChocolateEntityLibrary.

</td></tr>
<tr><td>

[getIngredientUsage(ingredientId)](./ChocolateLibrary.getIngredientUsage.md)

</td><td>



</td><td>

Gets detailed usage information for an ingredient.

</td></tr>
<tr><td>

[getAllFillingTags()](./ChocolateLibrary.getAllFillingTags.md)

</td><td>



</td><td>

Gets all unique tags used across fillings.

</td></tr>
<tr><td>

[getAllIngredientTags()](./ChocolateLibrary.getAllIngredientTags.md)

</td><td>



</td><td>

Gets all unique tags used across ingredients.

</td></tr>
<tr><td>

[getAllConfectionTags()](./ChocolateLibrary.getAllConfectionTags.md)

</td><td>



</td><td>

Gets all unique tags used across confections.

</td></tr>
<tr><td>

[clearCache()](./ChocolateLibrary.clearCache.md)

</td><td>



</td><td>

Clears all cached runtime objects.

</td></tr>
<tr><td>

[warmUp()](./ChocolateLibrary.warmUp.md)

</td><td>



</td><td>

Pre-warms the reverse indexes for efficient queries.

</td></tr>
<tr><td>

[invalidateIndexers()](./ChocolateLibrary.invalidateIndexers.md)

</td><td>



</td><td>

Invalidates all indexer caches.

</td></tr>
<tr><td>

[isCollectionMutable(collectionId)](./ChocolateLibrary.isCollectionMutable.md)

</td><td>



</td><td>

Checks if a collection is mutable.

</td></tr>
<tr><td>

[createWeightContext()](./ChocolateLibrary.createWeightContext.md)

</td><td>



</td><td>

Creates a weight calculation context for unit-aware weight calculations.

</td></tr>
</tbody></table>
