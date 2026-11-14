[Home](../../README.md) > [PickerTools](../README.md) > IResourceSelection

# Interface: IResourceSelection

Resource selection data returned by the onResourceSelect callback.

This interface provides comprehensive information about the selected resource,
eliminating the need for consumers to perform additional lookups.

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

[resourceId](./IResourceSelection.resourceId.md)

</td><td>



</td><td>

string | null

</td><td>

The ID of the selected resource, or null if no selection

</td></tr>
<tr><td>

[resourceData](./IResourceSelection.resourceData.md)

</td><td>



</td><td>

T

</td><td>

The actual resource data if available and typed

</td></tr>
<tr><td>

[isPending](./IResourceSelection.isPending.md)

</td><td>



</td><td>

boolean

</td><td>

Whether this is a pending (unsaved) resource

</td></tr>
<tr><td>

[pendingType](./IResourceSelection.pendingType.md)

</td><td>



</td><td>

"deleted" | "new" | "modified"

</td><td>

Type of pending operation for unsaved resources

</td></tr>
</tbody></table>
