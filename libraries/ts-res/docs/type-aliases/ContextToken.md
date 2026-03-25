[Home](../README.md) > ContextToken

# Type Alias: ContextToken

A string representing a validated context token. Context tokens are
pipe-separated lists of one or more context qualifier tokens. Uses "|" as separator
to avoid conflicts with comma-separated values within context values.
Example: "language=en-US,de-DE|territory=US|role=admin"

## Type

```typescript
type ContextToken = Brand<string, "ContextToken">
```
