[Home](../README.md) > isValidContextQualifierToken

# Function: isValidContextQualifierToken

Determines whether a string is a valid ContextQualifierToken | context qualifier token.
A context qualifier token has the format:
`<qualifierName>=<value>` or `<value>`
Context qualifier tokens allow broader character set including commas for comma-separated values.

## Signature

```typescript
function isValidContextQualifierToken(token: string): token is ContextQualifierToken
```
