[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-res-ui-components](../../../README.md) / [PickerTools](../README.md) / IResourcePickerProps

# Interface: IResourcePickerProps\<T\>

Props for the ResourcePicker component.

The ResourcePicker is a comprehensive component for browsing and selecting resources
with support for multiple view modes, search, annotations, and pending resources.
UI behavior is controlled through the options object, while functional data is
passed as separate props.

## Example

```tsx
<ResourcePicker
  resources={processedResources}
  selectedResourceId={currentId}
  onResourceSelect={(selection) => {
    setCurrentId(selection.resourceId);
    if (selection.resourceData) {
      // Use the resource data directly
      handleResourceData(selection.resourceData);
    }
  }}
  resourceAnnotations={{
    'res1': { badge: { text: '3', variant: 'info' } }
  }}
  options={{
    defaultView: 'tree',
    enableSearch: true,
    searchPlaceholder: 'Find resources...',
    height: '400px'
  }}
/>
```

## Extends

- [`IViewBaseProps`](../../ViewStateTools/interfaces/IViewBaseProps.md)

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `T` | `unknown` |

## Properties

| Property | Type | Description |
| ------ | ------ | ------ |
| <a id="classname"></a> `className?` | `string` | Additional CSS class names for styling |
| <a id="onresourceselect"></a> `onResourceSelect` | (`selection`) => `void` | Callback fired when a resource is selected, providing comprehensive selection data |
| <a id="options"></a> `options?` | [`IResourcePickerOptions`](IResourcePickerOptions.md) | Options controlling picker appearance and behavior |
| <a id="pendingresources"></a> `pendingResources?` | [`IPendingResource`](IPendingResource.md)\<`T`\>[] | Pending (unsaved) resources to display alongside persisted resources |
| <a id="pickeroptionspanelpresentation"></a> `pickerOptionsPanelPresentation?` | `"inline"` \| `"hidden"` \| `"popover"` \| `"popup"` \| `"collapsible"` | How to present the ResourcePicker options control panel (default: 'hidden' for production use) |
| <a id="resourceannotations"></a> `resourceAnnotations?` | [`IResourceAnnotations`](IResourceAnnotations.md) | Annotations to display next to resource names (badges, indicators, etc.) |
| <a id="resources"></a> `resources` | [`IProcessedResources`](../../ResourceTools/interfaces/IProcessedResources.md) \| [`IExtendedProcessedResources`](../../ResourceTools/interfaces/IExtendedProcessedResources.md) \| `null` | Processed resources to display in the picker |
| <a id="selectedresourceid"></a> `selectedResourceId` | `string` \| `null` | Currently selected resource ID |
