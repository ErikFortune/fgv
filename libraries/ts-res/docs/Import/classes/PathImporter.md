[Home](../../README.md) > [Import](../README.md) > PathImporter

# Class: PathImporter

Import.Importers.IImporter | Importer implementation which imports resources from a `FileTree`
given a path.

**Implements:** [`IImporter`](../../interfaces/IImporter.md)

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

[qualifiers](./PathImporter.qualifiers.md)

</td><td>

`readonly`

</td><td>

[IReadOnlyQualifierCollector](../../interfaces/IReadOnlyQualifierCollector.md)

</td><td>

The Qualifiers.IReadOnlyQualifierCollector | qualifier collector to use for this importer.

</td></tr>
<tr><td>

[tree](./PathImporter.tree.md)

</td><td>

`readonly`

</td><td>

FileTree_2

</td><td>

The `FileTree` from which resources will be imported.

</td></tr>
<tr><td>

[types](./PathImporter.types.md)

</td><td>

`readonly`

</td><td>

readonly string[]

</td><td>

The types of Import.IImportable | importables that this importer can handle.

</td></tr>
<tr><td>

[ignoreFileTypes](./PathImporter.ignoreFileTypes.md)

</td><td>

`readonly`

</td><td>

string[]

</td><td>

The types of files to ignore when importing.

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

[create(params)](./PathImporter.create.md)

</td><td>

`static`

</td><td>

Creates a new Import.Importers.PathImporter | PathImporter.

</td></tr>
<tr><td>

[import(item, __manager)](./PathImporter.import.md)

</td><td>



</td><td>

Imports an item, extracting any resources or candidates from it and returns an optional

</td></tr>
</tbody></table>
