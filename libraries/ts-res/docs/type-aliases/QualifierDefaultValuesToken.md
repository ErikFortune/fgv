[Home](../README.md) > QualifierDefaultValuesToken

# Type Alias: QualifierDefaultValuesToken

A string representing a validated qualifier default values token. Default value tokens are
pipe-separated lists of one or more qualifier default value tokens. Uses "|" as separator
to avoid conflicts with comma-separated values within default values.
Example: "language=en-US,en-CA|territory=US|device=desktop,tablet"

## Type

```typescript
type QualifierDefaultValuesToken = Brand<string, "QualifierDefaultValuesToken">
```
