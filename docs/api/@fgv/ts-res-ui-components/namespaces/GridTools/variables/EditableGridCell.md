[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-res-ui-components](../../../README.md) / [GridTools](../README.md) / EditableGridCell

# Variable: EditableGridCell

> `const` **EditableGridCell**: `React.FC`\<`IEditableGridCellProps`\>

EditableGridCell component that provides editing capabilities for grid cells.

Automatically selects the appropriate cell editor based on the column configuration
and integrates with the existing IResolutionActions for batch editing support.
Supports validation with visual feedback and prevents invalid changes from being saved.

## Example

```tsx
<EditableGridCell
  value="user@example.com"
  resourceId="user-123"
  column={{
    id: 'email',
    cellType: 'string',
    validation: { required: true, pattern: /email-pattern/ }
  }}
  resolvedValue={{ email: 'user@example.com', name: 'John' }}
  isEdited={false}
  resolutionActions={actions}
  resolutionState={state}
/>
```
