[Home](../README.md) > ConditionSet

# Class: ConditionSet

Represents a set of Conditions.Condition | conditions that must all be met in some runtime
context for a resource instance to be valid.

**Implements:** [`IValidatedConditionSetDecl`](../interfaces/IValidatedConditionSetDecl.md)

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

[UnconditionalKey](./ConditionSet.UnconditionalKey.md)

</td><td>

`static`

</td><td>

[ConditionSetKey](../type-aliases/ConditionSetKey.md)

</td><td>

The key for an unconditional condition set.

</td></tr>
<tr><td>

[conditions](./ConditionSet.conditions.md)

</td><td>

`readonly`

</td><td>

readonly [Condition](Condition.md)[]

</td><td>

The Conditions.Condition | conditions that make up this condition

</td></tr>
<tr><td>

[key](./ConditionSet.key.md)

</td><td>

`readonly`

</td><td>

[ConditionSetKey](../type-aliases/ConditionSetKey.md)

</td><td>

The key for this condition set.

</td></tr>
<tr><td>

[size](./ConditionSet.size.md)

</td><td>

`readonly`

</td><td>

number

</td><td>

The number of conditions in this condition set.

</td></tr>
<tr><td>

[index](./ConditionSet.index.md)

</td><td>

`readonly`

</td><td>

[ConditionSetIndex](../type-aliases/ConditionSetIndex.md) | undefined

</td><td>

The index for this condition set.

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

[create(params)](./ConditionSet.create.md)

</td><td>

`static`

</td><td>

Creates a new Conditions.ConditionSet | ConditionSet object.

</td></tr>
<tr><td>

[compare(cs1, cs2)](./ConditionSet.compare.md)

</td><td>

`static`

</td><td>

Compares two Conditions.ConditionSet | ConditionSets for sorting purposes.

</td></tr>
<tr><td>

[getKeyForDecl(decl)](./ConditionSet.getKeyForDecl.md)

</td><td>

`static`

</td><td>

Gets the ConditionSetKey | key for a supplied Conditions.IValidatedConditionSetDecl | condition set declaration.

</td></tr>
<tr><td>

[getKeyFromLooseDecl(conditionSet, conditionCollector)](./ConditionSet.getKeyFromLooseDecl.md)

</td><td>

`static`

</td><td>

Gets a condition set key from a loose condition set declaration.

</td></tr>
<tr><td>

[setIndex(index)](./ConditionSet.setIndex.md)

</td><td>



</td><td>

Sets the global index for this condition set.

</td></tr>
<tr><td>

[canMatchPartialContext(context, options)](./ConditionSet.canMatchPartialContext.md)

</td><td>



</td><td>

Determines if this condition set can match a supplied context, even if the context is partial.

</td></tr>
<tr><td>

[toToken(terse)](./ConditionSet.toToken.md)

</td><td>



</td><td>

Gets a ConditionSetToken | condition set token for this condition set,

</td></tr>
<tr><td>

[toKey()](./ConditionSet.toKey.md)

</td><td>



</td><td>

Gets the ConditionSetKey | key for this condition set.

</td></tr>
<tr><td>

[toHash()](./ConditionSet.toHash.md)

</td><td>



</td><td>

Gets a hash of this condition set.

</td></tr>
<tr><td>

[toString()](./ConditionSet.toString.md)

</td><td>



</td><td>

Gets a human-readable string representation of this condition set.

</td></tr>
<tr><td>

[toConditionSetRecordDecl(options)](./ConditionSet.toConditionSetRecordDecl.md)

</td><td>



</td><td>

Gets the ResourceJson.Json.ConditionSetDeclAsRecord | condition set declaration as a record for this condition set.

</td></tr>
<tr><td>

[toConditionSetArrayDecl(options)](./ConditionSet.toConditionSetArrayDecl.md)

</td><td>



</td><td>

Gets the ResourceJson.Json.ConditionSetDeclAsArray | condition set declaration as an array for this condition set.

</td></tr>
<tr><td>

[toCompiled(options)](./ConditionSet.toCompiled.md)

</td><td>



</td><td>

Converts this condition set to a compiled condition set representation.

</td></tr>
</tbody></table>
