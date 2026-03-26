[Home](../../README.md) > [Converters](../README.md) > mappedEnumeratedValue

# Function: mappedEnumeratedValue

Helper function to create a Converter | Converter which converts `unknown` to one of a set of supplied enumerated
values, mapping any of multiple supplied values to the enumeration.

## Signature

```typescript
function mappedEnumeratedValue(map: readonly [T, readonly TC[]][], message: string): Converter<T, readonly TC[]>
```
