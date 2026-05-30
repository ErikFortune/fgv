[Home](../../README.md) > [Converters](../README.md) > rangeOf

# Function: rangeOf

A helper wrapper to construct a `Converter` which converts to Experimental.RangeOf | RangeOf<T>
where `<T>` is some comparable type.

## Signature

```typescript
function rangeOf(converter: Converter<T, TC>): Converter<RangeOf<T>, TC>
```
