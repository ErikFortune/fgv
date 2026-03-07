[Home](../../README.md) > [Session](../README.md) > IEmbeddableFillingSession

# Interface: IEmbeddableFillingSession

Identity-free contract for filling editing sessions.

This interface captures behavior shared by embedded child sessions and
standalone persisted sessions. It intentionally excludes session identity
and persistence-specific APIs.

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

[baseRecipe](./IEmbeddableFillingSession.baseRecipe.md)

</td><td>

`readonly`

</td><td>

[IFillingRecipeVariation](../../interfaces/IFillingRecipeVariation.md)

</td><td>

Source recipe variation being edited

</td></tr>
<tr><td>

[produced](./IEmbeddableFillingSession.produced.md)

</td><td>

`readonly`

</td><td>

[ProducedFilling](../../classes/ProducedFilling.md)

</td><td>

Mutable produced filling wrapper

</td></tr>
<tr><td>

[targetWeight](./IEmbeddableFillingSession.targetWeight.md)

</td><td>

`readonly`

</td><td>

[Measurement](../../type-aliases/Measurement.md)

</td><td>

Current target weight

</td></tr>
<tr><td>

[hasChanges](./IEmbeddableFillingSession.hasChanges.md)

</td><td>

`readonly`

</td><td>

boolean

</td><td>

Whether the session has unsaved changes

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

[setIngredient(id, amount, unit, modifiers)](./IEmbeddableFillingSession.setIngredient.md)

</td><td>



</td><td>

Ingredient mutation APIs

</td></tr>
<tr><td>

[replaceIngredient(oldId, newId, amount, unit, modifiers)](./IEmbeddableFillingSession.replaceIngredient.md)

</td><td>



</td><td>



</td></tr>
<tr><td>

[removeIngredient(id)](./IEmbeddableFillingSession.removeIngredient.md)

</td><td>



</td><td>



</td></tr>
<tr><td>

[scaleToTargetWeight(targetWeight)](./IEmbeddableFillingSession.scaleToTargetWeight.md)

</td><td>



</td><td>

Scaling/editing APIs

</td></tr>
<tr><td>

[setNotes(notes)](./IEmbeddableFillingSession.setNotes.md)

</td><td>



</td><td>



</td></tr>
<tr><td>

[setProcedure(id)](./IEmbeddableFillingSession.setProcedure.md)

</td><td>



</td><td>



</td></tr>
<tr><td>

[undo()](./IEmbeddableFillingSession.undo.md)

</td><td>



</td><td>

Undo/redo APIs

</td></tr>
<tr><td>

[redo()](./IEmbeddableFillingSession.redo.md)

</td><td>



</td><td>



</td></tr>
<tr><td>

[canUndo()](./IEmbeddableFillingSession.canUndo.md)

</td><td>



</td><td>



</td></tr>
<tr><td>

[canRedo()](./IEmbeddableFillingSession.canRedo.md)

</td><td>



</td><td>



</td></tr>
<tr><td>

[analyzeSaveOptions()](./IEmbeddableFillingSession.analyzeSaveOptions.md)

</td><td>



</td><td>

Save-analysis and dirty baseline

</td></tr>
<tr><td>

[markSaved()](./IEmbeddableFillingSession.markSaved.md)

</td><td>



</td><td>



</td></tr>
</tbody></table>
