[Home](../README.md) > ContextTokens

# Class: ContextTokens

Helper class to parse and validate context tokens.

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

Constructs a new Context.ContextTokens | ContextTokens instance.

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

[qualifiers](./ContextTokens.qualifiers.md)

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

[parseContextQualifierToken(token, qualifiers)](./ContextTokens.parseContextQualifierToken.md)

</td><td>

`static`

</td><td>

Parses a ContextQualifierToken | context qualifier token and validates it against the qualifiers

</td></tr>
<tr><td>

[parseContextToken(token, qualifiers)](./ContextTokens.parseContextToken.md)

</td><td>

`static`

</td><td>

Parses a ContextToken | context token and validates it against the qualifiers

</td></tr>
<tr><td>

[validateContextTokenParts(parts, qualifiers)](./ContextTokens.validateContextTokenParts.md)

</td><td>

`static`

</td><td>

Validates the parts of a context token against the qualifiers present in the supplied

</td></tr>
<tr><td>

[findQualifierForValue(value, qualifiers)](./ContextTokens.findQualifierForValue.md)

</td><td>

`static`

</td><td>

Given a value and a set of qualifiers, finds a single token-optional qualifier that matches the value.

</td></tr>
<tr><td>

[contextTokenToPartialContext(token, qualifiers)](./ContextTokens.contextTokenToPartialContext.md)

</td><td>

`static`

</td><td>

Converts a ContextToken | context token to a validated partial context.

</td></tr>
<tr><td>

[partialContextToContextToken(context)](./ContextTokens.partialContextToContextToken.md)

</td><td>

`static`

</td><td>

Converts a validated partial context to a ContextToken | context token.

</td></tr>
<tr><td>

[parseContextQualifierToken(token)](./ContextTokens.parseContextQualifierToken.md)

</td><td>



</td><td>

Parses a ContextQualifierToken | context qualifier token string and validates the parts

</td></tr>
<tr><td>

[parseContextToken(token)](./ContextTokens.parseContextToken.md)

</td><td>



</td><td>

Parses a ContextToken | context token string and validates the parts

</td></tr>
<tr><td>

[validateContextTokenParts(parts)](./ContextTokens.validateContextTokenParts.md)

</td><td>



</td><td>

Validates the Helpers.IContextTokenParts | parts of a ContextToken | context token.

</td></tr>
<tr><td>

[findQualifierForValue(value)](./ContextTokens.findQualifierForValue.md)

</td><td>



</td><td>

Given a value, finds a single token-optional qualifier that matches the value.

</td></tr>
<tr><td>

[contextTokenToPartialContext(token)](./ContextTokens.contextTokenToPartialContext.md)

</td><td>



</td><td>

Converts a ContextToken | context token to a validated partial context.

</td></tr>
<tr><td>

[partialContextToContextToken(context)](./ContextTokens.partialContextToContextToken.md)

</td><td>



</td><td>

Converts a validated partial context to a ContextToken | context token.

</td></tr>
</tbody></table>
