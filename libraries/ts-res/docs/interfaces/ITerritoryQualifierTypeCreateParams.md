[Home](../README.md) > ITerritoryQualifierTypeCreateParams

# Interface: ITerritoryQualifierTypeCreateParams

Parameters used to create a new QualifierTypes.TerritoryQualifierType | TerritoryQualifierType instance.

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

[name](./ITerritoryQualifierTypeCreateParams.name.md)

</td><td>



</td><td>

string

</td><td>

QualifierTypes.IQualifierTypeCreateParams.name

</td></tr>
<tr><td>

[allowContextList](./ITerritoryQualifierTypeCreateParams.allowContextList.md)

</td><td>



</td><td>

boolean

</td><td>

QualifierTypes.IQualifierTypeCreateParams.allowContextList

</td></tr>
<tr><td>

[index](./ITerritoryQualifierTypeCreateParams.index.md)

</td><td>



</td><td>

number

</td><td>

QualifierTypes.IQualifierTypeCreateParams.index

</td></tr>
<tr><td>

[allowedTerritories](./ITerritoryQualifierTypeCreateParams.allowedTerritories.md)

</td><td>



</td><td>

string[]

</td><td>

Optional array enumerating allowed territories to further constrain the type.

</td></tr>
<tr><td>

[acceptLowercase](./ITerritoryQualifierTypeCreateParams.acceptLowercase.md)

</td><td>



</td><td>

boolean

</td><td>

Flag indicating whether the qualifier type should accept lowercase territory codes.

</td></tr>
<tr><td>

[hierarchy](./ITerritoryQualifierTypeCreateParams.hierarchy.md)

</td><td>



</td><td>

[LiteralValueHierarchyDecl](../type-aliases/LiteralValueHierarchyDecl.md)&lt;string&gt;

</td><td>

Optional QualifierTypes.Config.LiteralValueHierarchyDecl | hierarchy declaration
of territory values to use for matching.

</td></tr>
</tbody></table>
