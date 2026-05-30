[Home](../README.md) > hasFilterValues

# Function: hasFilterValues

Checks if a filter values object contains any meaningful (non-empty) filter values.

Utility function to determine whether filtering should be applied based on
the presence of actual filter values. Ignores undefined and empty string values.

## Signature

```typescript
function hasFilterValues(values: Record<string, string | undefined>): boolean
```
