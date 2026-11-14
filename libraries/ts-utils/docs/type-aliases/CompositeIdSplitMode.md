[Home](../README.md) > CompositeIdSplitMode

# Type Alias: CompositeIdSplitMode

How a composite ID string is split into its collection and item parts:
- `'exact'` (the default) requires exactly one separator and fails if the
  string contains more than one.
- `'first'` splits at the first separator; everything after it, including any
  further separators, is passed untouched to the item ID converter or validator.
- `'last'` splits at the last separator; everything before it, including any
  further separators, is passed untouched to the collection ID converter or validator.

`'first'` and `'last'` require a non-empty separator and fail without one.

## Type

```typescript
type CompositeIdSplitMode = typeof allCompositeIdSplitModes[number]
```
