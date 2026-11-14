[Home](../../README.md) > [QualifierTypes](../README.md) > ILiteralQualifierTypeCreateParams

# Interface: ILiteralQualifierTypeCreateParams

Interface defining the parameters that can be used to create a new
QualifierTypes.LiteralQualifierType | LiteralQualifierType.

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

[name](./ILiteralQualifierTypeCreateParams.name.md)

</td><td>



</td><td>

string

</td><td>

Optional name for the qualifier type.

</td></tr>
<tr><td>

[allowContextList](./ILiteralQualifierTypeCreateParams.allowContextList.md)

</td><td>



</td><td>

boolean

</td><td>

Optional flag indicating whether the context can be a list of values.

</td></tr>
<tr><td>

[caseSensitive](./ILiteralQualifierTypeCreateParams.caseSensitive.md)

</td><td>



</td><td>

boolean

</td><td>

Optional flag indicating whether the match should be case-sensitive.

</td></tr>
<tr><td>

[enumeratedValues](./ILiteralQualifierTypeCreateParams.enumeratedValues.md)

</td><td>



</td><td>

readonly string[]

</td><td>

Optional array of enumerated values to further constrain the type.

</td></tr>
<tr><td>

[hierarchy](./ILiteralQualifierTypeCreateParams.hierarchy.md)

</td><td>



</td><td>

[LiteralValueHierarchyDecl](../../type-aliases/LiteralValueHierarchyDecl.md)&lt;string&gt;

</td><td>

Optional QualifierTypes.Config.LiteralValueHierarchyDecl | hierarchy declaration
of literal values to use for matching.

</td></tr>
<tr><td>

[index](./ILiteralQualifierTypeCreateParams.index.md)

</td><td>



</td><td>

number

</td><td>

Global index for this qualifier type.

</td></tr>
</tbody></table>
