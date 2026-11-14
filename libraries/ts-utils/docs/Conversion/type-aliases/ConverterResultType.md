[Home](../../README.md) > [Conversion](../README.md) > ConverterResultType

# Type Alias: ConverterResultType

Helper type to extract the result type from a Converter | Converter.
For simple single-level extraction. For complex nested types, use Conversion.Infer | Infer.

## Type

```typescript
type ConverterResultType = C extends Converter<infer T, unknown> ? T : never
```
