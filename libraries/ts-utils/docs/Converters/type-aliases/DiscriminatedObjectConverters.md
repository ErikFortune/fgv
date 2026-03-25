[Home](../../README.md) > [Converters](../README.md) > DiscriminatedObjectConverters

# Type Alias: DiscriminatedObjectConverters

A string-keyed `Record<string, Converter>` which maps specific Converter | converters or
Validator | Validators to the value of a discriminator property.

## Type

```typescript
type DiscriminatedObjectConverters = Record<TD, Converter<T, TC> | Validator<T, TC>>
```
