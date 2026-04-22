[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-res-ui-components](../../../README.md) / [PickerTools](../README.md) / IResourceSelection

# Interface: IResourceSelection\<T\>

Resource selection data returned by the onResourceSelect callback.

This interface provides comprehensive information about the selected resource,
eliminating the need for consumers to perform additional lookups.

## Example

```tsx
const handleResourceSelect = (selection: IResourceSelection<MyResourceType>) => {
  if (selection.resourceId) {
    console.log('Selected:', selection.resourceId);
    if (selection.resourceData) {
      console.log('Data:', selection.resourceData);
    }
    if (selection.isPending) {
      console.log('Pending operation:', selection.pendingType);
    }
  }
};
```

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `T` | `unknown` |

## Properties

| Property | Type | Description |
| ------ | ------ | ------ |
| <a id="ispending"></a> `isPending?` | `boolean` | Whether this is a pending (unsaved) resource |
| <a id="pendingtype"></a> `pendingType?` | `"deleted"` \| `"new"` \| `"modified"` | Type of pending operation for unsaved resources |
| <a id="resourcedata"></a> `resourceData?` | `T` | The actual resource data if available and typed |
| <a id="resourceid"></a> `resourceId` | `string` \| `null` | The ID of the selected resource, or null if no selection |
