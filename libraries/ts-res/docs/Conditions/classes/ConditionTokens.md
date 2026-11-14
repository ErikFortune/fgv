[Home](../../README.md) > [Conditions](../README.md) > ConditionTokens

# Class: ConditionTokens

Helper class to parse and validate condition tokens.

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

Constructs a new Conditions.ConditionTokens | ConditionTokens instance.

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

[qualifiers](./ConditionTokens.qualifiers.md)

</td><td>

`readonly`

</td><td>

[IReadOnlyQualifierCollector](../../interfaces/IReadOnlyQualifierCollector.md)

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

[parseConditionToken(token, qualifiers)](./ConditionTokens.parseConditionToken.md)

</td><td>

`static`

</td><td>

Parses a ConditionToken | condition token and validates it against the qualifiers

</td></tr>
<tr><td>

[parseConditionSetToken(token, qualifiers)](./ConditionTokens.parseConditionSetToken.md)

</td><td>

`static`

</td><td>

Parses a ConditionSetToken | condition set token and validates it against the qualifiers

</td></tr>
<tr><td>

[validateConditionTokenParts(parts, qualifiers)](./ConditionTokens.validateConditionTokenParts.md)

</td><td>

`static`

</td><td>

Validates the parts of a condition token against the qualifiers present in the supplied

</td></tr>
<tr><td>

[findQualifierForValue(value, qualifiers)](./ConditionTokens.findQualifierForValue.md)

</td><td>

`static`

</td><td>

Given a value and a set of qualifiers, finds a single token-optional qualifier that matches the value.

</td></tr>
<tr><td>

[parseConditionToken(token)](./ConditionTokens.parseConditionToken.md)

</td><td>



</td><td>

i

</td></tr>
<tr><td>

[parseConditionSetToken(token)](./ConditionTokens.parseConditionSetToken.md)

</td><td>



</td><td>

Parses a ConditionSetToken | condition set token string and validates the parts

</td></tr>
<tr><td>

[validateConditionTokenParts(parts)](./ConditionTokens.validateConditionTokenParts.md)

</td><td>



</td><td>

Validates the Helpers.IConditionTokenParts | parts of a ConditionToken | condition token.

</td></tr>
<tr><td>

[findQualifierForValue(value)](./ConditionTokens.findQualifierForValue.md)

</td><td>



</td><td>

Given a value, finds a single token-optional qualifier that matches the value.

</td></tr>
</tbody></table>
