[Home](../README.md) > IQualifierCollectorCreateParams

# Interface: IQualifierCollectorCreateParams

Parameters for creating a new Qualifiers.QualifierCollector.

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

[qualifierTypes](./IQualifierCollectorCreateParams.qualifierTypes.md)

</td><td>



</td><td>

[ReadOnlyQualifierTypeCollector](../type-aliases/ReadOnlyQualifierTypeCollector.md)

</td><td>

The QualifierTypes.QualifierTypeCollector | qualifier types used to
create Qualifiers.Qualifier | qualifiers from Qualifiers.IQualifierDecl | declarations.

</td></tr>
<tr><td>

[qualifiers](./IQualifierCollectorCreateParams.qualifiers.md)

</td><td>



</td><td>

readonly (string | [IQualifierDecl](IQualifierDecl.md))[]

</td><td>

Optional list of Qualifiers.IQualifierDecl | declarations or bare

</td></tr>
</tbody></table>
