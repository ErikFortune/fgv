[Home](../../../README.md) > [JsonCompatible](../../README.md) > [Converters](../README.md) > recordOf

# Function: recordOf

A helper function to create a JsonCompatible.RecordConverter | JSON-compatible RecordConverter<T, TC, TK>
which converts the `string`-keyed properties using a supplied JsonCompatible.Converter | JSON-compatible Converter<T, TC> or
JsonCompatible.Validator | JSON-compatible Validator<T> to produce a
`Record<TK, JsonCompatibleType<T>>`.

## Signature

```typescript
function recordOf(converter: Converter<T, TC> | Validator<T, TC>, options: KeyedConverterOptions<TK, TC>): RecordConverter<T, TC, TK>
```
