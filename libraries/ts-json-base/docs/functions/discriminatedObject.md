[Home](../README.md) > discriminatedObject

# Function: discriminatedObject

A helper function to create a JsonCompatible.Converter | JSON-compatible Converter<T, TC> which converts a
supplied `unknown` value to a valid JsonCompatibleType | JsonCompatibleType<T> value.

## Signature

```typescript
function discriminatedObject(discriminatorProp: string, converters: Converters.DiscriminatedObjectConverters<JsonCompatibleType<T>, TD, TC>): Converter<T, TC>
```
