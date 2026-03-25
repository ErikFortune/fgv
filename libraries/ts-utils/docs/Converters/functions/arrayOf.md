[Home](../../README.md) > [Converters](../README.md) > arrayOf

# Function: arrayOf

A helper function to create a Converter | Converter which converts `unknown` to an array of `<T>`.

## Signature

```typescript
function arrayOf(converter: Converter<T, TC> | Validator<T, TC>, onError: OnError): Converter<T[], TC>
```
