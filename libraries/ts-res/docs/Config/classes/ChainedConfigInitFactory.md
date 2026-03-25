[Home](../../README.md) > [Config](../README.md) > ChainedConfigInitFactory

# Class: ChainedConfigInitFactory

A factory that chains multiple factories together.

**Implements:** [`IConfigInitFactory<TConfig, T>`](../../interfaces/IConfigInitFactory.md)

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

Constructor for a chained config init factory.

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

[IConfigInitFactory](../../interfaces/IConfigInitFactory.md)&lt;TConfig, T&gt;[]

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
