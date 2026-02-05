[Home](../README.md) > collectionContainsAny

# Function: collectionContainsAny

Creates a filter that checks if a collection contains any of the values.

## Signature

```typescript
function collectionContainsAny(values: V[], getter: (item: T) => readonly V[] | undefined): FilterPredicate<T>
```
