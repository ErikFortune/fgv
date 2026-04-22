[Home](../../../README.md) > [Import](../../README.md) > [Importers](../README.md) > JsonImporter

# Class: JsonImporter

Import.Importers.IImporter | Importer implementation which imports resources from a JSON object.

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

[types](./JsonImporter.types.md)

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

[create()](./JsonImporter.create.md)

</td><td>

`static`

</td><td>

Creates a new Import.Importers.JsonImporter | JsonImporter instance.

</td></tr>
<tr><td>

[import(item, manager)](./JsonImporter.import.md)

</td><td>



</td><td>

Imports an item, extracting any resources or candidates from it and returns an optional

</td></tr>
</tbody></table>
