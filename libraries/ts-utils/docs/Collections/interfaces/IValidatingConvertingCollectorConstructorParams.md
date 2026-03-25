[Home](../../README.md) > [Collections](../README.md) > IValidatingConvertingCollectorConstructorParams

# Interface: IValidatingConvertingCollectorConstructorParams

Parameters for constructing a Collections.ValidatingConvertingCollector | ValidatingConvertingCollector.

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

[factory](./IValidatingConvertingCollectorConstructorParams.factory.md)

</td><td>



</td><td>

[CollectibleFactory](../../type-aliases/CollectibleFactory.md)&lt;TITEM, TSRC&gt;

</td><td>

The default Collections.CollectibleFactory | factory to create items.

</td></tr>
<tr><td>

[converters](./IValidatingConvertingCollectorConstructorParams.converters.md)

</td><td>



</td><td>

[KeyValueConverters](../../classes/KeyValueConverters.md)&lt;[CollectibleKey](../../type-aliases/CollectibleKey.md)&lt;TITEM&gt;, TSRC&gt;

</td><td>

The key-value converters for validation.

</td></tr>
<tr><td>

[entries](./IValidatingConvertingCollectorConstructorParams.entries.md)

</td><td>



</td><td>

[KeyValueEntry](../../type-aliases/KeyValueEntry.md)&lt;[CollectibleKey](../../type-aliases/CollectibleKey.md)&lt;TITEM&gt;, TSRC&gt;[]

</td><td>

An optional array of entries to add to the collector.

</td></tr>
</tbody></table>
