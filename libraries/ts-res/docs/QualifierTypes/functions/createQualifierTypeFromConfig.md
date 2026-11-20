[Home](../../README.md) > [QualifierTypes](../README.md) > createQualifierTypeFromConfig

# Function: createQualifierTypeFromConfig

Creates a QualifierTypes.QualifierType | QualifierType from a configuration object.
This factory function determines the appropriate qualifier type based on the systemType
and delegates to the appropriate type-specific createFromConfig method.

## Signature

```typescript
function createQualifierTypeFromConfig(typeConfig: IAnyQualifierTypeConfig): Result<QualifierType<JsonObject>>
```
