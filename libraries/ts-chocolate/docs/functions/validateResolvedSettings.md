[Home](../README.md) > validateResolvedSettings

# Function: validateResolvedSettings

Validates resolved settings against the actual workspace state.

Checks:
- `defaultStorageTargets.globalDefault` references a loaded root
- `defaultStorageTargets.sublibraryOverrides` all reference loaded roots
- `defaultTargets` collection IDs exist in the workspace (when collections provided)

## Signature

```typescript
function validateResolvedSettings(resolved: IResolvedSettings, context: ISettingsValidationContext): ISettingsValidationWarning[]
```
