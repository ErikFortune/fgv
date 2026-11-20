[Home](../README.md) > IDiffResult

# Interface: IDiffResult

Result of a JSON diff operation containing all detected changes.

This interface provides detailed information about every difference found
between two JSON values, making it ideal for analysis, debugging, and
understanding exactly what changed.

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

[changes](./IDiffResult.changes.md)

</td><td>



</td><td>

[IDiffChange](IDiffChange.md)[]

</td><td>

Array of all changes detected between the two JSON objects.

</td></tr>
<tr><td>

[identical](./IDiffResult.identical.md)

</td><td>



</td><td>

boolean

</td><td>

True if the objects are identical, false otherwise.

</td></tr>
</tbody></table>
