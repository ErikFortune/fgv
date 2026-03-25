[Home](../README.md) > ICompiledResourceCollectionCreateParams

# Interface: ICompiledResourceCollectionCreateParams

Interface for parameters to create a Runtime.CompiledResourceCollection | CompiledResourceCollection.

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

[compiledCollection](./ICompiledResourceCollectionCreateParams.compiledCollection.md)

</td><td>



</td><td>

[ICompiledResourceCollection](ICompiledResourceCollection.md)

</td><td>

The compiled resource collection data.

</td></tr>
<tr><td>

[qualifierTypes](./ICompiledResourceCollectionCreateParams.qualifierTypes.md)

</td><td>



</td><td>

IReadOnlyResultMap&lt;string, [QualifierType](../classes/QualifierType.md)&lt;JsonObject&gt;&gt;

</td><td>

Map of qualifier type names to qualifier type objects.

</td></tr>
<tr><td>

[resourceTypes](./ICompiledResourceCollectionCreateParams.resourceTypes.md)

</td><td>



</td><td>

IReadOnlyResultMap&lt;string, [ResourceType](../classes/ResourceType.md)&lt;unknown&gt;&gt;

</td><td>

Map of resource type names to resource type objects.

</td></tr>
</tbody></table>
