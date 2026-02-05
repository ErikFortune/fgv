[Home](../../README.md) > [LibraryRuntime](../README.md) > hasAnyTag

# Function: hasAnyTag

Creates a filter that checks if item has any of the specified tags.

## Signature

```typescript
function hasAnyTag(tags: string[], getter: (item: T) => readonly string[]): FilterPredicate<T>
```
