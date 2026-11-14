[Home](../../README.md) > [Resources](../README.md) > IResourceCreateParams

# Interface: IResourceCreateParams

Parameters used to create a Resources.Resource | Resource object.

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

[id](./IResourceCreateParams.id.md)

</td><td>



</td><td>

string

</td><td>

The id of the resource.

</td></tr>
<tr><td>

[resourceType](./IResourceCreateParams.resourceType.md)

</td><td>



</td><td>

[ResourceType](../../classes/ResourceType.md)&lt;unknown&gt;

</td><td>

Optional ResourceTypes.ResourceType | type of the resource.

</td></tr>
<tr><td>

[candidates](./IResourceCreateParams.candidates.md)

</td><td>



</td><td>

readonly [ResourceCandidate](../../classes/ResourceCandidate.md)[]

</td><td>

Array of Resources.ResourceCandidate | candidates for the resource.

</td></tr>
<tr><td>

[decisions](./IResourceCreateParams.decisions.md)

</td><td>



</td><td>

[AbstractDecisionCollector](../../classes/AbstractDecisionCollector.md)

</td><td>

Decisions.AbstractDecisionCollector | AbstractDecisionCollector used to create the optimized decision.

</td></tr>
</tbody></table>
