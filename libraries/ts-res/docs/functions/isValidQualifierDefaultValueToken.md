[Home](../README.md) > isValidQualifierDefaultValueToken

# Function: isValidQualifierDefaultValueToken

Determines whether a string is a valid QualifierDefaultValueToken | qualifier default value token.
A qualifier default value token has the format:
`<qualifierName>=<value>` or `<qualifierName>=` (to remove default)
Default values allow broader character set including commas for comma-separated values.

## Signature

```typescript
function isValidQualifierDefaultValueToken(token: string): token is QualifierDefaultValueToken
```
