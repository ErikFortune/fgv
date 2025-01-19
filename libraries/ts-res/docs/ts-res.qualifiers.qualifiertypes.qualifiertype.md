<!-- Do not edit this file. It is automatically generated by API Documenter. -->

[Home](./index.md) &gt; [@fgv/ts-res](./ts-res.md) &gt; [Qualifiers](./ts-res.qualifiers.md) &gt; [QualifierTypes](./ts-res.qualifiers.qualifiertypes.md) &gt; [QualifierType](./ts-res.qualifiers.qualifiertypes.qualifiertype.md)

## Qualifiers.QualifierTypes.QualifierType class

Abstract base class for qualifier types. Provides default implementations for the [IQualifierType](./ts-res.qualifiers.qualifiertypes.iqualifiertype.md) interface.

**Signature:**

```typescript
export declare abstract class QualifierType implements IQualifierType 
```
**Implements:** [IQualifierType](./ts-res.qualifiers.qualifiertypes.iqualifiertype.md)

## Constructors

<table><thead><tr><th>

Constructor


</th><th>

Modifiers


</th><th>

Description


</th></tr></thead>
<tbody><tr><td>

[(constructor)({ name, allowContextList })](./ts-res.qualifiers.qualifiertypes.qualifiertype._constructor_.md)


</td><td>

`protected`


</td><td>

Constructor for use by derived classes.


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
<tbody><tr><td>

[\_allowContextList](./ts-res.qualifiers.qualifiertypes.qualifiertype._allowcontextlist.md)


</td><td>

`protected`

`readonly`


</td><td>

boolean


</td><td>

Flag indicating whether this qualifier type allows a list of values in a context.


</td></tr>
<tr><td>

[name](./ts-res.qualifiers.qualifiertypes.qualifiertype.name.md)


</td><td>

`readonly`


</td><td>

[QualifierTypeName](./ts-res.qualifiertypename.md)


</td><td>

The name of the qualifier type.


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
<tbody><tr><td>

[\_matchList(condition, context, operator)](./ts-res.qualifiers.qualifiertypes.qualifiertype._matchlist.md)


</td><td>

`protected`


</td><td>

Matches a single condition value against a list of context values.


</td></tr>
<tr><td>

[\_matchOne(condition, context, operator)](./ts-res.qualifiers.qualifiertypes.qualifiertype._matchone.md)


</td><td>

`protected`

`abstract`


</td><td>

Matches a single condition value against a single context value.


</td></tr>
<tr><td>

[\_splitContext(value)](./ts-res.qualifiers.qualifiertypes.qualifiertype._splitcontext.md)


</td><td>

`protected`

`static`


</td><td>

Splits a comma-separated [context value](./ts-res.qualifiercontextvalue.md) into an array of individual values.


</td></tr>
<tr><td>

[isValidConditionValue(value)](./ts-res.qualifiers.qualifiertypes.qualifiertype.isvalidconditionvalue.md)


</td><td>


</td><td>

Validates a condition value for this qualifier type.


</td></tr>
<tr><td>

[isValidContextValue(value)](./ts-res.qualifiers.qualifiertypes.qualifiertype.isvalidcontextvalue.md)


</td><td>


</td><td>

Validates a context value for this qualifier type.


</td></tr>
<tr><td>

[matches(condition, context, operator)](./ts-res.qualifiers.qualifiertypes.qualifiertype.matches.md)


</td><td>


</td><td>

Determines the extent to which a condition matches a context value for this qualifier type.


</td></tr>
<tr><td>

[validateCondition(value, operator)](./ts-res.qualifiers.qualifiertypes.qualifiertype.validatecondition.md)


</td><td>


</td><td>

Validates that a value and optional operator are valid for use in a condition for qualifiers of this type.


</td></tr>
<tr><td>

[validateContextValue(value)](./ts-res.qualifiers.qualifiertypes.qualifiertype.validatecontextvalue.md)


</td><td>


</td><td>

Validates that a value is valid for use in a runtime context for qualifiers of this type.


</td></tr>
</tbody></table>