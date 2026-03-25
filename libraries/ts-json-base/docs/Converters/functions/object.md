[Home](../../README.md) > [Converters](../README.md) > object

# Function: object

A helper function to create a JsonCompatible.ObjectConverter | JSON-compatible ObjectConverter<T, TC> which converts a
supplied `unknown` value to a valid JsonCompatibleType | JsonCompatibleType<T> value.

## Signature

```typescript
function object(properties: Conversion.FieldConverters<JsonCompatibleType<T>, TC>, options: ObjectConverterOptions<JsonCompatibleType<T>>): ObjectConverter<T, TC>
```
