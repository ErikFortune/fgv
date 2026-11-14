[Home](../../README.md) > [Validation](../README.md) > FieldValidators

# Type Alias: FieldValidators

Per-property Validation.Validator | validators for each of the properties in `<T>`.

## Type

```typescript
type FieldValidators = { [key in keyof T]: Validator<T[key], TC> }
```
