[Home](../../README.md) > [Config](../README.md) > ISystemConfiguration

# Interface: ISystemConfiguration

System configuration for both runtime or build.

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

[name](./ISystemConfiguration.name.md)

</td><td>



</td><td>

string

</td><td>

Optional human-readable name for the configuration.

</td></tr>
<tr><td>

[description](./ISystemConfiguration.description.md)

</td><td>



</td><td>

string

</td><td>

Optional description explaining the purpose and use case of the configuration.

</td></tr>
<tr><td>

[qualifierTypes](./ISystemConfiguration.qualifierTypes.md)

</td><td>



</td><td>

[IAnyQualifierTypeConfig](../../type-aliases/IAnyQualifierTypeConfig.md)[]

</td><td>

Qualifier type configurations that define the available qualifier types in the system.

</td></tr>
<tr><td>

[qualifiers](./ISystemConfiguration.qualifiers.md)

</td><td>



</td><td>

[IQualifierDecl](../../interfaces/IQualifierDecl.md)[]

</td><td>

Qualifier declarations that define the available qualifiers in the system.

</td></tr>
<tr><td>

[resourceTypes](./ISystemConfiguration.resourceTypes.md)

</td><td>



</td><td>

[IResourceTypeConfig](../../interfaces/IResourceTypeConfig.md)&lt;JsonObject&gt;[]

</td><td>

Resource type configurations that define the available resource types in the system.

</td></tr>
</tbody></table>
