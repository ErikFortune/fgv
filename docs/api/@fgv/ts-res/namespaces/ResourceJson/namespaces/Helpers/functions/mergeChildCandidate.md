[**@fgv Monorepo API Documentation**](../../../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../../../README.md) / [@fgv/ts-res](../../../../../README.md) / [ResourceJson](../../../README.md) / [Helpers](../README.md) / mergeChildCandidate

# Function: mergeChildCandidate()

> **mergeChildCandidate**(`candidate`, `baseConditions?`): [`Result`](../../../../../../ts-res-ui-components/type-aliases/Result.md)\<[`IChildResourceCandidateDecl`](../../Normalized/interfaces/IChildResourceCandidateDecl.md)\>

Helper method to merge a child candidate with base conditions.

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `candidate` | [`IChildResourceCandidateDecl`](../../Normalized/interfaces/IChildResourceCandidateDecl.md) | The candidate to merge. |
| `baseConditions?` | readonly [`ILooseConditionDecl`](../../Json/interfaces/ILooseConditionDecl.md)[] | The base conditions to merge with the candidate. |

## Returns

[`Result`](../../../../../../ts-res-ui-components/type-aliases/Result.md)\<[`IChildResourceCandidateDecl`](../../Normalized/interfaces/IChildResourceCandidateDecl.md)\>

`Success` with the merged candidate if successful, otherwise `Failure`.
