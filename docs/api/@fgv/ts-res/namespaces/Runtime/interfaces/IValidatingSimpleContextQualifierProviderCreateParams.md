[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-res](../../../README.md) / [Runtime](../README.md) / IValidatingSimpleContextQualifierProviderCreateParams

# Interface: IValidatingSimpleContextQualifierProviderCreateParams

Parameters for creating a [ValidatingSimpleContextQualifierProvider](../classes/ValidatingSimpleContextQualifierProvider.md).

## Properties

| Property | Type | Description |
| ------ | ------ | ------ |
| <a id="qualifiers"></a> `qualifiers` | [`IReadOnlyQualifierCollector`](../../Qualifiers/interfaces/IReadOnlyQualifierCollector.md) | The [readonly qualifier collector](../../Qualifiers/interfaces/IReadOnlyQualifierCollector.md) that defines and validates qualifiers. |
| <a id="qualifiervalues"></a> `qualifierValues?` | `Record`\<`string`, `string`\> | Optional record of initial qualifier name-value pairs to populate the provider. Accepts string keys and values which will be converted to strongly-typed values. |
