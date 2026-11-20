[Home](../README.md) > IResolutionResult

# Interface: IResolutionResult

Result of attempting to resolve a specific resource with a given context.
Contains the resolved value, matching candidates, and diagnostic information.

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

[success](./IResolutionResult.success.md)

</td><td>



</td><td>

boolean

</td><td>

Whether the resolution was successful

</td></tr>
<tr><td>

[resourceId](./IResolutionResult.resourceId.md)

</td><td>



</td><td>

string

</td><td>

ID of the resource that was resolved

</td></tr>
<tr><td>

[resource](./IResolutionResult.resource.md)

</td><td>



</td><td>

IResource

</td><td>

The resolved resource object, if successful

</td></tr>
<tr><td>

[bestCandidate](./IResolutionResult.bestCandidate.md)

</td><td>



</td><td>

IResourceCandidate

</td><td>

The best matching candidate for this context

</td></tr>
<tr><td>

[allCandidates](./IResolutionResult.allCandidates.md)

</td><td>



</td><td>

readonly IResourceCandidate[]

</td><td>

All candidates that were considered during resolution

</td></tr>
<tr><td>

[candidateDetails](./IResolutionResult.candidateDetails.md)

</td><td>



</td><td>

[ICandidateInfo](ICandidateInfo.md)[]

</td><td>

Detailed information about each candidate's matching process

</td></tr>
<tr><td>

[composedValue](./IResolutionResult.composedValue.md)

</td><td>



</td><td>

TV

</td><td>

The final composed/resolved value

</td></tr>
<tr><td>

[error](./IResolutionResult.error.md)

</td><td>



</td><td>

string

</td><td>

Error message if resolution failed

</td></tr>
</tbody></table>
