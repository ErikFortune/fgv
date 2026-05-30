[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-res-ui-components](../../../README.md) / [ResolutionTools](../README.md) / ICandidateInfo

# Interface: ICandidateInfo

Detailed information about how a resource candidate was evaluated during resolution.
Provides diagnostic data for understanding why candidates matched or didn't match.

## Properties

| Property | Type | Description |
| ------ | ------ | ------ |
| <a id="candidate"></a> `candidate` | [`IResourceCandidate`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-res/docs) | The candidate that was evaluated |
| <a id="candidateindex"></a> `candidateIndex` | `number` | Index of this candidate within the resource |
| <a id="conditionevaluations"></a> `conditionEvaluations?` | [`IConditionEvaluationResult`](IConditionEvaluationResult.md)[] | Detailed evaluation results for each condition |
| <a id="conditionsetkey"></a> `conditionSetKey` | `string` \| `null` | Key identifying the condition set used for evaluation |
| <a id="isdefaultmatch"></a> `isDefaultMatch` | `boolean` | Whether this was a default match (fallback when no exact match) |
| <a id="matched"></a> `matched` | `boolean` | Whether this candidate matched the resolution context |
| <a id="matchtype"></a> `matchType` | `"match"` \| `"matchAsDefault"` \| `"noMatch"` | Type of match that occurred |
