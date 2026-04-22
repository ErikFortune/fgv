[Home](../../README.md) > [GridTools](../README.md) > ICustomResourceSelector

# Interface: ICustomResourceSelector

Custom resource selector for advanced filtering logic.
Allows hosts to define complex resource selection criteria.

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

[id](./ICustomResourceSelector.id.md)

</td><td>



</td><td>

string

</td><td>

Unique identifier for this selector

</td></tr>
<tr><td>

[select](./ICustomResourceSelector.select.md)

</td><td>



</td><td>

(resources: [IProcessedResources](../../interfaces/IProcessedResources.md)) =&gt; string[]

</td><td>

Function that returns resource IDs to include in the grid

</td></tr>
<tr><td>

[displayName](./ICustomResourceSelector.displayName.md)

</td><td>



</td><td>

string

</td><td>

Optional display name for debugging/logging

</td></tr>
</tbody></table>
