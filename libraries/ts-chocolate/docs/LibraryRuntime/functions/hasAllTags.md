[Home](../../README.md) > [LibraryRuntime](../README.md) > hasAllTags

# Function: hasAllTags

Creates a filter that checks if item has all of the specified tags.

## Signature

```typescript
function hasAllTags(tags: string[], getter: (item: T) => readonly string[]): FilterPredicate<T>
```
