[Home](../../../README.md) > [Import](../../README.md) > [Importers](../README.md) > FsItemImporter

# Class: FsItemImporter

Import.Importers.IImporter | Importer implementation which imports resources from a `FileTree`.

**Implements:** [`IImporter`](../../../interfaces/IImporter.md)

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

[qualifiers](./FsItemImporter.qualifiers.md)

</td><td>

`readonly`

</td><td>

[IReadOnlyQualifierCollector](../../../interfaces/IReadOnlyQualifierCollector.md)

</td><td>

The Qualifiers.IReadOnlyQualifierCollector | qualifier collector to use for this importer.

</td></tr>
<tr><td>

[fileContentConverter](./FsItemImporter.fileContentConverter.md)

</td><td>

`readonly`

</td><td>

Converter&lt;JsonValue, unknown&gt;

</td><td>

Optional converter used to parse raw file contents before they are exposed as JSON importables.

</td></tr>
<tr><td>

[types](./FsItemImporter.types.md)

</td><td>

`readonly`

</td><td>

readonly string[]

</td><td>

The types of Import.IImportable | importables that this importer can handle.

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

[create(params)](./FsItemImporter.create.md)

</td><td>

`static`

</td><td>

Creates a new Import.Importers.FsItemImporter | FsItemImporter.

</td></tr>
<tr><td>

[import(item, __manager)](./FsItemImporter.import.md)

</td><td>



</td><td>

Import.Importers.IImporter.import

</td></tr>
</tbody></table>
