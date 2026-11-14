[Home](../README.md) > strictObject

# Function: strictObject

A helper function to create a JsonCompatible.ObjectConverter | JSON-compatible ObjectConverter<T, TC> which converts a
supplied `unknown` value to a valid JsonCompatibleType | JsonCompatibleType<T> value.

## Signature

```typescript
function strictObject(properties: Conversion.FieldConverters<JsonCompatibleType<T>, TC>, options: StrictObjectConverterOptions<JsonCompatibleType<T>>): ObjectConverter<T, TC>
```
