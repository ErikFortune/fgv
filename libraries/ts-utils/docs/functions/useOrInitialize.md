[Home](../README.md) > useOrInitialize

# Function: useOrInitialize

Uses a value or calls a supplied initializer if the supplied value is undefined.

## Signature

```typescript
function useOrInitialize(value: T | undefined, initializer: () => Result<T>): Result<T>
```
