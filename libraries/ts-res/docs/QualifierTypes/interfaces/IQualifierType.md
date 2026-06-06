[Home](../../README.md) > [QualifierTypes](../README.md) > IQualifierType

# Interface: IQualifierType

Interface for a qualifier type. A qualifier type implements the build and
runtime semantics for some class of related qualifiers (e.g. language,
territories, etc).

**Extends:** `ICollectible<QualifierTypeName, QualifierTypeIndex>`

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

[name](./IQualifierType.name.md)

</td><td>

`readonly`

</td><td>

[QualifierTypeName](../../type-aliases/QualifierTypeName.md)

</td><td>

The name of the qualifier type.

</td></tr>
<tr><td>

[systemTypeName](./IQualifierType.systemTypeName.md)

</td><td>

`readonly`

</td><td>

[QualifierTypeName](../../type-aliases/QualifierTypeName.md)

</td><td>

Name of the underlying system type.

</td></tr>
<tr><td>

[key](./IQualifierType.key.md)

</td><td>

`readonly`

</td><td>

[QualifierTypeName](../../type-aliases/QualifierTypeName.md)

</td><td>

Unique key for this qualifier.

</td></tr>
<tr><td>

[index](./IQualifierType.index.md)

</td><td>

`readonly`

</td><td>

[QualifierTypeIndex](../../type-aliases/QualifierTypeIndex.md) | undefined

</td><td>

Global index for this qualifier type.

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

[isValidConditionValue(value)](./IQualifierType.isValidConditionValue.md)

</td><td>



</td><td>

Validates a condition value for this qualifier type.

</td></tr>
<tr><td>

[isValidContextValue(value)](./IQualifierType.isValidContextValue.md)

</td><td>



</td><td>

Validates a context value for this qualifier type.

</td></tr>
<tr><td>

[isPotentialMatch(conditionValue, contextValue)](./IQualifierType.isPotentialMatch.md)

</td><td>



</td><td>

Determines if a supplied condition value is a potential match for a possible context value.

</td></tr>
<tr><td>

[validateCondition(value, operator)](./IQualifierType.validateCondition.md)

</td><td>



</td><td>

Validates that a value and optional operator are valid for use in a condition

</td></tr>
<tr><td>

[validateContextValue(value)](./IQualifierType.validateContextValue.md)

</td><td>



</td><td>

Validates that a value is valid for use in a runtime context for qualifiers

</td></tr>
<tr><td>

[matches(condition, context, operator)](./IQualifierType.matches.md)

</td><td>



</td><td>

Determines the extent to which a condition matches a context value for this

</td></tr>
<tr><td>

[setIndex(index)](./IQualifierType.setIndex.md)

</td><td>



</td><td>

Sets the index for this qualifier type.

</td></tr>
<tr><td>

[getConfigurationJson()](./IQualifierType.getConfigurationJson.md)

</td><td>



</td><td>

Gets the configuration for this qualifier type.

</td></tr>
<tr><td>

[validateConfigurationJson(from)](./IQualifierType.validateConfigurationJson.md)

</td><td>



</td><td>

Validates configuration JSON data for this qualifier type.

</td></tr>
</tbody></table>
