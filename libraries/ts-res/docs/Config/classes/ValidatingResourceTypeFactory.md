[Home](../../README.md) > [Config](../README.md) > ValidatingResourceTypeFactory

# Class: ValidatingResourceTypeFactory

A factory that validates and creates ResourceTypes.ResourceType | ResourceType instances
from weakly-typed configuration objects. This factory accepts configurations with unvalidated
string properties and validates them before delegating to the underlying factory chain.

This pattern is useful at package boundaries where type identity issues may occur with
branded types across different package instances.

**Implements:** [`IConfigInitFactory<unknown, ResourceType>`](../../interfaces/IConfigInitFactory.md)

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

Constructor for a validating resource type factory.

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

[create(config)](./ValidatingResourceTypeFactory.create.md)

</td><td>



</td><td>

Creates a resource type from a weakly-typed configuration object.

</td></tr>
</tbody></table>
