[Home](../../README.md) > [Converters](../README.md) > FieldTransformers

# Type Alias: FieldTransformers

Per-property converters and configuration for each field in the destination object of
a Converters.transformObject call.

## Type

```typescript
type FieldTransformers = { [key in keyof TDEST]: { from: keyof TSRC; converter: Converter<TDEST[key], TC> | Validator<TDEST[key], TC>; optional?: boolean } }
```
