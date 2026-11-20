[Home](../README.md) > Condition

# Class: Condition

Represents a single condition applied to some resource instance.

**Implements:** [`IValidatedConditionDecl`](../interfaces/IValidatedConditionDecl.md)

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

[qualifier](./Condition.qualifier.md)

</td><td>

`readonly`

</td><td>

[Qualifier](Qualifier.md)

</td><td>

The Qualifiers.Qualifier | qualifier used in this condition.

</td></tr>
<tr><td>

[value](./Condition.value.md)

</td><td>

`readonly`

</td><td>

[QualifierConditionValue](../type-aliases/QualifierConditionValue.md)

</td><td>

The value to be matched in this condition.

</td></tr>
<tr><td>

[operator](./Condition.operator.md)

</td><td>

`readonly`

</td><td>

[ConditionOperator](../type-aliases/ConditionOperator.md)

</td><td>

The ConditionOperator | operator used when matching context value to condition value.

</td></tr>
<tr><td>

[priority](./Condition.priority.md)

</td><td>

`readonly`

</td><td>

[ConditionPriority](../type-aliases/ConditionPriority.md)

</td><td>

The ConditionPriority | relative priority of this condition.

</td></tr>
<tr><td>

[scoreAsDefault](./Condition.scoreAsDefault.md)

</td><td>

`readonly`

</td><td>

[QualifierMatchScore](../type-aliases/QualifierMatchScore.md)

</td><td>

The QualifierMatchScore | score to be used when this condition is the default.

</td></tr>
<tr><td>

[key](./Condition.key.md)

</td><td>

`readonly`

</td><td>

[ConditionKey](../type-aliases/ConditionKey.md)

</td><td>



</td></tr>
<tr><td>

[index](./Condition.index.md)

</td><td>

`readonly`

</td><td>

[ConditionIndex](../type-aliases/ConditionIndex.md) | undefined

</td><td>



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

[create(decl)](./Condition.create.md)

</td><td>

`static`

</td><td>

Creates a new Conditions.Condition | Condition object from the supplied

</td></tr>
<tr><td>

[compare(c1, c2)](./Condition.compare.md)

</td><td>

`static`

</td><td>

Compares two conditions for sorting purposes.

</td></tr>
<tr><td>

[getKeyForDecl(decl)](./Condition.getKeyForDecl.md)

</td><td>

`static`

</td><td>

Gets the ConditionKey | condition key for a supplied Conditions.IValidatedConditionDecl | condition declaration.

</td></tr>
<tr><td>

[setIndex(index)](./Condition.setIndex.md)

</td><td>



</td><td>



</td></tr>
<tr><td>

[getContextMatch(context, options)](./Condition.getContextMatch.md)

</td><td>



</td><td>

Determines if this condition matches the supplied Context.IValidatedContextDecl | validated context.

</td></tr>
<tr><td>

[canMatchPartialContext(context, options)](./Condition.canMatchPartialContext.md)

</td><td>



</td><td>

Determines if this condition can match the supplied context, even if the context is partial.

</td></tr>
<tr><td>

[toToken(terse)](./Condition.toToken.md)

</td><td>



</td><td>

Gets a ConditionToken | condition token for this condition, if possible.

</td></tr>
<tr><td>

[toKey()](./Condition.toKey.md)

</td><td>



</td><td>

Gets the ConditionKey | key for this condition.

</td></tr>
<tr><td>

[toString()](./Condition.toString.md)

</td><td>



</td><td>

Get a human-readable string representation of the condition.

</td></tr>
<tr><td>

[toChildConditionDecl(options)](./Condition.toChildConditionDecl.md)

</td><td>



</td><td>

Gets the ResourceJson.Json.IChildConditionDecl | child condition declaration for this condition.

</td></tr>
<tr><td>

[toValueOrChildConditionDecl(options)](./Condition.toValueOrChildConditionDecl.md)

</td><td>



</td><td>

Gets the value for this condition, or the ResourceJson.Json.IChildConditionDecl | child condition declaration

</td></tr>
<tr><td>

[toLooseConditionDecl(options)](./Condition.toLooseConditionDecl.md)

</td><td>



</td><td>

Gets the ResourceJson.Json.ILooseConditionDecl | loose condition declaration for this condition.

</td></tr>
<tr><td>

[toCompiled(options)](./Condition.toCompiled.md)

</td><td>



</td><td>

Converts this condition to a compiled condition representation.

</td></tr>
</tbody></table>
