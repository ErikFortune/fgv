[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-res-ui-components](../../../README.md) / [GridTools](../README.md) / DropdownCell

# Variable: DropdownCell

> `const` **DropdownCell**: `React.FC`\<`IDropdownCellProps`\>

DropdownCell component for editing string values with predefined options.

Supports both dropdown (restricted to options) and combobox (allows custom values) modes.
Can load options dynamically and provides validation for selected values.

## Example

```tsx
<DropdownCell
  value="active"
  resourceId="user-123"
  column={{
    id: 'status',
    dropdownOptions: [
      { value: 'active', label: 'Active' },
      { value: 'inactive', label: 'Inactive' }
    ],
    allowCustomValue: false
  }}
  isEditing={false}
  onChange={handleChange}
  onSave={handleSave}
  onValidationChange={handleValidation}
/>
```
