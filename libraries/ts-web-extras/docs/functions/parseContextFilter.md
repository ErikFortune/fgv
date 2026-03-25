[Home](../README.md) > parseContextFilter

# Function: parseContextFilter

Converts context filter token to context object
Example: "language=en-US|territory=US" -\> { language: "en-US", territory: "US" }

## Signature

```typescript
function parseContextFilter(contextFilter: string): Record<string, string>
```
