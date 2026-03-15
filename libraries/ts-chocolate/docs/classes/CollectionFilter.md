[Home](../README.md) > CollectionFilter

# Class: CollectionFilter

Generic collection import filter.

## Constructors

<table><thead><tr><th>

Constructor

</th><th>

Modifiers

</th><th>

Description

</th></tr></thead>
<tbody>
<tr><td>

`constructor(params)`

</td><td>



</td><td>

Constructs a new LibraryData.CollectionFilter | collection filter.

</td></tr>
</tbody></table>

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

[included](./CollectionFilter.included.md)

</td><td>

`readonly`

</td><td>

readonly [FilterPattern](../type-aliases/FilterPattern.md)[] | undefined

</td><td>



</td></tr>
<tr><td>

[excluded](./CollectionFilter.excluded.md)

</td><td>

`readonly`

</td><td>

readonly [FilterPattern](../type-aliases/FilterPattern.md)[]

</td><td>



</td></tr>
<tr><td>

[nameConverter](./CollectionFilter.nameConverter.md)

</td><td>

`readonly`

</td><td>

Converter&lt;T, unknown&gt; | Validator&lt;T, unknown&gt;

</td><td>



</td></tr>
<tr><td>

[errorOnInvalidName](./CollectionFilter.errorOnInvalidName.md)

</td><td>

`readonly`

</td><td>

boolean

</td><td>



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

[getFileTreeItemName(item, prefix)](./CollectionFilter.getFileTreeItemName.md)

</td><td>

`static`

</td><td>



</td></tr>
<tr><td>

[filterItems(items, extractName)](./CollectionFilter.filterItems.md)

</td><td>



</td><td>

Filters items of an arbitrary type based on their extracted names.

</td></tr>
<tr><td>

[filterDirectory(dir, params)](./CollectionFilter.filterDirectory.md)

</td><td>



</td><td>

Filters a directory in a `FileTree` using this filter's configuration and optionally supplied parameters.

</td></tr>
</tbody></table>
