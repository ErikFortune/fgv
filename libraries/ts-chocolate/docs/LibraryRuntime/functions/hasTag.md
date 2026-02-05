[Home](../../README.md) > [LibraryRuntime](../README.md) > hasTag

# Function: hasTag

Creates a tag filter that checks if item has the specified tag.

## Signature

```typescript
function hasTag(tag: string, getter: (item: T) => readonly string[]): FilterPredicate<T>
```
