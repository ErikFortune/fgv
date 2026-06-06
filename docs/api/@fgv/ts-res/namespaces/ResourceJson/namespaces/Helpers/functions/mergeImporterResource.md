[**@fgv Monorepo API Documentation**](../../../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../../../README.md) / [@fgv/ts-res](../../../../../README.md) / [ResourceJson](../../../README.md) / [Helpers](../README.md) / mergeImporterResource

# Function: mergeImporterResource()

> **mergeImporterResource**(`resource`, `baseName?`, `baseConditions?`): [`Result`](../../../../../../ts-res-ui-components/type-aliases/Result.md)\<[`IImporterResourceDecl`](../../Normalized/type-aliases/IImporterResourceDecl.md)\>

Helper method to merge a resource with a base name and conditions from import context.
This function enables name inheritance where resources can automatically inherit their
resource ID from the import context when no explicit ID is provided in the resource declaration.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `resource` | [`IImporterResourceDecl`](../../Normalized/type-aliases/IImporterResourceDecl.md) | The resource to merge. Can be either a loose resource (with optional ID) or a child resource (without ID). |
| `baseName?` | `string` | The base name from import context to merge with the resource. When provided, this will be used as the parent component of the resource ID. |
| `baseConditions?` | readonly [`ILooseConditionDecl`](../../Json/interfaces/ILooseConditionDecl.md)[] | The base conditions from import context to merge with the resource's conditions. |

## Returns

[`Result`](../../../../../../ts-res-ui-components/type-aliases/Result.md)\<[`IImporterResourceDecl`](../../Normalized/type-aliases/IImporterResourceDecl.md)\>

`Success` with the merged resource if successful, otherwise `Failure`.

## Remarks

This function supports several scenarios for name inheritance:
- **Explicit ID + Base Name**: Joins baseName.resourceId (e.g., "pages.home" + "greeting" = "pages.home.greeting")
- **No ID + Base Name**: Uses baseName as the resource ID (enables name inheritance from import context)
- **Explicit ID + No Base Name**: Uses the resource's existing ID
- **No ID + No Base Name**: Returns resource without ID (for child resources)

Base conditions are always merged with the resource's existing conditions.

## Example

```typescript
// Resource without ID inherits name from import context
const resource = { candidates: [...] }; // No id field
const result = mergeImporterResource(resource, "pages.home", []);
// Result: { id: "pages.home", candidates: [...] }

// Resource with ID gets joined with base name
const resource = { id: "greeting", candidates: [...] };
const result = mergeImporterResource(resource, "pages.home", []);
// Result: { id: "pages.home.greeting", candidates: [...] }
```
