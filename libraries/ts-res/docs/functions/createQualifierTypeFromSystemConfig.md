[Home](../README.md) > createQualifierTypeFromSystemConfig

# Function: createQualifierTypeFromSystemConfig

Creates a QualifierTypes.SystemQualifierType | SystemQualifierType from a system configuration object.
This factory function determines the appropriate qualifier type based on the systemType
and delegates to the appropriate type-specific createFromConfig method.

## Signature

```typescript
function createQualifierTypeFromSystemConfig(typeConfig: ISystemQualifierTypeConfig): Result<SystemQualifierType>
```
