[Home](../../README.md) > [Import](../README.md) > ImportManager

# Class: ImportManager

Class to manage the import of resources from various sources.

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

[resources](./ImportManager.resources.md)

</td><td>

`readonly`

</td><td>

[ResourceManagerBuilder](../../classes/ResourceManagerBuilder.md)

</td><td>

The Resources.ResourceManagerBuilder | resource manager builder into which resources

</td></tr>
<tr><td>

[initialContext](./ImportManager.initialContext.md)

</td><td>



</td><td>

[ImportContext](../../classes/ImportContext.md)

</td><td>

The initial Import.ImportContext | import context for the import operation.

</td></tr>
<tr><td>

[importers](./ImportManager.importers.md)

</td><td>

`readonly`

</td><td>

readonly [IImporter](../../interfaces/IImporter.md)[]

</td><td>

The list of Import.Importers.IImporter | importers to use for the

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

[create(params)](./ImportManager.create.md)

</td><td>

`static`

</td><td>

Factory method to create a new Import.ImportManager | ImportManager.

</td></tr>
<tr><td>

[getDefaultImporters(qualifiers, tree, fileContentConverter)](./ImportManager.getDefaultImporters.md)

</td><td>

`static`

</td><td>

Gets the default importers using supplied Qualifiers.IReadOnlyQualifierCollector | qualifiers

</td></tr>
<tr><td>

[import(importable)](./ImportManager.import.md)

</td><td>



</td><td>

Imports resources from an Import.IImportable | importable object.

</td></tr>
<tr><td>

[importFromFileSystem(filePath)](./ImportManager.importFromFileSystem.md)

</td><td>



</td><td>

Imports resources from a file system path.

</td></tr>
<tr><td>

[_import()](./ImportManager._import.md)

</td><td>



</td><td>

Imports any items on the import stack.

</td></tr>
</tbody></table>
