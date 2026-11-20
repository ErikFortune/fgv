[Home](../README.md) > DecisionKey

# Type Alias: DecisionKey

Branded string representing a validated decision key. A decision key is a string
value which fully describes the decision apart from index. The decision key can
be used to quickly determine if two decisions are identical apart from index.

## Type

```typescript
type DecisionKey = Brand<string, "DecisionKey">
```
