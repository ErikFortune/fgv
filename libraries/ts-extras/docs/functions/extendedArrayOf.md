[Home](../README.md) > extendedArrayOf

# Function: extendedArrayOf

A helper function to create a `Converter` which converts `unknown` to Experimental.ExtendedArray | ExtendedArray<T>.

## Signature

```typescript
function extendedArrayOf(label: string, converter: Converter<T, TC>, onError: OnError): Converter<ExtendedArray<T>, TC>
```
