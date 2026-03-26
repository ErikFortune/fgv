[Home](../../README.md) > [Validate](../README.md) > isValidConditionToken

# Function: isValidConditionToken

Determines whether a string is a valid ConditionToken | condition token.
A condition token has the format:
`<qualifierName>=<value>` or `<value>`

## Signature

```typescript
function isValidConditionToken(token: string): token is ConditionToken
```
