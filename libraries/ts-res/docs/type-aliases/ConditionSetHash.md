[Home](../README.md) > ConditionSetHash

# Type Alias: ConditionSetHash

Branded string representing a hash value for a condition set. The hash value
is an 8-character string derived from the crc32 hash of the condition set key
and is used to quickly and compactly identify a condition set or compare for
equality.

## Type

```typescript
type ConditionSetHash = Brand<string, "ConditionSetHash">
```
