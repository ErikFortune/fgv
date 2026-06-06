[Home](../README.md) > ConditionToken

# Type Alias: ConditionToken

A string representing a validated condition token.  Condition tokens are
typically extracted from the name of some resource (e.g. file or folder)
being imported.   A condition token has the form `<qualifierName>=<value>`
or `<value>`.

## Type

```typescript
type ConditionToken = Brand<string, "ConditionToken">
```
