[Home](../../README.md) > [Converters](../README.md) > enumeratedValue

# Function: enumeratedValue

Helper function to create a `Converter` which converts `unknown` to one of a set of
supplied enumerated values. Anything else fails.

## Signature

```typescript
function enumeratedValue(values: readonly T[], message: string): Converter<T, IJsonConverterContext | readonly T[]>
```
