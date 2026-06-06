[Home](../README.md) > mergeImporterResource

# Function: mergeImporterResource

Helper method to merge a resource with a base name and conditions from import context.
This function enables name inheritance where resources can automatically inherit their
resource ID from the import context when no explicit ID is provided in the resource declaration.

## Signature

```typescript
function mergeImporterResource(resource: IImporterResourceDecl, baseName: string, baseConditions: readonly ILooseConditionDecl<string>[]): Result<IImporterResourceDecl>
```
