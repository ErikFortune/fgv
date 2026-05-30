[Home](../README.md) > ResourceCandidate

# Class: ResourceCandidate

A Resources.ResourceCandidate | resource candidate represents a single possible
instance value for some resource, with the conditions under which it applies
and instructions on how to merge it with other instances.

**Implements:** [`IResourceCandidate`](../interfaces/IResourceCandidate.md)

## Properties

<table><thead><tr><th>

Property

</th><th>

Modifiers

</th><th>

Type

</th><th>

Description

</th></tr></thead>
<tbody>
<tr><td>

[id](./ResourceCandidate.id.md)

</td><td>

`readonly`

</td><td>

[ResourceId](../type-aliases/ResourceId.md)

</td><td>

The unique identifier of the resource for which this candidate

</td></tr>
<tr><td>

[candidateValue](./ResourceCandidate.candidateValue.md)

</td><td>

`readonly`

</td><td>

[CandidateValue](CandidateValue.md)

</td><td>

The candidate value that contains the JSON representation of the instance data.

</td></tr>
<tr><td>

[conditions](./ResourceCandidate.conditions.md)

</td><td>

`readonly`

</td><td>

[ConditionSet](ConditionSet.md)

</td><td>

The conditions under which this candidate applies.

</td></tr>
<tr><td>

[isPartial](./ResourceCandidate.isPartial.md)

</td><td>

`readonly`

</td><td>

boolean

</td><td>

True if this candidate is a partial instance.

</td></tr>
<tr><td>

[mergeMethod](./ResourceCandidate.mergeMethod.md)

</td><td>

`readonly`

</td><td>

[ResourceValueMergeMethod](../type-aliases/ResourceValueMergeMethod.md)

</td><td>

The method to use when merging this candidate with other instances.

</td></tr>
<tr><td>

[resourceType](./ResourceCandidate.resourceType.md)

</td><td>

`readonly`

</td><td>

[ResourceType](ResourceType.md)&lt;unknown&gt; | undefined

</td><td>

The ResourceTypes.ResourceType | resource type for the resource to which

</td></tr>
<tr><td>

[json](./ResourceCandidate.json.md)

</td><td>

`readonly`

</td><td>

JsonObject

</td><td>

The JSON representation of the instance data to be applied.

</td></tr>
<tr><td>

[completeness](./ResourceCandidate.completeness.md)

</td><td>

`readonly`

</td><td>

[CandidateCompleteness](../type-aliases/CandidateCompleteness.md)

</td><td>

The completeness of the candidate value.

</td></tr>
</tbody></table>

## Methods

<table><thead><tr><th>

Method

</th><th>

Modifiers

</th><th>

Description

</th></tr></thead>
<tbody>
<tr><td>

[create(params)](./ResourceCandidate.create.md)

</td><td>

`static`

</td><td>

Creates a new Resources.ResourceCandidate | ResourceCandidate object.

</td></tr>
<tr><td>

[validateResourceTypes(candidates, expectedType)](./ResourceCandidate.validateResourceTypes.md)

</td><td>

`static`

</td><td>

Extracts the ResourceTypes.ResourceType | resource type from a list of Resources.ResourceCandidate | resource candidates,

</td></tr>
<tr><td>

[compare(rc1, rc2)](./ResourceCandidate.compare.md)

</td><td>

`static`

</td><td>

Compares two Resources.ResourceCandidate | ResourceCandidates for sorting purposes.

</td></tr>
<tr><td>

[equal(rc1, rc2)](./ResourceCandidate.equal.md)

</td><td>

`static`

</td><td>

Compares two Resources.ResourceCandidate | ResourceCandidates for equality.

</td></tr>
<tr><td>

[findReducibleQualifiers(candidates, filterForContext)](./ResourceCandidate.findReducibleQualifiers.md)

</td><td>

`static`

</td><td>

Finds the qualifiers that are made irrelevant by the supplied filterForContext.

</td></tr>
<tr><td>

[canMatchPartialContext(context, options)](./ResourceCandidate.canMatchPartialContext.md)

</td><td>



</td><td>

Determines if this candidate can match the supplied context (possibly partial).

</td></tr>
<tr><td>

[toChildResourceCandidateDecl(options)](./ResourceCandidate.toChildResourceCandidateDecl.md)

</td><td>



</td><td>

Gets the ResourceJson.Json.IChildResourceCandidateDecl | child resource candidate declaration

</td></tr>
<tr><td>

[toLooseResourceCandidateDecl(options)](./ResourceCandidate.toLooseResourceCandidateDecl.md)

</td><td>



</td><td>

Gets the ResourceJson.Json.ILooseResourceCandidateDecl | loose resource candidate declaration

</td></tr>
</tbody></table>
