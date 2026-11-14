[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-res](../../../README.md) / [Resources](../README.md) / IResourceCandidateCreateParams

# Interface: IResourceCandidateCreateParams

Parameters to create a [ResourceCandidate](../../../classes/ResourceCandidate.md).

## Properties

| Property | Type |
| ------ | ------ |
| <a id="property-candidatevalues"></a> `candidateValues` | [`CandidateValueCollector`](../classes/CandidateValueCollector.md) |
| <a id="property-conditionsets"></a> `conditionSets` | [`ConditionSetCollector`](../../Conditions/classes/ConditionSetCollector.md) |
| <a id="property-decl"></a> `decl` | [`IChildResourceCandidateDecl`](../../ResourceJson/namespaces/Json/interfaces/IChildResourceCandidateDecl.md) |
| <a id="property-id"></a> `id` | `string` |
| <a id="property-parentconditions"></a> `parentConditions?` | readonly [`Condition`](../../../classes/Condition.md)[] |
| <a id="property-resourcetype"></a> `resourceType?` | [`ResourceType`](../../../classes/ResourceType.md)\<`unknown`\> |
