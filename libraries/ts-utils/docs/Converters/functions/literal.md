[Home](../../README.md) > [Converters](../README.md) > literal

# Function: literal

Helper function to create a Converter | Converter which converts `unknown` to some supplied literal value. Succeeds with
the supplied value if an identity comparison succeeds, fails otherwise.

## Signature

```typescript
function literal(value: T): Converter<T, TC>
```
