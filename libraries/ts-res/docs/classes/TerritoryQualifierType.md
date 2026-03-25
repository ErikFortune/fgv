[Home](../README.md) > TerritoryQualifierType

# Class: TerritoryQualifierType

Qualifier type for territory values. Territories are two-letter ISO-3166-2
Alpha-2 country codes. Canonical territory codes are uppercase, but this
implementation handles incorrect casing.

**Extends:** [`QualifierType<JsonCompatibleType<ITerritoryQualifierTypeConfig>>`](QualifierType.md)

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

[systemTypeName](./TerritoryQualifierType.systemTypeName.md)

</td><td>

`readonly`

</td><td>

[QualifierTypeName](../type-aliases/QualifierTypeName.md)

</td><td>

QualifierTypes.IQualifierType.systemTypeName

</td></tr>
<tr><td>

[allowedTerritories](./TerritoryQualifierType.allowedTerritories.md)

</td><td>

`readonly`

</td><td>

readonly [QualifierConditionValue](../type-aliases/QualifierConditionValue.md)[]

</td><td>

Optional array enumerating allowed territories to further constrain the type.

</td></tr>
<tr><td>

[acceptLowercase](./TerritoryQualifierType.acceptLowercase.md)

</td><td>

`readonly`

</td><td>

boolean

</td><td>

Flag indicating whether the qualifier type should accept lowercase territory codes.

</td></tr>
<tr><td>

[hierarchy](./TerritoryQualifierType.hierarchy.md)

</td><td>

`readonly`

</td><td>

[LiteralValueHierarchy](LiteralValueHierarchy.md)&lt;string&gt;

</td><td>

Optional QualifierTypes.LiteralValueHierarchy | hierarchy of territory
values to use for matching.

</td></tr>
<tr><td>

[name](./QualifierType.name.md)

</td><td>

`readonly`

</td><td>

[QualifierTypeName](../type-aliases/QualifierTypeName.md)

</td><td>

QualifierTypes.IQualifierType.name

</td></tr>
<tr><td>

[allowContextList](./QualifierType.allowContextList.md)

</td><td>

`readonly`

</td><td>

boolean

</td><td>

Flag indicating whether this qualifier type allows a list of values in a context.

</td></tr>
<tr><td>

[key](./QualifierType.key.md)

</td><td>

`readonly`

</td><td>

[QualifierTypeName](../type-aliases/QualifierTypeName.md)

</td><td>

QualifierTypes.IQualifierType.key

</td></tr>
<tr><td>

[index](./QualifierType.index.md)

</td><td>

`readonly`

</td><td>

[QualifierTypeIndex](../type-aliases/QualifierTypeIndex.md) | undefined

</td><td>

QualifierTypes.IQualifierType.index

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

[create(params)](./TerritoryQualifierType.create.md)

</td><td>

`static`

</td><td>

Creates a new QualifierTypes.TerritoryQualifierType | TerritoryQualifierType instance.

</td></tr>
<tr><td>

[createFromConfig(config)](./TerritoryQualifierType.createFromConfig.md)

</td><td>

`static`

</td><td>

Creates a new QualifierTypes.TerritoryQualifierType | TerritoryQualifierType from a configuration object.

</td></tr>
<tr><td>

[isValidTerritoryConditionValue(value, acceptLowercase)](./TerritoryQualifierType.isValidTerritoryConditionValue.md)

</td><td>

`static`

</td><td>

Determines whether a value is a valid condition value for a territory qualifier.

</td></tr>
<tr><td>

[toTerritoryConditionValue(value, acceptLowercase)](./TerritoryQualifierType.toTerritoryConditionValue.md)

</td><td>

`static`

</td><td>

Converts a string value to a territory condition value.

</td></tr>
<tr><td>

[isValidName(name)](./QualifierType.isValidName.md)

</td><td>

`static`

</td><td>

Validate.isValidQualifierTypeName

</td></tr>
<tr><td>

[isValidIndex(index)](./QualifierType.isValidIndex.md)

</td><td>

`static`

</td><td>

Validate.isValidQualifierTypeIndex

</td></tr>
<tr><td>

[compare(t1, t2)](./QualifierType.compare.md)

</td><td>

`static`

</td><td>

Compares two qualifier types by index.

</td></tr>
<tr><td>

[_splitContext(value)](./QualifierType._splitContext.md)

</td><td>

`static`

</td><td>

Splits a comma-separated QualifierContextValue | context value into an

</td></tr>
<tr><td>

[isValidConditionValue(value)](./TerritoryQualifierType.isValidConditionValue.md)

</td><td>



</td><td>

QualifierTypes.QualifierType.isValidConditionValue

</td></tr>
<tr><td>

[getConfiguration()](./TerritoryQualifierType.getConfiguration.md)

</td><td>



</td><td>

Gets the QualifierTypes.Config.ISystemTerritoryQualifierTypeConfig | strongly typed configuration

</td></tr>
<tr><td>

[getConfigurationJson()](./TerritoryQualifierType.getConfigurationJson.md)

</td><td>



</td><td>

QualifierTypes.IQualifierType.getConfigurationJson

</td></tr>
<tr><td>

[validateConfigurationJson(from)](./TerritoryQualifierType.validateConfigurationJson.md)

</td><td>



</td><td>

QualifierTypes.IQualifierType.validateConfigurationJson

</td></tr>
<tr><td>

[validateConfiguration(from)](./TerritoryQualifierType.validateConfiguration.md)

</td><td>



</td><td>

Validates a QualifierTypes.Config.ISystemTerritoryQualifierTypeConfig | strongly typed configuration object

</td></tr>
<tr><td>

[isValidContextValue(value)](./QualifierType.isValidContextValue.md)

</td><td>



</td><td>

QualifierTypes.IQualifierType.isValidContextValue

</td></tr>
<tr><td>

[isPotentialMatch(conditionValue, contextValue)](./QualifierType.isPotentialMatch.md)

</td><td>



</td><td>

QualifierTypes.IQualifierType.isPotentialMatch

</td></tr>
<tr><td>

[validateCondition(value, operator)](./QualifierType.validateCondition.md)

</td><td>



</td><td>

QualifierTypes.IQualifierType.validateCondition

</td></tr>
<tr><td>

[validateContextValue(value)](./QualifierType.validateContextValue.md)

</td><td>



</td><td>

QualifierTypes.IQualifierType.validateContextValue

</td></tr>
<tr><td>

[matches(condition, context, operator)](./QualifierType.matches.md)

</td><td>



</td><td>

QualifierTypes.IQualifierType.matches

</td></tr>
<tr><td>

[setIndex(index)](./QualifierType.setIndex.md)

</td><td>



</td><td>

QualifierTypes.IQualifierType.setIndex

</td></tr>
<tr><td>

[_matchList(condition, context, operator)](./QualifierType._matchList.md)

</td><td>



</td><td>

Matches a single condition value against a list of context values.

</td></tr>
</tbody></table>
