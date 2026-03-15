[Home](../../README.md) > [LibraryData](../README.md) > ICollectionFilterInitParams

# Interface: ICollectionFilterInitParams

Parameters used to filter and validate collections imported from a file tree.

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

[included](./ICollectionFilterInitParams.included.md)

</td><td>

`readonly`

</td><td>

readonly [FilterPattern](../../type-aliases/FilterPattern.md)[]

</td><td>

Patterns to include.

</td></tr>
<tr><td>

[excluded](./ICollectionFilterInitParams.excluded.md)

</td><td>

`readonly`

</td><td>

readonly [FilterPattern](../../type-aliases/FilterPattern.md)[]

</td><td>

Patterns to exclude.

</td></tr>
<tr><td>

[nameConverter](./ICollectionFilterInitParams.nameConverter.md)

</td><td>

`readonly`

</td><td>

Converter&lt;T, unknown&gt; | Validator&lt;T, unknown&gt;

</td><td>



</td></tr>
<tr><td>

[errorOnInvalidName](./ICollectionFilterInitParams.errorOnInvalidName.md)

</td><td>

`readonly`

</td><td>

boolean

</td><td>



</td></tr>
</tbody></table>
