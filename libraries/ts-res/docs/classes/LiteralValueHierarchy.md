[Home](../README.md) > LiteralValueHierarchy

# Class: LiteralValueHierarchy

A class that implements a hierarchy of literal values. The hierarchy is defined as a
tree, where each value can have multiple children but only one parent. The root of the
tree has no parent. The hierarchy is used to determine the relationship between values
when matching conditions and contexts.

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

[values](./LiteralValueHierarchy.values.md)

</td><td>

`readonly`

</td><td>

ReadonlyMap&lt;T, [ILiteralValue](../interfaces/ILiteralValue.md)&lt;T&gt;&gt;

</td><td>

A map of all allowed literal values to the corresponding

</td></tr>
<tr><td>

[isOpenValues](./LiteralValueHierarchy.isOpenValues.md)

</td><td>

`readonly`

</td><td>

boolean

</td><td>

Indicates whether this hierarchy was created with open values (no enumerated values

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

[create(params)](./LiteralValueHierarchy.create.md)

</td><td>

`static`

</td><td>

Creates a new QualifierTypes.LiteralValueHierarchy | LiteralValueHierarchy instance.

</td></tr>
<tr><td>

[hasValue(value)](./LiteralValueHierarchy.hasValue.md)

</td><td>



</td><td>

Checks if a value exists in the hierarchy.

</td></tr>
<tr><td>

[getRoots()](./LiteralValueHierarchy.getRoots.md)

</td><td>



</td><td>

Gets all root values (values with no parent) in the hierarchy.

</td></tr>
<tr><td>

[getAncestors(value)](./LiteralValueHierarchy.getAncestors.md)

</td><td>



</td><td>

Gets all ancestors of a value in the hierarchy.

</td></tr>
<tr><td>

[isAncestor(value, possibleAncestor)](./LiteralValueHierarchy.isAncestor.md)

</td><td>



</td><td>

Determines if a value is an ancestor of a possible ancestor value.

</td></tr>
<tr><td>

[getDescendants(value)](./LiteralValueHierarchy.getDescendants.md)

</td><td>



</td><td>

Gets all descendants of a value in the hierarchy.

</td></tr>
<tr><td>

[match(condition, context)](./LiteralValueHierarchy.match.md)

</td><td>



</td><td>



</td></tr>
<tr><td>

[asRecord()](./LiteralValueHierarchy.asRecord.md)

</td><td>



</td><td>

Converts the hierarchy to a record of parent-child relationships.

</td></tr>
</tbody></table>
