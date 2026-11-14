[Home](../README.md) > getFilterSummary

# Function: getFilterSummary

Creates a human-readable summary string of active filter values.

Generates a comma-separated string representation of all non-empty filter values,
useful for displaying current filter state to users or in debug output.

## Signature

```typescript
function getFilterSummary(values: Record<string, string | undefined>): string
```
