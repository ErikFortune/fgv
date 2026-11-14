[Home](../../README.md) > [Converters](../README.md) > validateWith

# Function: validateWith

Helper function to create  a Converter | Converter which validates that a supplied value is
of a type validated by a supplied validator function and returns it.

## Signature

```typescript
function validateWith(validator: (from: unknown) => from is T, description: string): Converter<T, TC>
```
