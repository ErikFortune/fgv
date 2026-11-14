[Home](../README.md) > ResourcePicker

# Function: ResourcePicker

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

## Signature

```typescript
function ResourcePicker(__namedParameters: IResourcePickerProps<T>): ReactElement
```
