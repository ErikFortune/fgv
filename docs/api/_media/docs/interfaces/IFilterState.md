[Home](../README.md) > IFilterState

# Interface: IFilterState

Represents the current state of resource filtering.
Tracks filter configuration, values, and application state.

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

[enabled](./IFilterState.enabled.md)

</td><td>



</td><td>

boolean

</td><td>

Whether filtering is currently enabled

</td></tr>
<tr><td>

[values](./IFilterState.values.md)

</td><td>



</td><td>

Record&lt;string, string | undefined&gt;

</td><td>

Current filter values being edited (not yet applied)

</td></tr>
<tr><td>

[appliedValues](./IFilterState.appliedValues.md)

</td><td>



</td><td>

Record&lt;string, string | undefined&gt;

</td><td>

Filter values that have been applied to the resource manager

</td></tr>
<tr><td>

[hasPendingChanges](./IFilterState.hasPendingChanges.md)

</td><td>



</td><td>

boolean

</td><td>

Whether there are unsaved changes in the filter values

</td></tr>
<tr><td>

[reduceQualifiers](./IFilterState.reduceQualifiers.md)

</td><td>



</td><td>

boolean

</td><td>

Whether to reduce qualifiers when filtering (removes unused qualifier dimensions)

</td></tr>
</tbody></table>
