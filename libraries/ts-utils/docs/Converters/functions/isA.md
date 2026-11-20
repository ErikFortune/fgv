[Home](../../README.md) > [Converters](../README.md) > isA

# Function: isA

Helper function to create a Converter | Converter from a supplied type guard function.

## Signature

```typescript
function isA(description: string, guard: TypeGuardWithContext<T, TC>): Converter<T, TC>
```
