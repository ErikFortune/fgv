[Home](../../README.md) > [Converters](../README.md) > oneOf

# Function: oneOf

A helper function to create a Converter | Converter for polymorphic values.
Returns a converter which invokes the wrapped converters in sequence, returning the
first successful result.  Returns an error if none of the supplied converters can
convert the value.

## Signature

```typescript
function oneOf(converters: (Converter<T, TC> | Validator<T, TC>)[], onError: OnError): Converter<T, TC>
```
