[Home](../../README.md) > [Config](../README.md) > ISystemConfigurationInitParams

# Interface: ISystemConfigurationInitParams

Parameters used to initialize a Config.SystemConfiguration | SystemConfiguration.

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

[qualifierDefaultValues](./ISystemConfigurationInitParams.qualifierDefaultValues.md)

</td><td>



</td><td>

Record&lt;string, string | null&gt;

</td><td>

Optional map of qualifier names to default values.

</td></tr>
<tr><td>

[qualifierTypeFactory](./ISystemConfigurationInitParams.qualifierTypeFactory.md)

</td><td>



</td><td>

[IConfigInitFactory](../../interfaces/IConfigInitFactory.md)&lt;[IAnyQualifierTypeConfig](../../type-aliases/IAnyQualifierTypeConfig.md), [QualifierType](../../classes/QualifierType.md)&lt;JsonObject&gt;&gt;

</td><td>



</td></tr>
<tr><td>

[resourceTypeFactory](./ISystemConfigurationInitParams.resourceTypeFactory.md)

</td><td>



</td><td>

[IConfigInitFactory](../../interfaces/IConfigInitFactory.md)&lt;[IResourceTypeConfig](../../interfaces/IResourceTypeConfig.md)&lt;JsonObject&gt;, [ResourceType](../../classes/ResourceType.md)&lt;unknown&gt;&gt;

</td><td>



</td></tr>
</tbody></table>
