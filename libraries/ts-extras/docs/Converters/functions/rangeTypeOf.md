[Home](../../README.md) > [Converters](../README.md) > rangeTypeOf

# Function: rangeTypeOf

A helper wrapper to construct a `Converter` which converts to an arbitrary strongly-typed
range of some comparable type.

## Signature

```typescript
function rangeTypeOf(converter: Converter<T, TC>, constructor: (init: RangeOfProperties<T>) => Result<RT>): Converter<RT, TC>
```
