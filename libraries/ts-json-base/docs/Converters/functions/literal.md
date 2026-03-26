[Home](../../README.md) > [Converters](../README.md) > literal

# Function: literal

Helper to create a converter for a literal value.
Accepts `IJsonConverterContext` but ignores it.
Mirrors the behavior of `@fgv/ts-utils`.

## Signature

```typescript
function literal(value: T): Converter<T, IJsonConverterContext>
```
