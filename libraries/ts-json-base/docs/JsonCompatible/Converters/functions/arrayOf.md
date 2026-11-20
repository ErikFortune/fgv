[Home](../../../README.md) > [JsonCompatible](../../README.md) > [Converters](../README.md) > arrayOf

# Function: arrayOf

A helper function to create a JsonCompatible.ArrayConverter | JSON-compatible ArrayConverter<T, TC>
which converts a supplied `unknown` value to a valid array of JsonCompatibleType | JsonCompatibleType<T>.

## Signature

```typescript
function arrayOf(converter: Converter<T, TC> | Validator<T, TC>, onError: OnError): ArrayConverter<T, TC>
```
