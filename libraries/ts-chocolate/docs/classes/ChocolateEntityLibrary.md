[Home](../README.md) > ChocolateEntityLibrary

# Class: ChocolateEntityLibrary

Main entry point for the chocolate data entity library

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

[logger](./ChocolateEntityLibrary.logger.md)

</td><td>

`readonly`

</td><td>

LogReporter&lt;unknown&gt;

</td><td>

Logger used by this library and its sub-libraries.

</td></tr>
<tr><td>

[ingredients](./ChocolateEntityLibrary.ingredients.md)

</td><td>

`readonly`

</td><td>

[IngredientsLibrary](IngredientsLibrary.md)

</td><td>

The Entities.Ingredients.IngredientsLibrary | ingredients library.

</td></tr>
<tr><td>

[fillings](./ChocolateEntityLibrary.fillings.md)

</td><td>

`readonly`

</td><td>

[FillingsLibrary](FillingsLibrary.md)

</td><td>

The Entities.Fillings.FillingsLibrary | fillings library.

</td></tr>
<tr><td>

[molds](./ChocolateEntityLibrary.molds.md)

</td><td>

`readonly`

</td><td>

[MoldsLibrary](MoldsLibrary.md)

</td><td>

The Entities.Molds.MoldsLibrary | molds library.

</td></tr>
<tr><td>

[procedures](./ChocolateEntityLibrary.procedures.md)

</td><td>

`readonly`

</td><td>

[ProceduresLibrary](ProceduresLibrary.md)

</td><td>

The Entities.Procedures.ProceduresLibrary | procedures library.

</td></tr>
<tr><td>

[tasks](./ChocolateEntityLibrary.tasks.md)

</td><td>

`readonly`

</td><td>

[TasksLibrary](TasksLibrary.md)

</td><td>

The Entities.Tasks.TasksLibrary | tasks library.

</td></tr>
<tr><td>

[confections](./ChocolateEntityLibrary.confections.md)

</td><td>

`readonly`

</td><td>

[ConfectionsLibrary](ConfectionsLibrary.md)

</td><td>

The Entities.Confections.ConfectionsLibrary | confections library.

</td></tr>
<tr><td>

[decorations](./ChocolateEntityLibrary.decorations.md)

</td><td>

`readonly`

</td><td>

[DecorationsLibrary](DecorationsLibrary.md)

</td><td>

The Entities.Decorations.DecorationsLibrary | decorations library.

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

[create(params)](./ChocolateEntityLibrary.create.md)

</td><td>

`static`

</td><td>

Creates a new LibraryRuntime.ChocolateEntityLibrary | ChocolateEntityLibrary instance.

</td></tr>
<tr><td>

[getEditableIngredientsEntityCollection(collectionId, encryptionProvider)](./ChocolateEntityLibrary.getEditableIngredientsEntityCollection.md)

</td><td>



</td><td>

Get an editable ingredients collection with persistence enabled.

</td></tr>
<tr><td>

[getEditableFillingsRecipeEntityCollection(collectionId, encryptionProvider)](./ChocolateEntityLibrary.getEditableFillingsRecipeEntityCollection.md)

</td><td>



</td><td>

Get an editable fillings collection with persistence enabled.

</td></tr>
<tr><td>

[getEditableMoldsEntityCollection(collectionId, encryptionProvider)](./ChocolateEntityLibrary.getEditableMoldsEntityCollection.md)

</td><td>



</td><td>

Get an editable molds collection with persistence enabled.

</td></tr>
<tr><td>

[getEditableProceduresEntityCollection(collectionId, encryptionProvider)](./ChocolateEntityLibrary.getEditableProceduresEntityCollection.md)

</td><td>



</td><td>

Get an editable procedures collection with persistence enabled.

</td></tr>
<tr><td>

[getEditableTasksEntityCollection(collectionId, encryptionProvider)](./ChocolateEntityLibrary.getEditableTasksEntityCollection.md)

</td><td>



</td><td>

Get an editable tasks collection with persistence enabled.

</td></tr>
<tr><td>

[getEditableConfectionsEntityCollection(collectionId, encryptionProvider)](./ChocolateEntityLibrary.getEditableConfectionsEntityCollection.md)

</td><td>



</td><td>

Get an editable confections collection with persistence enabled.

</td></tr>
<tr><td>

[getEditableDecorationsEntityCollection(collectionId, encryptionProvider)](./ChocolateEntityLibrary.getEditableDecorationsEntityCollection.md)

</td><td>



</td><td>

Get an editable decorations collection with persistence enabled.

</td></tr>
</tbody></table>
