[Home](../README.md) > ConditionSetKey

# Type Alias: ConditionSetKey

Branded string representing a validated condition set key. A condition set key
is a string value which fully describes the condition set apart from index. The
condition set key can be used to quickly determine if two condition sets are
identical apart from index, or for inspection.

## Type

```typescript
type ConditionSetKey = Brand<string, "ConditionSetKey">
```
