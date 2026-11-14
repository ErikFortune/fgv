[Home](../README.md) > QualifierTypeFactory

# Class: QualifierTypeFactory

A factory that creates QualifierTypes.QualifierType | QualifierType instances from configuration,
supporting both built-in system types and custom external types.

This factory allows external consumers to extend the qualifier type system with their own custom types
while maintaining support for all built-in types (Language, Territory, Literal).

**Extends:** [`ChainedConfigInitFactory<IAnyQualifierTypeConfig, T | SystemQualifierType>`](ChainedConfigInitFactory.md)

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

Constructor for a Config.QualifierTypeFactory | qualifier type factory.

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

[IConfigInitFactory](../interfaces/IConfigInitFactory.md)&lt;[IAnyQualifierTypeConfig](../type-aliases/IAnyQualifierTypeConfig.md), [SystemQualifierType](../type-aliases/SystemQualifierType.md) | T&gt;[]

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
