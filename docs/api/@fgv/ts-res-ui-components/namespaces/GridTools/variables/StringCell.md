[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-res-ui-components](../../../README.md) / [GridTools](../README.md) / StringCell

# Variable: StringCell

> `const` **StringCell**: `React.FC`\<`IStringCellProps`\>

StringCell component for editing string values with validation.

Provides text input with configurable validation, visual error highlighting,
and support for required fields, length limits, and pattern matching.

## Example

```tsx
<StringCell
  value="user@example.com"
  resourceId="user-123"
  column={{
    id: 'email',
    validation: {
      required: true,
      pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    }
  }}
  isEditing={false}
  onChange={handleChange}
  onSave={handleSave}
  onValidationChange={handleValidation}
/>
```
