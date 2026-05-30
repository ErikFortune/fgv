[Home](../README.md) > IResourcePickerProps

# Interface: IResourcePickerProps

Props for the ResourcePicker component.

The ResourcePicker is a comprehensive component for browsing and selecting resources
with support for multiple view modes, search, annotations, and pending resources.
UI behavior is controlled through the options object, while functional data is
passed as separate props.

**Extends:** [`IViewBaseProps`](IViewBaseProps.md)

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

[resources](./IResourcePickerProps.resources.md)

</td><td>



</td><td>

[IProcessedResources](IProcessedResources.md) | [IExtendedProcessedResources](IExtendedProcessedResources.md) | null

</td><td>

Processed resources to display in the picker

</td></tr>
<tr><td>

[selectedResourceId](./IResourcePickerProps.selectedResourceId.md)

</td><td>



</td><td>

string | null

</td><td>

Currently selected resource ID

</td></tr>
<tr><td>

[onResourceSelect](./IResourcePickerProps.onResourceSelect.md)

</td><td>



</td><td>

(selection: [IResourceSelection](IResourceSelection.md)&lt;T&gt;) =&gt; void

</td><td>

Callback fired when a resource is selected, providing comprehensive selection data

</td></tr>
<tr><td>

[resourceAnnotations](./IResourcePickerProps.resourceAnnotations.md)

</td><td>



</td><td>

[IResourceAnnotations](IResourceAnnotations.md)

</td><td>

Annotations to display next to resource names (badges, indicators, etc.)

</td></tr>
<tr><td>

[pendingResources](./IResourcePickerProps.pendingResources.md)

</td><td>



</td><td>

[IPendingResource](IPendingResource.md)&lt;T&gt;[]

</td><td>

Pending (unsaved) resources to display alongside persisted resources

</td></tr>
<tr><td>

[options](./IResourcePickerProps.options.md)

</td><td>



</td><td>

[IResourcePickerOptions](IResourcePickerOptions.md)

</td><td>

Options controlling picker appearance and behavior

</td></tr>
<tr><td>

[className](./IViewBaseProps.className.md)

</td><td>



</td><td>

string

</td><td>

Additional CSS class names for styling

</td></tr>
<tr><td>

[pickerOptionsPanelPresentation](./IViewBaseProps.pickerOptionsPanelPresentation.md)

</td><td>



</td><td>

"inline" | "hidden" | "popover" | "popup" | "collapsible"

</td><td>

How to present the ResourcePicker options control panel (default: 'hidden' for production use)

</td></tr>
</tbody></table>
