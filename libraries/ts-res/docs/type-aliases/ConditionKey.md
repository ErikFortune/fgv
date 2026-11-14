[Home](../README.md) > ConditionKey

# Type Alias: ConditionKey

A branded string representing a validated condition key.  A condition key is a
string value which fully describes the condition apart from index.  The condition
key can be used to quickly determine if two conditions are identical apart from
index, or for inspection.

## Type

```typescript
type ConditionKey = Brand<string, "ConditionKey">
```
