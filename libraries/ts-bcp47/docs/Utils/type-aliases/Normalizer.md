[Home](../../README.md) > [Utils](../README.md) > Normalizer

# Type Alias: Normalizer

A function which accepts a value of the expected type and reformats it to match
the canonical presentation form.

## Type

```typescript
type Normalizer = (val: T, context?: TC) => Result<T>
```
