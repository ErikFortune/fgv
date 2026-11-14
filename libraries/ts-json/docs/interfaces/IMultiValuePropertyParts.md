[Home](../README.md) > IMultiValuePropertyParts

# Interface: IMultiValuePropertyParts

Represents the parts of a multi-value property key.

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

[token](./IMultiValuePropertyParts.token.md)

</td><td>

`readonly`

</td><td>

string

</td><td>

The original matched token.

</td></tr>
<tr><td>

[propertyVariable](./IMultiValuePropertyParts.propertyVariable.md)

</td><td>

`readonly`

</td><td>

string

</td><td>

The name of the variable used to project each possible

</td></tr>
<tr><td>

[propertyValues](./IMultiValuePropertyParts.propertyValues.md)

</td><td>

`readonly`

</td><td>

string[]

</td><td>

The set of property values to be expanded.

</td></tr>
<tr><td>

[asArray](./IMultiValuePropertyParts.asArray.md)

</td><td>

`readonly`

</td><td>

boolean

</td><td>

If `true`, the resolved values are added as an array
with the name of the EditorRules.IMultiValuePropertyParts.propertyVariable | propertyVariable.

</td></tr>
</tbody></table>
