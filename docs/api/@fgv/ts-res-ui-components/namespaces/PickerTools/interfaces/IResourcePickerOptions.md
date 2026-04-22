[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-res-ui-components](../../../README.md) / [PickerTools](../README.md) / IResourcePickerOptions

# Interface: IResourcePickerOptions

UI behavior configuration options for ResourcePicker.

This interface groups all UI-related options that control how the ResourcePicker
behaves and appears, separate from functional data like annotations and pending resources.

## Example

```tsx
const pickerOptions: IResourcePickerOptions = {
  defaultView: 'tree',
  enableSearch: true,
  searchPlaceholder: 'Find resources...',
  rootPath: 'user.messages',
  hideRootNode: true,
  height: '400px'
};
```

## Properties

| Property | Type | Description |
| ------ | ------ | ------ |
| <a id="defaultview"></a> `defaultView?` | `"list"` \| `"tree"` | Default view mode to use on initial render |
| <a id="emptymessage"></a> `emptyMessage?` | `string` | Message to display when no resources are available |
| <a id="enablesearch"></a> `enableSearch?` | `boolean` | Whether to enable the search input |
| <a id="height"></a> `height?` | `string` \| `number` | Height of the picker component |
| <a id="hiderootnode"></a> `hideRootNode?` | `boolean` | Hide the root node itself, showing only its children |
| <a id="rootpath"></a> `rootPath?` | `string` | Path to treat as root for tree branch isolation (e.g., "platform/territories") |
| <a id="searchplaceholder"></a> `searchPlaceholder?` | `string` | Placeholder text for the search input |
| <a id="searchscope"></a> `searchScope?` | `"all"` \| `"current-branch"` | Scope of search - entire tree or just the currently visible branch |
| <a id="showviewtoggle"></a> `showViewToggle?` | `boolean` | Whether to show the list/tree view toggle buttons |
