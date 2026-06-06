[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-res-ui-components](../../../README.md) / [PickerTools](../README.md) / ResourcePicker

# Function: ResourcePicker()

> **ResourcePicker**\<`T`\>(`__namedParameters`): `ReactElement`

Comprehensive resource picker component with search, view modes, and annotation support.

The ResourcePicker provides a flexible interface for browsing and selecting resources
from processed resource collections. It supports both list and tree view modes,
search functionality, visual annotations, and pending resource management.

Key features:
- **Multiple view modes**: List view for simple browsing, tree view for hierarchical navigation
- **Search functionality**: Search across all resources or within a specific branch
- **Visual annotations**: Display badges, indicators, and suffixes for enhanced UX
- **Pending resources**: Show unsaved changes alongside persisted resources
- **Branch isolation**: Focus on a specific branch node of the resource tree
- **Type safety**: Full TypeScript support with generic resource data types

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `T` | `unknown` |

## Parameters

| Parameter | Type |
| ------ | ------ |
| `__namedParameters` | [`IResourcePickerProps`](../interfaces/IResourcePickerProps.md)\<`T`\> |

## Returns

`ReactElement`

## Example

```tsx
function MyResourceEditor() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedData, setSelectedData] = useState<MyResourceType | null>(null);

  return (
    <ResourcePicker<MyResourceType>
      resources={processedResources}
      selectedResourceId={selectedId}
      onResourceSelect={(selection) => {
        setSelectedId(selection.resourceId);
        setSelectedData(selection.resourceData || null);

        if (selection.isPending) {
          console.log(`Pending ${selection.pendingType} operation`);
        }
      }}
      defaultView="tree"
      enableSearch={true}
      searchPlaceholder="Search resources..."
      resourceAnnotations={{
        'user.welcome': {
          badge: { text: '3', variant: 'info' },
          suffix: '(3 candidates)'
        }
      }}
      pendingResources={[{
        id: 'user.new-item',
        type: 'new',
        displayName: 'New Welcome Message',
        resourceData: { text: 'Hello World!' }
      }]}
      height="500px"
    />
  );
}
```
