[**@fgv Monorepo API Documentation**](../../../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../../../README.md) / [@fgv/ts-res](../../../../../README.md) / [ResourceJson](../../../README.md) / [Helpers](../README.md) / mergeLooseCandidate

# Function: mergeLooseCandidate()

> **mergeLooseCandidate**(`candidate`, `baseName?`, `baseConditions?`): [`Result`](../../../../../../ts-res-ui-components/type-aliases/Result.md)\<[`ILooseResourceCandidateDecl`](../../Normalized/interfaces/ILooseResourceCandidateDecl.md)\>

Helper method to merge a loose candidate with a base name and conditions.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `candidate` | [`IImporterResourceCandidateDecl`](../../Normalized/interfaces/IImporterResourceCandidateDecl.md) | The candidate to merge. |
| `baseName?` | `string` | The base name to merge with the candidate. |
| `baseConditions?` | readonly [`ILooseConditionDecl`](../../Json/interfaces/ILooseConditionDecl.md)[] | The base conditions to merge with the candidate. |

## Returns

[`Result`](../../../../../../ts-res-ui-components/type-aliases/Result.md)\<[`ILooseResourceCandidateDecl`](../../Normalized/interfaces/ILooseResourceCandidateDecl.md)\>

`Success` with the merged candidate if successful, otherwise `Failure`.
