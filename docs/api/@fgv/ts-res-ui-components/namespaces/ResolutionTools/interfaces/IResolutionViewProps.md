[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-res-ui-components](../../../README.md) / [ResolutionTools](../README.md) / IResolutionViewProps

# Interface: IResolutionViewProps

Props for the ResolutionView component.
Provides resource resolution testing and debugging.

## Extends

- [`IViewBaseProps`](../../ViewStateTools/interfaces/IViewBaseProps.md)

## Properties

| Property | Type | Description |
| ------ | ------ | ------ |
| <a id="allowresourcecreation"></a> `allowResourceCreation?` | `boolean` | Allow creating new resources in the UI |
| <a id="availablequalifiers"></a> `availableQualifiers?` | `string`[] | Available qualifiers for context building |
| <a id="classname"></a> `className?` | `string` | Additional CSS class names for styling |
| <a id="contextoptions"></a> `contextOptions?` | [`IResolutionContextOptions`](IResolutionContextOptions.md) | Optional configuration for the resolution context controls |
| <a id="defaultresourcetype"></a> `defaultResourceType?` | `string` | Default resource type for new resources (hides type selector if provided) |
| <a id="filterresult"></a> `filterResult?` | [`IFilterResult`](../../FilterTools/interfaces/IFilterResult.md) \| `null` | Filter results if applied |
| <a id="filterstate"></a> `filterState?` | [`IFilterState`](../../FilterTools/interfaces/IFilterState.md) | Optional filter state |
| <a id="lockedviewmode"></a> `lockedViewMode?` | `"raw"` \| `"all"` \| `"composed"` \| `"best"` | Lock to a single view state and suppress the view state selector |
| <a id="onpendingresourcesapplied"></a> `onPendingResourcesApplied?` | (`added`, `deleted`) => `void` | Callback when pending resources are applied |
| <a id="pickeroptions"></a> `pickerOptions?` | [`IResourcePickerOptions`](../../PickerTools/interfaces/IResourcePickerOptions.md) | Optional configuration for the ResourcePicker behavior |
| <a id="pickeroptionspanelpresentation"></a> `pickerOptionsPanelPresentation?` | `"inline"` \| `"hidden"` \| `"popover"` \| `"popup"` \| `"collapsible"` | How to present the ResourcePicker options control panel (default: 'hidden' for production use) |
| <a id="resolutionactions"></a> `resolutionActions?` | [`IResolutionActions`](../../../interfaces/IResolutionActions.md) | Actions for managing resolution state |
| <a id="resolutionstate"></a> `resolutionState?` | [`IResolutionState`](IResolutionState.md) | Current resolution testing state |
| <a id="resourceeditorfactory"></a> `resourceEditorFactory?` | [`IResourceEditorFactory`](../../ResourceTools/interfaces/IResourceEditorFactory.md)\<`unknown`, [`JsonValue`](../../../type-aliases/JsonValue.md)\> | Optional factory for creating type-specific resource editors |
| <a id="resources"></a> `resources?` | [`IProcessedResources`](../../ResourceTools/interfaces/IProcessedResources.md) \| `null` | The resource system for resolution testing |
| <a id="resourcetypefactory"></a> `resourceTypeFactory?` | [`IResourceType`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-res/docs)\<`unknown`\>[] | Factory for creating custom resource types |
| <a id="sectiontitles"></a> `sectionTitles?` | `object` | Custom titles for the main sections |
| `sectionTitles.resources?` | `string` | Title for the resources picker section (default: "Resources") |
| `sectionTitles.results?` | `string` | Title for the results section (default: "Results") |
| <a id="showpendingresourcesinlist"></a> `showPendingResourcesInList?` | `boolean` | Show pending resources in the resource list with visual distinction |
