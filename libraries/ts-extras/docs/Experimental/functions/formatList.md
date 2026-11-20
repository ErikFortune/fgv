[Home](../../README.md) > [Experimental](../README.md) > formatList

# Function: formatList

Formats a list of items using the supplied template and formatter, one result
per output line.

## Signature

```typescript
function formatList(format: string, items: T[], itemFormatter: Formatter<T>): Result<string>
```
