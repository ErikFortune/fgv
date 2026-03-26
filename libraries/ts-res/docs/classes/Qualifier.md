[Home](../README.md) > Qualifier

# Class: Qualifier

Represents a qualifier that can be used to identify the context in
which a resource is used.

**Implements:** [`IValidatedQualifierDecl`](../interfaces/IValidatedQualifierDecl.md), `ICollectible<QualifierName, QualifierIndex>`

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

[name](./Qualifier.name.md)

</td><td>

`readonly`

</td><td>

[QualifierName](../type-aliases/QualifierName.md)

</td><td>

The name of the qualifier.

</td></tr>
<tr><td>

[token](./Qualifier.token.md)

</td><td>

`readonly`

</td><td>

[QualifierName](../type-aliases/QualifierName.md)

</td><td>

The token used to identify the qualifier in the name or

</td></tr>
<tr><td>

[type](./Qualifier.type.md)

</td><td>

`readonly`

</td><td>

[QualifierType](QualifierType.md)

</td><td>

The QualifierTypes.QualifierType | type of the qualifier.

</td></tr>
<tr><td>

[tokenIsOptional](./Qualifier.tokenIsOptional.md)

</td><td>

`readonly`

</td><td>

boolean

</td><td>

Indicates whether the token is optional in the name or path of a resource being imported.

</td></tr>
<tr><td>

[defaultValue](./Qualifier.defaultValue.md)

</td><td>

`readonly`

</td><td>

[QualifierContextValue](../type-aliases/QualifierContextValue.md)

</td><td>

Optional default value for the qualifier.

</td></tr>
<tr><td>

[defaultPriority](./Qualifier.defaultPriority.md)

</td><td>

`readonly`

</td><td>

[ConditionPriority](../type-aliases/ConditionPriority.md)

</td><td>

The default ConditionPriority | priority of conditions

</td></tr>
<tr><td>

[index](./Qualifier.index.md)

</td><td>

`readonly`

</td><td>

[QualifierIndex](../type-aliases/QualifierIndex.md) | undefined

</td><td>

The index of the qualifier.

</td></tr>
<tr><td>

[key](./Qualifier.key.md)

</td><td>

`readonly`

</td><td>

[QualifierName](../type-aliases/QualifierName.md)

</td><td>

The collector key for this qualifier.

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

[create(decl)](./Qualifier.create.md)

</td><td>

`static`

</td><td>

Creates a new instance of a Qualifiers.Qualifier | Qualifier from the

</td></tr>
<tr><td>

[setIndex(index)](./Qualifier.setIndex.md)

</td><td>



</td><td>

Sets the index of this qualifier.

</td></tr>
<tr><td>

[isValidContextValue(value)](./Qualifier.isValidContextValue.md)

</td><td>



</td><td>

QualifierTypes.QualifierType.isValidContextValue

</td></tr>
<tr><td>

[isValidConditionValue(value)](./Qualifier.isValidConditionValue.md)

</td><td>



</td><td>

QualifierTypes.QualifierType.isValidConditionValue

</td></tr>
<tr><td>

[validateCondition(value, operator)](./Qualifier.validateCondition.md)

</td><td>



</td><td>

QualifierTypes.QualifierType.validateCondition

</td></tr>
<tr><td>

[validateContextValue(value)](./Qualifier.validateContextValue.md)

</td><td>



</td><td>

QualifierTypes.QualifierType.validateContextValue

</td></tr>
</tbody></table>
