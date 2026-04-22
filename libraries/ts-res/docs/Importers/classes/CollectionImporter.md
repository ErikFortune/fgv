[Home](../../README.md) > [Importers](../README.md) > CollectionImporter

# Class: CollectionImporter

Import.Importers.IImporter | Importer implementation which imports
a ResourceJson.ResourceDeclCollection | resource collection or
ResourceJson.ResourceDeclTree | resource tree from an importable item.

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

[types](./CollectionImporter.types.md)

</td><td>

`readonly`

</td><td>

string[]

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

[create()](./CollectionImporter.create.md)

</td><td>

`static`

</td><td>

Creates a new Import.Importers.CollectionImporter | CollectionImporter instance.

</td></tr>
<tr><td>

[import(item, manager)](./CollectionImporter.import.md)

</td><td>



</td><td>

Imports an item, extracting any resources or candidates from it and returns an optional

</td></tr>
</tbody></table>
