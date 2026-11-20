[Home](../README.md) > Resources

# Namespace: Resources

## Classes

<table><thead><tr><th>

Name

</th><th>

Description

</th></tr></thead>
<tbody>
<tr><td>

[CandidateReducer](./classes/CandidateReducer.md)

</td><td>

Manages candidate reduction logic for filtering and qualifier reduction operations.

</td></tr>
<tr><td>

[CandidateValue](./classes/CandidateValue.md)

</td><td>

Implementation of a candidate value that stores normalized JSON data.

</td></tr>
<tr><td>

[CandidateValueCollector](./classes/CandidateValueCollector.md)

</td><td>

A `ValidatingCollector` for Resources.CandidateValue | CandidateValues,

</td></tr>
<tr><td>

[DeltaGenerator](./classes/DeltaGenerator.md)

</td><td>

Class for generating resource deltas between baseline and delta resolvers.

</td></tr>
<tr><td>

[ResourceBuilder](./classes/ResourceBuilder.md)

</td><td>

Represents a builder for a single logical Resources.Resource | resource.

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

[ICandidateInfo](./interfaces/ICandidateInfo.md)

</td><td>

Information about a candidate being processed by the reducer.

</td></tr>
<tr><td>

[IReducedCandidate](./interfaces/IReducedCandidate.md)

</td><td>

Represents a reduced candidate after applying reduction logic.

</td></tr>
<tr><td>

[ICandidateValue](./interfaces/ICandidateValue.md)

</td><td>

Interface for a candidate value that can be collected and indexed.

</td></tr>
<tr><td>

[ICandidateValueCreateParams](./interfaces/ICandidateValueCreateParams.md)

</td><td>

Parameters for creating a Resources.CandidateValue | CandidateValue.

</td></tr>
<tr><td>

[ICandidateValueCollectorCreateParams](./interfaces/ICandidateValueCollectorCreateParams.md)

</td><td>

Parameters for creating a Resources.CandidateValueCollector.

</td></tr>
<tr><td>

[IDeltaGeneratorParams](./interfaces/IDeltaGeneratorParams.md)

</td><td>

Interface for parameters to create a Resources.DeltaGenerator | DeltaGenerator.

</td></tr>
<tr><td>

[IDeltaGeneratorOptions](./interfaces/IDeltaGeneratorOptions.md)

</td><td>

Interface for options controlling delta generation behavior.

</td></tr>
<tr><td>

[IResourceCandidateCreateParams](./interfaces/IResourceCandidateCreateParams.md)

</td><td>

Parameters to create a Resources.ResourceCandidate | ResourceCandidate.

</td></tr>
<tr><td>

[ICandidateDeclOptions](./interfaces/ICandidateDeclOptions.md)

</td><td>

Options for creating a Resources.ResourceCandidate | ResourceCandidate declaration.

</td></tr>
<tr><td>

[IResourceCreateParams](./interfaces/IResourceCreateParams.md)

</td><td>

Parameters used to create a Resources.Resource | Resource object.

</td></tr>
<tr><td>

[IResourceBuilderCreateParams](./interfaces/IResourceBuilderCreateParams.md)

</td><td>

Parameters for creating a Resources.ResourceBuilder.

</td></tr>
<tr><td>

[IResourceManagerBuilderCreateParams](./interfaces/IResourceManagerBuilderCreateParams.md)

</td><td>

Interface for parameters to the Resources.ResourceManagerBuilder.create | ResourceManagerBuilder create method.

</td></tr>
<tr><td>

[IResourceDeclarationOptions](./interfaces/IResourceDeclarationOptions.md)

</td><td>

Options for resource declaration operations with strongly-typed context filtering.

</td></tr>
<tr><td>

[ICompiledResourceOptionsWithFilter](./interfaces/ICompiledResourceOptionsWithFilter.md)

</td><td>

Extended compiled resource options that includes context filtering capabilities.

</td></tr>
<tr><td>

[IResourceManagerCloneOptions](./interfaces/IResourceManagerCloneOptions.md)

</td><td>

Options for ResourceManagerBuilder clone operations.

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

[CandidateAction](./type-aliases/CandidateAction.md)

</td><td>

Action taken on a candidate during reduction processing.

</td></tr>
<tr><td>

[ResourceBuilderResultDetail](./type-aliases/ResourceBuilderResultDetail.md)

</td><td>

Possible result details returned by the resource builder

</td></tr>
<tr><td>

[ResourceManagerBuilderResultDetail](./type-aliases/ResourceManagerBuilderResultDetail.md)

</td><td>

Error details that can be returned by a Resources.ResourceManagerBuilder | ResourceManagerBuilder.

</td></tr>
</tbody></table>
