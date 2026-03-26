[Home](../../README.md) > [Converters](../README.md) > discriminatedObject

# Function: discriminatedObject

Helper to create a Converter | Converter which converts a discriminated object without changing shape.

## Signature

```typescript
function discriminatedObject(discriminatorProp: string, converters: DiscriminatedObjectConverters<T, TD>): Converter<T, TC>
```
