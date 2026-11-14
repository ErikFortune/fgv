[Home](../../README.md) > [Diff](../README.md) > IDiffChange

# Interface: IDiffChange

Represents a single change in a JSON diff operation.

Each change describes a specific difference between two JSON values, including
the location of the change and the old/new values involved.

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

[path](./IDiffChange.path.md)

</td><td>



</td><td>

string

</td><td>

The path to the changed value using dot notation.

</td></tr>
<tr><td>

[type](./IDiffChange.type.md)

</td><td>



</td><td>

[DiffChangeType](../../type-aliases/DiffChangeType.md)

</td><td>

The type of change that occurred.

</td></tr>
<tr><td>

[oldValue](./IDiffChange.oldValue.md)

</td><td>



</td><td>

JsonValue

</td><td>

The value in the first object.

</td></tr>
<tr><td>

[newValue](./IDiffChange.newValue.md)

</td><td>



</td><td>

JsonValue

</td><td>

The value in the second object.

</td></tr>
</tbody></table>
