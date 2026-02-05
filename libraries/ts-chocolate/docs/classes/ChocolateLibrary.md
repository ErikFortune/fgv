[Home](../README.md) > ChocolateLibrary

# Class: ChocolateLibrary

Main entry point for the chocolate library

Provides unified access to:
- Ingredient management (multi-source with built-ins)
- Recipe management (multi-source)
- Molds, procedures, tasks, and confections

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

Logger used by this library and its sub-libraries.

</td></tr>
<tr><td>

[ingredients](./ChocolateLibrary.ingredients.md)

</td><td>

`readonly`

</td><td>

[IngredientsLibrary](IngredientsLibrary.md)

</td><td>

The Entities.Ingredients.IngredientsLibrary | ingredients library.

</td></tr>
<tr><td>

[fillings](./ChocolateLibrary.fillings.md)

</td><td>

`readonly`

</td><td>

[FillingsLibrary](FillingsLibrary.md)

</td><td>

The Entities.Fillings.FillingsLibrary | fillings library.

</td></tr>
<tr><td>

[molds](./ChocolateLibrary.molds.md)

</td><td>

`readonly`

</td><td>

[MoldsLibrary](MoldsLibrary.md)

</td><td>

The Entities.Molds.MoldsLibrary | molds library.

</td></tr>
<tr><td>

[procedures](./ChocolateLibrary.procedures.md)

</td><td>

`readonly`

</td><td>

[ProceduresLibrary](ProceduresLibrary.md)

</td><td>

The Entities.Procedures.ProceduresLibrary | procedures library.

</td></tr>
<tr><td>

[tasks](./ChocolateLibrary.tasks.md)

</td><td>

`readonly`

</td><td>

[TasksLibrary](TasksLibrary.md)

</td><td>

The Entities.Tasks.TasksLibrary | tasks library.

</td></tr>
<tr><td>

[confections](./ChocolateLibrary.confections.md)

</td><td>

`readonly`

</td><td>

[ConfectionsLibrary](ConfectionsLibrary.md)

</td><td>

The Entities.Confections.ConfectionsLibrary | confections library.

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

Creates a new LibraryRuntime.ChocolateLibrary | ChocolateLibrary instance.

</td></tr>
<tr><td>

[getEditableIngredients(collectionId)](./ChocolateLibrary.getEditableIngredients.md)

</td><td>



</td><td>

Get an editable ingredients collection with persistence enabled.

</td></tr>
<tr><td>

[getEditableFillings(collectionId)](./ChocolateLibrary.getEditableFillings.md)

</td><td>



</td><td>

Get an editable fillings collection with persistence enabled.

</td></tr>
<tr><td>

[getEditableMolds(collectionId)](./ChocolateLibrary.getEditableMolds.md)

</td><td>



</td><td>

Get an editable molds collection with persistence enabled.

</td></tr>
<tr><td>

[getEditableProcedures(collectionId)](./ChocolateLibrary.getEditableProcedures.md)

</td><td>



</td><td>

Get an editable procedures collection with persistence enabled.

</td></tr>
<tr><td>

[getEditableTasks(collectionId)](./ChocolateLibrary.getEditableTasks.md)

</td><td>



</td><td>

Get an editable tasks collection with persistence enabled.

</td></tr>
<tr><td>

[getEditableConfections(collectionId)](./ChocolateLibrary.getEditableConfections.md)

</td><td>



</td><td>

Get an editable confections collection with persistence enabled.

</td></tr>
</tbody></table>
