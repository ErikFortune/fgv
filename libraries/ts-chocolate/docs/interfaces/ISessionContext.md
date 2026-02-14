[Home](../README.md) > ISessionContext

# Interface: ISessionContext

Context interface for session creation and management.
Extends IConfectionContext with the ability to create filling editing sessions.

This interface is used by confection editing sessions to manage filling scaling.

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

[molds](./ISessionContext.molds.md)

</td><td>

`readonly`

</td><td>

[MaterializedLibrary](../classes/MaterializedLibrary.md)&lt;[MoldId](../type-aliases/MoldId.md), [IMoldEntity](IMoldEntity.md), [IMold](IMold.md), never&gt;

</td><td>

Materialized library of runtime molds.

</td></tr>
<tr><td>

[decorations](./ISessionContext.decorations.md)

</td><td>

`readonly`

</td><td>

[MaterializedLibrary](../classes/MaterializedLibrary.md)&lt;[DecorationId](../type-aliases/DecorationId.md), [IDecorationEntity](IDecorationEntity.md), [IDecoration](IDecoration.md), never&gt;

</td><td>

Materialized library of runtime decorations.

</td></tr>
<tr><td>

[confections](./ISessionContext.confections.md)

</td><td>

`readonly`

</td><td>

[MaterializedLibrary](../classes/MaterializedLibrary.md)&lt;[ConfectionId](../type-aliases/ConfectionId.md), [AnyConfectionRecipeEntity](../type-aliases/AnyConfectionRecipeEntity.md), [IConfectionBase](IConfectionBase.md)&lt;[AnyConfectionRecipeVariation](../type-aliases/AnyConfectionRecipeVariation.md), [AnyConfectionRecipeEntity](../type-aliases/AnyConfectionRecipeEntity.md)&gt;, never&gt;

</td><td>

Materialized library of runtime confections.

</td></tr>
<tr><td>

[ingredients](./ISessionContext.ingredients.md)

</td><td>

`readonly`

</td><td>

[MaterializedLibrary](../classes/MaterializedLibrary.md)&lt;[IngredientId](../type-aliases/IngredientId.md), [IngredientEntity](../type-aliases/IngredientEntity.md), [IIngredient](IIngredient.md)&lt;[IngredientEntity](../type-aliases/IngredientEntity.md)&gt;, [IIngredientQuerySpec](IIngredientQuerySpec.md)&gt;

</td><td>

Map of all ingredients, keyed by composite ID.

</td></tr>
<tr><td>

[fillings](./ISessionContext.fillings.md)

</td><td>

`readonly`

</td><td>

[MaterializedLibrary](../classes/MaterializedLibrary.md)&lt;[FillingId](../type-aliases/FillingId.md), [IFillingRecipeEntity](IFillingRecipeEntity.md), [IFillingRecipe](IFillingRecipe.md), [IFillingRecipeQuerySpec](IFillingRecipeQuerySpec.md)&gt;

</td><td>

Map of all fillings, keyed by composite ID.

</td></tr>
<tr><td>

[procedures](./ISessionContext.procedures.md)

</td><td>

`readonly`

</td><td>

[MaterializedLibrary](../classes/MaterializedLibrary.md)&lt;[ProcedureId](../type-aliases/ProcedureId.md), [IProcedureEntity](IProcedureEntity.md), [IProcedure](IProcedure.md), never&gt;

</td><td>

Map of all procedures, keyed by composite ID.

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

[createFillingSession(filling, targetWeight)](./ISessionContext.createFillingSession.md)

</td><td>



</td><td>

Creates an editing session for a filling recipe at a target weight.

</td></tr>
<tr><td>

[isCollectionMutable(collectionId)](./ISessionContext.isCollectionMutable.md)

</td><td>



</td><td>

Check if a collection is mutable.

</td></tr>
</tbody></table>
