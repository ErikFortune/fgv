[Home](../../README.md) > [PickerTools](../README.md) > IPendingResource

# Interface: IPendingResource

Represents a resource that hasn't been persisted yet.

Pending resources are displayed alongside persisted resources in the picker,
allowing users to interact with unsaved changes. They are visually distinguished
with appropriate styling and annotations.

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

[id](./IPendingResource.id.md)

</td><td>



</td><td>

string

</td><td>

Unique identifier for the pending resource

</td></tr>
<tr><td>

[type](./IPendingResource.type.md)

</td><td>



</td><td>

"deleted" | "new" | "modified"

</td><td>

Type of pending operation

</td></tr>
<tr><td>

[resourceType](./IPendingResource.resourceType.md)

</td><td>



</td><td>

string

</td><td>

Optional resource type identifier

</td></tr>
<tr><td>

[displayName](./IPendingResource.displayName.md)

</td><td>



</td><td>

string

</td><td>

Display name for the resource in the picker

</td></tr>
<tr><td>

[resourceData](./IPendingResource.resourceData.md)

</td><td>



</td><td>

T

</td><td>

The actual resource data with type safety

</td></tr>
</tbody></table>
