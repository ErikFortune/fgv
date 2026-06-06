[Home](../README.md) > typedConditionSetDecl

# Function: typedConditionSetDecl

Returns a `Converter` for a `Json.ConditionSetDecl<TQualifierNames>`
(either array form or record form) narrowed on a supplied `qualifierName`
converter.

## Signature

```typescript
function typedConditionSetDecl(qualifierNameConverter: Converter<TQualifierNames>): Converter<ConditionSetDecl<TQualifierNames>>
```
