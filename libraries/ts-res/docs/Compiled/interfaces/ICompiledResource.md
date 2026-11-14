[Home](../../README.md) > [Compiled](../README.md) > ICompiledResource

# Interface: ICompiledResource

Represents a compiled resource with an identifier and associated candidates.

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

[id](./ICompiledResource.id.md)

</td><td>



</td><td>

[ResourceId](../../type-aliases/ResourceId.md)

</td><td>

The unique identifier of the resource.

</td></tr>
<tr><td>

[type](./ICompiledResource.type.md)

</td><td>



</td><td>

[ResourceTypeIndex](../../type-aliases/ResourceTypeIndex.md)

</td><td>

Index reference to the resource type of this resource.

</td></tr>
<tr><td>

[decision](./ICompiledResource.decision.md)

</td><td>



</td><td>

[DecisionIndex](../../type-aliases/DecisionIndex.md)

</td><td>

Index reference to the decision that determines when this resource applies.

</td></tr>
<tr><td>

[candidates](./ICompiledResource.candidates.md)

</td><td>



</td><td>

readonly [ICompiledCandidate](../../interfaces/ICompiledCandidate.md)[]

</td><td>

Array of candidate values for this resource.

</td></tr>
</tbody></table>
