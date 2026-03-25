[Home](../README.md) > ConditionSetToken

# Type Alias: ConditionSetToken

A string representing a validated condition set token.  Condition set tokens are
typically extracted from the name of some resource (e.g. file or folder) being
imported.  A condition set token is a comma-separated list of one or more
ConditionToken | condition tokens, where a condition token has either
the form `<qualifierName>=<value>` or `<value>`.

## Type

```typescript
type ConditionSetToken = Brand<string, "ConditionSetToken">
```
