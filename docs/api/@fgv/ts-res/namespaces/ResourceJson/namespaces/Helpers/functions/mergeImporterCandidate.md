[**@fgv Monorepo API Documentation**](../../../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../../../README.md) / [@fgv/ts-res](../../../../../README.md) / [ResourceJson](../../../README.md) / [Helpers](../README.md) / mergeImporterCandidate

# Function: mergeImporterCandidate()

> **mergeImporterCandidate**(`candidate`, `baseName?`, `baseConditions?`): [`Result`](../../../../../../ts-res-ui-components/type-aliases/Result.md)\<[`IImporterResourceCandidateDecl`](../../Normalized/interfaces/IImporterResourceCandidateDecl.md)\>

Helper method to merge a resource candidate with a base name and conditions from import context.
This function enables name inheritance for resource candidates, similar to resources.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `candidate` | [`IImporterResourceCandidateDecl`](../../Normalized/interfaces/IImporterResourceCandidateDecl.md) | The candidate to merge. Can have an optional ID that will be joined with baseName. |
| `baseName?` | `string` | The base name from import context to merge with the candidate. When provided, this will be used as the parent component of the candidate ID. |
| `baseConditions?` | readonly [`ILooseConditionDecl`](../../Json/interfaces/ILooseConditionDecl.md)[] | The base conditions from import context to merge with the candidate's conditions. |

## Returns

[`Result`](../../../../../../ts-res-ui-components/type-aliases/Result.md)\<[`IImporterResourceCandidateDecl`](../../Normalized/interfaces/IImporterResourceCandidateDecl.md)\>

`Success` with the merged candidate if successful, otherwise `Failure`.

## Remarks

This function supports name inheritance for candidates:
- Joins baseName with candidate's existing ID using dot notation
- If candidate has no ID, uses baseName as the full ID
- Always merges base conditions with candidate's existing conditions

## Example

```typescript
// Candidate inherits full name from import context
const candidate = { value: "Hello", conditions: [...] }; // No id field
const result = mergeImporterCandidate(candidate, "pages.home.greeting", []);
// Result: { id: "pages.home.greeting", value: "Hello", conditions: [...] }
```
