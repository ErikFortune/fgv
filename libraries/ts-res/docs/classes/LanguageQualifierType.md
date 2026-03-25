[Home](../README.md) > LanguageQualifierType

# Class: LanguageQualifierType

QualifierTypes.QualifierType | Qualifier type which matches BCP-47 language tags
applying https://github.com/ErikFortune/fgv/tree/main/libraries/ts-bcp47#tag-matching | similarity matching.
Accepts a list of language tags in the context by default.

**Extends:** [`QualifierType<JsonCompatibleType<ILanguageQualifierTypeConfig>>`](QualifierType.md)

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

[systemTypeName](./LanguageQualifierType.systemTypeName.md)

</td><td>

`readonly`

</td><td>

[QualifierTypeName](../type-aliases/QualifierTypeName.md)

</td><td>

QualifierTypes.IQualifierType.systemTypeName

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

[create(params)](./LanguageQualifierType.create.md)

</td><td>

`static`

</td><td>

Creates a new instance of a QualifierTypes.LanguageQualifierType | language qualifier type.

</td></tr>
<tr><td>

[createFromConfig(config)](./LanguageQualifierType.createFromConfig.md)

</td><td>

`static`

</td><td>

Creates a new QualifierTypes.LanguageQualifierType | LanguageQualifierType from a configuration object.

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

[isValidConditionValue(value)](./LanguageQualifierType.isValidConditionValue.md)

</td><td>



</td><td>

QualifierTypes.IQualifierType.isValidConditionValue

</td></tr>
<tr><td>

[getConfiguration()](./LanguageQualifierType.getConfiguration.md)

</td><td>



</td><td>

Gets a QualifierTypes.Config.ISystemLanguageQualifierTypeConfig | strongly typed configuration object

</td></tr>
<tr><td>

[getConfigurationJson()](./LanguageQualifierType.getConfigurationJson.md)

</td><td>



</td><td>

QualifierTypes.IQualifierType.getConfigurationJson

</td></tr>
<tr><td>

[validateConfigurationJson(from)](./LanguageQualifierType.validateConfigurationJson.md)

</td><td>



</td><td>

QualifierTypes.IQualifierType.validateConfigurationJson

</td></tr>
<tr><td>

[validateConfiguration(from)](./LanguageQualifierType.validateConfiguration.md)

</td><td>



</td><td>

Validates a QualifierTypes.Config.ISystemLanguageQualifierTypeConfig | strongly typed configuration object

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
