[Home](../../README.md) > [Conversion](../README.md) > FieldConverters

# Type Alias: FieldConverters

Per-property converters or validators for each of the properties in type T.

## Type

```typescript
type FieldConverters = { [key in keyof T]: Converter<T[key], TC | unknown> | Validator<T[key], TC> }
```
