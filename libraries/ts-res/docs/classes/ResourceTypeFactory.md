[Home](../README.md) > ResourceTypeFactory

# Class: ResourceTypeFactory

A factory that creates a ResourceTypes.ResourceType | ResourceType from a ResourceTypes.Config.IResourceTypeConfig | resource type configuration
by chaining a supplied factory with a Config.BuiltInResourceTypeFactory | built-in factory that handles built-in resource types.

**Extends:** [`ChainedConfigInitFactory<IResourceTypeConfig, ResourceType>`](ChainedConfigInitFactory.md)

## Constructors

<table><thead><tr><th>

Constructor

</th><th>

Modifiers

</th><th>

Description

</th></tr></thead>
<tbody>
<tr><td>

`constructor(factories)`

</td><td>



</td><td>

Constructor for a resource type factory.

</td></tr>
</tbody></table>

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

[factories](./ChainedConfigInitFactory.factories.md)

</td><td>

`readonly`

</td><td>

[IConfigInitFactory](../interfaces/IConfigInitFactory.md)&lt;[IResourceTypeConfig](../interfaces/IResourceTypeConfig.md)&lt;JsonObject&gt;, [ResourceType](ResourceType.md)&lt;unknown&gt;&gt;[]

</td><td>



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

[create(config)](./ChainedConfigInitFactory.create.md)

</td><td>



</td><td>

Creates a new instance of a configuration object.

</td></tr>
</tbody></table>
