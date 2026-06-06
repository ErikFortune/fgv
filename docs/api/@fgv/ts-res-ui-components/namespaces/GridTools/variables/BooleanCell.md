[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-res-ui-components](../../../README.md) / [GridTools](../README.md) / BooleanCell

# Variable: BooleanCell

> `const` **BooleanCell**: `React.FC`\<`IBooleanCellProps`\>

BooleanCell component for editing boolean values with checkbox presentation.

Provides a clean checkbox interface for true/false values with clear
visual state indication and immediate save on change.

## Example

```tsx
<BooleanCell
  value={true}
  resourceId="user-123"
  column={{ id: 'enabled', title: 'Enabled' }}
  onChange={handleChange}
  onSave={handleSave}
  onValidationChange={handleValidation}
/>
```
