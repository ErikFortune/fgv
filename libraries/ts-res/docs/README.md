# @fgv/ts-res

## Namespaces

<table><thead><tr><th>

Name

</th><th>

Description

</th></tr></thead>
<tbody>
<tr><td>

[Bundle](./Bundle/README.md)

</td><td>

Bundle packlet providing functionality for creating and loading resource bundles.

</td></tr>
<tr><td>

[Conditions](./Conditions/README.md)

</td><td>



</td></tr>
<tr><td>

[Config](./Config/README.md)

</td><td>



</td></tr>
<tr><td>

[Context](./Context/README.md)

</td><td>



</td></tr>
<tr><td>

[Decisions](./Decisions/README.md)

</td><td>



</td></tr>
<tr><td>

[Import](./Import/README.md)

</td><td>



</td></tr>
<tr><td>

[QualifierTypes](./QualifierTypes/README.md)

</td><td>



</td></tr>
<tr><td>

[Qualifiers](./Qualifiers/README.md)

</td><td>



</td></tr>
<tr><td>

[ResourceJson](./ResourceJson/README.md)

</td><td>



</td></tr>
<tr><td>

[ResourceTypes](./ResourceTypes/README.md)

</td><td>



</td></tr>
<tr><td>

[Resources](./Resources/README.md)

</td><td>



</td></tr>
<tr><td>

[Runtime](./Runtime/README.md)

</td><td>



</td></tr>
<tr><td>

[ZipArchive](./ZipArchive/README.md)

</td><td>

ZIP archive functionality for ts-res source file archives

</td></tr>
<tr><td>

[Convert](./Convert/README.md)

</td><td>



</td></tr>
<tr><td>

[Helpers](./Helpers/README.md)

</td><td>



</td></tr>
<tr><td>

[Validate](./Validate/README.md)

</td><td>



</td></tr>
</tbody></table>

## Classes

<table><thead><tr><th>

Name

</th><th>

Description

</th></tr></thead>
<tbody>
<tr><td>

[BundleBuilder](./classes/BundleBuilder.md)

</td><td>

Builder for creating resource bundles from a ResourceManagerBuilder.

</td></tr>
<tr><td>

[BundleLoader](./classes/BundleLoader.md)

</td><td>

Loader for creating an IResourceManager from a resource bundle.

</td></tr>
<tr><td>

[Condition](./classes/Condition.md)

</td><td>

Represents a single condition applied to some resource instance.

</td></tr>
<tr><td>

[Decision](./classes/Decision.md)

</td><td>

Simple collectible implementation of Decisions.IDecision | IDecision.

</td></tr>
<tr><td>

[Qualifier](./classes/Qualifier.md)

</td><td>

Represents a qualifier that can be used to identify the context in

</td></tr>
<tr><td>

[QualifierType](./classes/QualifierType.md)

</td><td>

Abstract base class for qualifier types.

</td></tr>
<tr><td>

[Resource](./classes/Resource.md)

</td><td>

Represents a single logical resource, with a unique id and a set of possible

</td></tr>
<tr><td>

[ResourceCandidate](./classes/ResourceCandidate.md)

</td><td>

A Resources.ResourceCandidate | resource candidate represents a single possible

</td></tr>
<tr><td>

[ResourceResolver](./classes/ResourceResolver.md)

</td><td>

High-performance runtime resource resolver with O(1) condition caching.

</td></tr>
<tr><td>

[ResourceManagerBuilder](./classes/ResourceManagerBuilder.md)

</td><td>

Builder for a collection of Resources.Resource | resources.

</td></tr>
<tr><td>

[ResourceType](./classes/ResourceType.md)

</td><td>

Abstract base class for resource types which are responsible for

</td></tr>
</tbody></table>

## Interfaces

<table><thead><tr><th>

Name

</th><th>

Description

</th></tr></thead>
<tbody>
<tr><td>

[IResourceResolver](./interfaces/IResourceResolver.md)

</td><td>

Minimal resource resolver

</td></tr>
<tr><td>

[IResourceManager](./interfaces/IResourceManager.md)

</td><td>

Interface defining the read-only properties that the runtime resource resolver needs
from a resource manager.

</td></tr>
</tbody></table>

## Type Aliases

<table><thead><tr><th>

Name

</th><th>

Description

</th></tr></thead>
<tbody>
<tr><td>

[QualifierName](./type-aliases/QualifierName.md)

</td><td>

Branded string representing a validated qualifier name.

</td></tr>
<tr><td>

[QualifierIndex](./type-aliases/QualifierIndex.md)

</td><td>

Branded number representing a validated qualifier index.

</td></tr>
<tr><td>

[QualifierTypeName](./type-aliases/QualifierTypeName.md)

</td><td>

Branded string representing a validated qualifier type name.

</td></tr>
<tr><td>

[QualifierTypeIndex](./type-aliases/QualifierTypeIndex.md)

</td><td>

Branded number representing a validated qualifier type index.

</td></tr>
<tr><td>

[QualifierConditionValue](./type-aliases/QualifierConditionValue.md)

</td><td>

Branded type for a validated qualifier condition value - i.e.

</td></tr>
<tr><td>

[QualifierContextValue](./type-aliases/QualifierContextValue.md)

