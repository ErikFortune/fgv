[Home](../../README.md) > [Diff](../README.md) > IJsonDiffOptions

# Interface: IJsonDiffOptions

Options for customizing JSON diff behavior.

These options allow you to control how the diff algorithm processes
different types of JSON structures and what information is included
in the results.

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

[includeUnchanged](./IJsonDiffOptions.includeUnchanged.md)

</td><td>



</td><td>

boolean

</td><td>

If true, includes unchanged values in the result.

</td></tr>
<tr><td>

[pathSeparator](./IJsonDiffOptions.pathSeparator.md)

</td><td>



</td><td>

string

</td><td>

Custom path separator for nested property paths.

</td></tr>
<tr><td>

[arrayOrderMatters](./IJsonDiffOptions.arrayOrderMatters.md)

</td><td>



</td><td>

boolean

</td><td>

If true, treats arrays as ordered lists where position matters.

</td></tr>
</tbody></table>
