[Home](../README.md) > optionalElement

# Function: optionalElement

A helper function to create a Converter | Converter which extracts and converts an optional element from an array.

## Signature

```typescript
function optionalElement(index: number, converter: Converter<T, TC> | Validator<T, TC>): Converter<T | undefined, TC>
```
