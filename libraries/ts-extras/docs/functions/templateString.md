[Home](../README.md) > templateString

# Function: templateString

Helper function to create a `StringConverter` which converts
`unknown` to `string`, applying template conversions supplied at construction time or at
runtime as context.

## Signature

```typescript
function templateString(defaultContext: unknown): StringConverter<string, unknown>
```