</td><td>

Branded type for a validated qualifier context value - i.e.

</td></tr>
<tr><td>

[QualifierMatchScore](./type-aliases/QualifierMatchScore.md)

</td><td>

Branded number representing a score in the range 0.0 (no match) ..

</td></tr>
<tr><td>

[ConditionPriority](./type-aliases/ConditionPriority.md)

</td><td>

Branded number representing a validated condition priority.

</td></tr>
<tr><td>

[ConditionOperator](./type-aliases/ConditionOperator.md)

</td><td>

Condition operators for use in conditions.

</td></tr>
<tr><td>

[ConditionIndex](./type-aliases/ConditionIndex.md)

</td><td>

Branded number representing a validated condition index.

</td></tr>
<tr><td>

[ConditionKey](./type-aliases/ConditionKey.md)

</td><td>

A branded string representing a validated condition key.

</td></tr>
<tr><td>

[ConditionToken](./type-aliases/ConditionToken.md)

</td><td>

A string representing a validated condition token.

</td></tr>
<tr><td>

[ConditionSetIndex](./type-aliases/ConditionSetIndex.md)

</td><td>

Branded number representing a validated condition set index.

</td></tr>
<tr><td>

[ConditionSetKey](./type-aliases/ConditionSetKey.md)

</td><td>

Branded string representing a validated condition set key.

</td></tr>
<tr><td>

[ConditionSetToken](./type-aliases/ConditionSetToken.md)

</td><td>

A string representing a validated condition set token.

</td></tr>
<tr><td>

[ConditionSetHash](./type-aliases/ConditionSetHash.md)

</td><td>

Branded string representing a hash value for a condition set.

</td></tr>
<tr><td>

[DecisionKey](./type-aliases/DecisionKey.md)

</td><td>

Branded string representing a validated decision key.

</td></tr>
<tr><td>

[DecisionIndex](./type-aliases/DecisionIndex.md)

</td><td>

Branded number representing a validated decision index.

</td></tr>
<tr><td>

[ContextQualifierToken](./type-aliases/ContextQualifierToken.md)

</td><td>

A string representing a validated context qualifier token.

</td></tr>
<tr><td>

[ContextToken](./type-aliases/ContextToken.md)

</td><td>

A string representing a validated context token.

</td></tr>
<tr><td>

[QualifierDefaultValueToken](./type-aliases/QualifierDefaultValueToken.md)

</td><td>

A string representing a single qualifier default value assignment.

</td></tr>
<tr><td>

[QualifierDefaultValuesToken](./type-aliases/QualifierDefaultValuesToken.md)

</td><td>

A string representing a validated qualifier default values token.

</td></tr>
<tr><td>

[ResourceId](./type-aliases/ResourceId.md)

</td><td>

Branded string representing a validated resource id.

</td></tr>
<tr><td>

[ResourceName](./type-aliases/ResourceName.md)

</td><td>

Branded string representing a validated resource name.

</td></tr>
<tr><td>

[ResourceIndex](./type-aliases/ResourceIndex.md)

</td><td>

Branded number representing a validated resource index.

</td></tr>
<tr><td>

[ResourceTypeName](./type-aliases/ResourceTypeName.md)

</td><td>

Branded string representing a validated resource type name.

</td></tr>
<tr><td>

[ResourceTypeIndex](./type-aliases/ResourceTypeIndex.md)

</td><td>

Branded number representing a validated resource type index.

</td></tr>
<tr><td>

[ResourceValueMergeMethod](./type-aliases/ResourceValueMergeMethod.md)

</td><td>

Type representing the possible ways that a resource value can be merged into an existing resource.

</td></tr>
<tr><td>

[CandidateCompleteness](./type-aliases/CandidateCompleteness.md)

</td><td>

The completeness of a resource candidate value.

</td></tr>
<tr><td>

[CandidateValueIndex](./type-aliases/CandidateValueIndex.md)

</td><td>

Branded number representing a validated candidate value index.

</td></tr>
<tr><td>

[CandidateValueKey](./type-aliases/CandidateValueKey.md)

</td><td>

Branded string representing a validated candidate value key.

</td></tr>
</tbody></table>

## Variables

<table><thead><tr><th>

Name

</th><th>

Description

</th></tr></thead>
<tbody>
<tr><td>

[NoMatch](./variables/NoMatch.md)

</td><td>

QualifierMatchScore | Match score indicating no match.

</td></tr>
<tr><td>

[PerfectMatch](./variables/PerfectMatch.md)

</td><td>

QualifierMatchScore | Match score indicating a perfect match.

</td></tr>
<tr><td>

[MinConditionPriority](./variables/MinConditionPriority.md)

</td><td>

Minimum valid priority for a condition.

</td></tr>
<tr><td>

[MaxConditionPriority](./variables/MaxConditionPriority.md)

</td><td>

Maximum valid priority for a condition.

</td></tr>
<tr><td>

[allConditionOperators](./variables/allConditionOperators.md)

</td><td>

Array of all valid condition operators.

</td></tr>
<tr><td>

[allResourceValueMergeMethods](./variables/allResourceValueMergeMethods.md)

</td><td>

Array of all possible ResourceValueMergeMethod | resource merge type values.

</td></tr>
</tbody></table>
