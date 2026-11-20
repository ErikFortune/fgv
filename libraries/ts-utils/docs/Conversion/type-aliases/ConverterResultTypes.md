[Home](../../README.md) > [Conversion](../README.md) > ConverterResultTypes

# Type Alias: ConverterResultTypes

Helper type to map a tuple of Converter | Converters to a tuple of their result types.

## Type

```typescript
type ConverterResultTypes = { [K in keyof T]: T[K] extends Converter<infer R, unknown> ? R : never }
```
