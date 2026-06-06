[Home](../README.md) > ResourceEditorResult

# Type Alias: ResourceEditorResult

Result of attempting to create a resource editor for a specific resource.
Used by ResourceEditorFactory to provide type-specific editors.

## Type

```typescript
type ResourceEditorResult = { success: true; editor: React.ComponentType<IResourceEditorProps<T, TV>> } | { success: false; message?: string }
```
