[Home](../../README.md) > [Runtime](../README.md) > ISimpleContextQualifierProviderCreateParams

# Interface: ISimpleContextQualifierProviderCreateParams

Parameters for creating a Runtime.SimpleContextQualifierProvider | SimpleContextQualifierProvider.

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

[qualifiers](./ISimpleContextQualifierProviderCreateParams.qualifiers.md)

</td><td>



</td><td>

[IReadOnlyQualifierCollector](../../interfaces/IReadOnlyQualifierCollector.md)

</td><td>

The Qualifiers.IReadOnlyQualifierCollector | readonly qualifier collector that defines and validates qualifiers.

</td></tr>
<tr><td>

[qualifierValues](./ISimpleContextQualifierProviderCreateParams.qualifierValues.md)

</td><td>



</td><td>

Record&lt;string, [QualifierContextValue](../../type-aliases/QualifierContextValue.md)&gt;

</td><td>

Optional record of initial qualifier name-value pairs to populate the provider.

</td></tr>
</tbody></table>
