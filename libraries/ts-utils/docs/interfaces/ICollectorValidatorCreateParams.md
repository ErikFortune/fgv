[Home](../README.md) > ICollectorValidatorCreateParams

# Interface: ICollectorValidatorCreateParams

Parameters for constructing a Collections.CollectorValidator | CollectorValidator.

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

[collector](./ICollectorValidatorCreateParams.collector.md)

</td><td>

`readonly`

</td><td>

[Collector](../classes/Collector.md)&lt;TITEM&gt;

</td><td>

The collector to validate access to.

</td></tr>
<tr><td>

[converters](./ICollectorValidatorCreateParams.converters.md)

</td><td>

`readonly`

</td><td>

[KeyValueConverters](../classes/KeyValueConverters.md)&lt;[CollectibleKey](../type-aliases/CollectibleKey.md)&lt;TITEM&gt;, TITEM&gt;

</td><td>

The key-value converters for validation.

</td></tr>
</tbody></table>
