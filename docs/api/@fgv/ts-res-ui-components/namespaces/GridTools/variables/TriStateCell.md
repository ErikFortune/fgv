[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-res-ui-components](../../../README.md) / [GridTools](../README.md) / TriStateCell

# Variable: TriStateCell

> `const` **TriStateCell**: `React.FC`\<`ITriStateCellProps`\>

TriStateCell component for editing three-state boolean values.

Supports true, false, and null/undefined states with two presentation modes:
- Checkbox mode: 3-state checkbox (checked, unchecked, indeterminate)
- Dropdown mode: Select dropdown with three options

## Example

```tsx
<TriStateCell
  value={null}
  resourceId="feature-123"
  column={{ id: 'enabled', title: 'Feature Enabled' }}
  presentation="dropdown"
  onChange={handleChange}
  onSave={handleSave}
  onValidationChange={handleValidation}
/>
```
