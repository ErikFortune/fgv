[Home](../README.md) > oneOf

# Function: oneOf

Creates a filter that checks if value is one of the allowed values.

## Signature

```typescript
function oneOf(allowed: V[], getter: (item: T) => V | undefined): FilterPredicate<T>
```
