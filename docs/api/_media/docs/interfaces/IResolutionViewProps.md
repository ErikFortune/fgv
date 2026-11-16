[Home](../README.md) > IResolutionViewProps

# Interface: IResolutionViewProps

Props for the ResolutionView component.
Provides resource resolution testing and debugging.

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

[resources](./IResolutionViewProps.resources.md)

</td><td>



</td><td>

[IProcessedResources](IProcessedResources.md) | null

</td><td>

The resource system for resolution testing

</td></tr>
<tr><td>

[filterState](./IResolutionViewProps.filterState.md)

</td><td>



</td><td>

[IFilterState](IFilterState.md)

</td><td>

Optional filter state

</td></tr>
<tr><td>

[filterResult](./IResolutionViewProps.filterResult.md)

</td><td>



</td><td>

[IFilterResult](IFilterResult.md) | null

</td><td>

Filter results if applied

</td></tr>
<tr><td>

[resolutionState](./IResolutionViewProps.resolutionState.md)

</td><td>



</td><td>

[IResolutionState](IResolutionState.md)

</td><td>

Current resolution testing state

</td></tr>
<tr><td>

[resolutionActions](./IResolutionViewProps.resolutionActions.md)

</td><td>



</td><td>

[IResolutionActions](IResolutionActions.md)

</td><td>

Actions for managing resolution state

</td></tr>
<tr><td>

[availableQualifiers](./IResolutionViewProps.availableQualifiers.md)

</td><td>



</td><td>

string[]

</td><td>

Available qualifiers for context building

</td></tr>
<tr><td>

[resourceEditorFactory](./IResolutionViewProps.resourceEditorFactory.md)

</td><td>



</td><td>

[IResourceEditorFactory](IResourceEditorFactory.md)&lt;unknown, [JsonValue](../type-aliases/JsonValue.md)&gt;

</td><td>

Optional factory for creating type-specific resource editors

</td></tr>
<tr><td>

[pickerOptions](./IResolutionViewProps.pickerOptions.md)

</td><td>



</td><td>

[IResourcePickerOptions](IResourcePickerOptions.md)

</td><td>

Optional configuration for the ResourcePicker behavior

</td></tr>
<tr><td>

[contextOptions](./IResolutionViewProps.contextOptions.md)

</td><td>



</td><td>

[IResolutionContextOptions](IResolutionContextOptions.md)

</td><td>

Optional configuration for the resolution context controls

</td></tr>
<tr><td>

[lockedViewMode](./IResolutionViewProps.lockedViewMode.md)

</td><td>



</td><td>

"raw" | "all" | "composed" | "best"

</td><td>

Lock to a single view state and suppress the view state selector

</td></tr>
<tr><td>

[sectionTitles](./IResolutionViewProps.sectionTitles.md)

</td><td>



</td><td>

{ resources?: string; results?: string }

</td><td>

Custom titles for the main sections

</td></tr>
<tr><td>

[allowResourceCreation](./IResolutionViewProps.allowResourceCreation.md)

</td><td>



</td><td>

boolean

</td><td>

Allow creating new resources in the UI

</td></tr>
<tr><td>

[defaultResourceType](./IResolutionViewProps.defaultResourceType.md)

</td><td>



</td><td>

string

</td><td>

Default resource type for new resources (hides type selector if provided)

</td></tr>
<tr><td>

[resourceTypeFactory](./IResolutionViewProps.resourceTypeFactory.md)

</td><td>



</td><td>

IResourceType&lt;unknown&gt;[]

</td><td>

Factory for creating custom resource types

</td></tr>
<tr><td>

[onPendingResourcesApplied](./IResolutionViewProps.onPendingResourcesApplied.md)

</td><td>



</td><td>

(added: ILooseResourceDecl&lt;string&gt;[], deleted: string[]) =&gt; void

</td><td>

Callback when pending resources are applied

</td></tr>
<tr><td>

[showPendingResourcesInList](./IResolutionViewProps.showPendingResourcesInList.md)

</td><td>



</td><td>

boolean

</td><td>

Show pending resources in the resource list with visual distinction

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
