[Home](../README.md) > ConversionErrorHandling

# Type Alias: ConversionErrorHandling

Error handling behavior for conversion failures during iteration.
- `'ignore'`: Silently skip failed conversions (default behavior)
- `'warn'`: Log warning and skip failed conversions
- `'fail'`: Throw error on first conversion failure

## Type

```typescript
type ConversionErrorHandling = "ignore" | "warn" | "fail"
```
