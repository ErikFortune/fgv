[Home](../../README.md) > [Converters](../README.md) > tuple

# Function: tuple

Creates a Converter | Converter that converts an array to a strongly-typed tuple,
using the supplied tuple of Converter | Converters to convert each element.

## Signature

```typescript
function tuple(converters: [...T[]]): Converter<ConverterResultTypes<T>, TC>
```
