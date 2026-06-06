[Home](../README.md) > SystemQualifierType

# Type Alias: SystemQualifierType

A discriminated union of all system qualifier types.
This allows TypeScript to properly discriminate between specific qualifier type implementations
and access their specific methods like getConfiguration().

## Type

```typescript
type SystemQualifierType = LanguageQualifierType | TerritoryQualifierType | LiteralQualifierType
```
