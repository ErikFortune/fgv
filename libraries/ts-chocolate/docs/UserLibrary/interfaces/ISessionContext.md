[Home](../../README.md) > [UserLibrary](../README.md) > ISessionContext

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

[locations](./ISessionContext.locations.md)

</td><td>

`readonly`

</td><td>

[MaterializedLibrary](../../classes/MaterializedLibrary.md)&lt;[LocationId](../../type-aliases/LocationId.md), [ILocationEntity](../../interfaces/ILocationEntity.md), [ILocation](../../interfaces/ILocation.md), never&gt;

</td><td>

Materialized locations library for resolving inventory location references

</td></tr>
<tr><td>

[molds](./ISessionContext.molds.md)

</td><td>

`readonly`

</td><td>

[MaterializedLibrary](../../classes/MaterializedLibrary.md)&lt;[MoldId](../../type-aliases/MoldId.md), [IMoldEntity](../../interfaces/IMoldEntity.md), [IMold](../../interfaces/IMold.md), never&gt;

</td><td>

Materialized library of runtime molds.

</td></tr>
<tr><td>

[decorations](./ISessionContext.decorations.md)

</td><td>

`readonly`

</td><td>

[MaterializedLibrary](../../classes/MaterializedLibrary.md)&lt;[DecorationId](../../type-aliases/DecorationId.md), [IDecorationEntity](../../interfaces/IDecorationEntity.md), [IDecoration](../../interfaces/IDecoration.md), never&gt;

</td><td>

Materialized library of runtime decorations.

</td></tr>
<tr><td>

[confections](./ISessionContext.confections.md)

</td><td>

`readonly`

</td><td>

[MaterializedLibrary](../../classes/MaterializedLibrary.md)&lt;[ConfectionId](../../type-aliases/ConfectionId.md), [AnyConfectionRecipeEntity](../../type-aliases/AnyConfectionRecipeEntity.md), [IConfectionBase](../../interfaces/IConfectionBase.md)&lt;[AnyConfectionRecipeVariation](../../type-aliases/AnyConfectionRecipeVariation.md), [AnyConfectionRecipeEntity](../../type-aliases/AnyConfectionRecipeEntity.md)&gt;, never&gt;

</td><td>

Materialized library of runtime confections.

</td></tr>
<tr><td>

[ingredients](./ISessionContext.ingredients.md)

</td><td>

`readonly`

</td><td>

[MaterializedLibrary](../../classes/MaterializedLibrary.md)&lt;[IngredientId](../../type-aliases/IngredientId.md), [IngredientEntity](../../type-aliases/IngredientEntity.md), [AnyIngredient](../../type-aliases/AnyIngredient.md), [IIngredientQuerySpec](../../interfaces/IIngredientQuerySpec.md)&gt;

</td><td>

Map of all ingredients, keyed by composite ID.

</td></tr>
<tr><td>

[fillings](./ISessionContext.fillings.md)

</td><td>

`readonly`

</td><td>

[MaterializedLibrary](../../classes/MaterializedLibrary.md)&lt;[FillingId](../../type-aliases/FillingId.md), [IFillingRecipeEntity](../../interfaces/IFillingRecipeEntity.md), [IFillingRecipe](../../interfaces/IFillingRecipe.md), [IFillingRecipeQuerySpec](../../interfaces/IFillingRecipeQuerySpec.md)&gt;

</td><td>

Map of all fillings, keyed by composite ID.

</td></tr>
<tr><td>

[procedures](./ISessionContext.procedures.md)

</td><td>

`readonly`

</td><td>

[MaterializedLibrary](../../classes/MaterializedLibrary.md)&lt;[ProcedureId](../../type-aliases/ProcedureId.md), [IProcedureEntity](../../interfaces/IProcedureEntity.md), [IProcedure](../../interfaces/IProcedure.md), never&gt;

</td><td>

Map of all procedures, keyed by composite ID.

</td></tr>
<tr><td>

[logger](./ISessionContext.logger.md)

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
