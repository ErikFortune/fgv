[Home](../README.md) > QualifierDefaultValueTokens

# Class: QualifierDefaultValueTokens

Helper class to parse and validate qualifier default value tokens.

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

`constructor(qualifiers)`

</td><td>



</td><td>

Constructs a new Qualifiers.QualifierDefaultValueTokens | QualifierDefaultValueTokens instance.

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

[qualifiers](./QualifierDefaultValueTokens.qualifiers.md)

</td><td>

`readonly`

</td><td>

[IReadOnlyQualifierCollector](../interfaces/IReadOnlyQualifierCollector.md)

</td><td>

The Qualifiers.IReadOnlyQualifierCollector | qualifier collector used to validate

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

[parseQualifierDefaultValueToken(token, qualifiers)](./QualifierDefaultValueTokens.parseQualifierDefaultValueToken.md)

</td><td>

`static`

</td><td>

Parses a QualifierDefaultValueToken | qualifier default value token and validates it against the qualifiers

</td></tr>
<tr><td>

[parseQualifierDefaultValuesToken(token, qualifiers)](./QualifierDefaultValueTokens.parseQualifierDefaultValuesToken.md)

</td><td>

`static`

</td><td>

Parses a QualifierDefaultValuesToken | qualifier default values token and validates it against the qualifiers

</td></tr>
<tr><td>

[validateQualifierDefaultValueTokenParts(parts, qualifiers)](./QualifierDefaultValueTokens.validateQualifierDefaultValueTokenParts.md)

</td><td>

`static`

</td><td>

Validates the parts of a qualifier default value token against the qualifiers present in the supplied

</td></tr>
<tr><td>

[qualifierDefaultValuesTokenToDecl(token, qualifiers)](./QualifierDefaultValueTokens.qualifierDefaultValuesTokenToDecl.md)

</td><td>

`static`

</td><td>

Converts a QualifierDefaultValuesToken | qualifier default values token to a validated qualifier default values declaration.

</td></tr>
<tr><td>

[declToQualifierDefaultValuesToken(decl)](./QualifierDefaultValueTokens.declToQualifierDefaultValuesToken.md)

</td><td>

`static`

</td><td>

Converts a validated qualifier default values declaration to a QualifierDefaultValuesToken | qualifier default values token.

</td></tr>
<tr><td>

[parseQualifierDefaultValueToken(token)](./QualifierDefaultValueTokens.parseQualifierDefaultValueToken.md)

</td><td>



</td><td>

Parses a QualifierDefaultValueToken | qualifier default value token string and validates the parts

</td></tr>
<tr><td>

[parseQualifierDefaultValuesToken(token)](./QualifierDefaultValueTokens.parseQualifierDefaultValuesToken.md)

</td><td>



</td><td>

Parses a QualifierDefaultValuesToken | qualifier default values token string and validates the parts

</td></tr>
<tr><td>

[validateQualifierDefaultValueTokenParts(parts)](./QualifierDefaultValueTokens.validateQualifierDefaultValueTokenParts.md)

</td><td>



</td><td>

Validates the Helpers.IQualifierDefaultValueTokenParts | parts of a QualifierDefaultValueToken | qualifier default value token.

</td></tr>
<tr><td>

[qualifierDefaultValuesTokenToDecl(token)](./QualifierDefaultValueTokens.qualifierDefaultValuesTokenToDecl.md)

</td><td>



</td><td>

Converts a QualifierDefaultValuesToken | qualifier default values token to a validated qualifier default values declaration.

</td></tr>
<tr><td>

[declToQualifierDefaultValuesToken(decl)](./QualifierDefaultValueTokens.declToQualifierDefaultValuesToken.md)

</td><td>



</td><td>

Converts a validated qualifier default values declaration to a QualifierDefaultValuesToken | qualifier default values token.

</td></tr>
</tbody></table>
