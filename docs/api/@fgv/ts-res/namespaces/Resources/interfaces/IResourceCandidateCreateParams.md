[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-res](../../../README.md) / [Resources](../README.md) / IResourceCandidateCreateParams

# Interface: IResourceCandidateCreateParams

Parameters to create a [ResourceCandidate](../../../classes/ResourceCandidate.md).

## Properties

| Property | Type |
| ------ | ------ |
| <a id="candidatevalues"></a> `candidateValues` | [`CandidateValueCollector`](../classes/CandidateValueCollector.md) |
| <a id="conditionsets"></a> `conditionSets` | [`ConditionSetCollector`](../../Conditions/classes/ConditionSetCollector.md) |
| <a id="decl"></a> `decl` | [`IChildResourceCandidateDecl`](../../ResourceJson/namespaces/Json/interfaces/IChildResourceCandidateDecl.md) |
| <a id="id"></a> `id` | `string` |
| <a id="parentconditions"></a> `parentConditions?` | readonly [`Condition`](../../../classes/Condition.md)[] |
| <a id="resourcetype"></a> `resourceType?` | [`ResourceType`](../../../classes/ResourceType.md)\<`unknown`\> |
