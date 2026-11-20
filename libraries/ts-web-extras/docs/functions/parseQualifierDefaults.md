[Home](../README.md) > parseQualifierDefaults

# Function: parseQualifierDefaults

Converts qualifier defaults token to structured format
Example: "language=en-US,en-CA|territory=US" -\> { language: ["en-US", "en-CA"], territory: ["US"] }

## Signature

```typescript
function parseQualifierDefaults(qualifierDefaults: string): Record<string, string[]>
```
