[Home](../../README.md) > [Validate](../README.md) > isValidConditionKey

# Function: isValidConditionKey

Determines whether a string is a valid condition key.  A condition key has
the format:
`<qualifierName>(-<operator>)?-[<value>]@<priority>`
where operator is omitted for the default 'matches' operator.

## Signature

```typescript
function isValidConditionKey(key: string): key is ConditionKey
```
