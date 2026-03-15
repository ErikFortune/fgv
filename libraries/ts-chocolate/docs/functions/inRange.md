[Home](../README.md) > inRange

# Function: inRange

Creates a filter for numeric range (inclusive).

## Signature

```typescript
function inRange(min: number | undefined, max: number | undefined, getter: (item: T) => number | undefined): FilterPredicate<T>
```
