[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-res](../../../README.md) / [QualifierTypes](../README.md) / ILanguageQualifierTypeCreateParams

# Interface: ILanguageQualifierTypeCreateParams

Interface defining the parameters that can be used to create a new
[LanguageQualifierType](../classes/LanguageQualifierType.md).

## Extends

- `Partial`\<[`IQualifierTypeCreateParams`](IQualifierTypeCreateParams.md)\>

## Properties

| Property | Type | Description |
| ------ | ------ | ------ |
| <a id="allowcontextlist"></a> `allowContextList?` | `boolean` | Optional flag indicating whether the context can be a list of values. Defaults to `true`. |
| <a id="index"></a> `index?` | `number` | Global index for this qualifier type. |
| <a id="name"></a> `name?` | `string` | Optional name for the qualifier type. Defaults to 'language'. |
