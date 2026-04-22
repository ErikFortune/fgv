[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-res](../../../README.md) / [Runtime](../README.md) / ISimpleContextQualifierProviderCreateParams

# Interface: ISimpleContextQualifierProviderCreateParams

Parameters for creating a [SimpleContextQualifierProvider](../classes/SimpleContextQualifierProvider.md).

## Properties

| Property | Type | Description |
| ------ | ------ | ------ |
| <a id="qualifiers"></a> `qualifiers` | [`IReadOnlyQualifierCollector`](../../Qualifiers/interfaces/IReadOnlyQualifierCollector.md) | The [readonly qualifier collector](../../Qualifiers/interfaces/IReadOnlyQualifierCollector.md) that defines and validates qualifiers. |
| <a id="qualifiervalues"></a> `qualifierValues?` | `Record`\<`string`, [`QualifierContextValue`](../../../type-aliases/QualifierContextValue.md)\> | Optional record of initial qualifier name-value pairs to populate the provider. |
