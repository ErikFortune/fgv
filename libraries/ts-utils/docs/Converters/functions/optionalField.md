[Home](../../README.md) > [Converters](../README.md) > optionalField

# Function: optionalField

A helper function to create a Converter | Converter which extracts and convert a property specified
by name from an object.

## Signature

```typescript
function optionalField(name: string, converter: Converter<T, TC> | Validator<T, TC>): Converter<T | undefined, TC>
```
