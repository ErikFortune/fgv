[Home](../README.md) > IImporter

# Interface: IImporter

Generic interface for an importer than accepts a typed
Import.IImportable | importable item, extracts any resources
or candidates from it, and returns an optional list of
additional importable items derived from the original.

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

[types](./IImporter.types.md)

</td><td>

`readonly`

</td><td>

readonly string[]

</td><td>

The types of Import.Importable | importable items that this importer can process.

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

[import(item, manager)](./IImporter.import.md)

</td><td>



</td><td>

Imports an item, extracting any resources or candidates from it and returns an optional

</td></tr>
</tbody></table>
