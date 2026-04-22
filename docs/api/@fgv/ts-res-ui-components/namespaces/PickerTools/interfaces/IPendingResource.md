[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-res-ui-components](../../../README.md) / [PickerTools](../README.md) / IPendingResource

# Interface: IPendingResource\<T\>

Represents a resource that hasn't been persisted yet.

Pending resources are displayed alongside persisted resources in the picker,
allowing users to interact with unsaved changes. They are visually distinguished
with appropriate styling and annotations.

## Example

```tsx
const pendingResources: IPendingResource<MyResourceType>[] = [
  {
    id: 'user.new-welcome',
    type: 'new',
    resourceType: 'string',
    displayName: 'Welcome Message (New)',
    resourceData: { text: 'Welcome!', locale: 'en' }
  },
  {
    id: 'user.existing-modified',
    type: 'modified',
    displayName: 'User Profile (Modified)',
    resourceData: { name: 'Updated Name' }
  }
];
```

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `T` | `unknown` |

## Properties

| Property | Type | Description |
| ------ | ------ | ------ |
| <a id="displayname"></a> `displayName?` | `string` | Display name for the resource in the picker |
| <a id="id"></a> `id` | `string` | Unique identifier for the pending resource |
| <a id="resourcedata"></a> `resourceData?` | `T` | The actual resource data with type safety |
| <a id="resourcetype"></a> `resourceType?` | `string` | Optional resource type identifier |
| <a id="type"></a> `type` | `"deleted"` \| `"new"` \| `"modified"` | Type of pending operation |
