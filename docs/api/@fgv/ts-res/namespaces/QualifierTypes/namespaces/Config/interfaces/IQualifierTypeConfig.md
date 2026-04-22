[**@fgv Monorepo API Documentation**](../../../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../../../README.md) / [@fgv/ts-res](../../../../../README.md) / [QualifierTypes](../../../README.md) / [Config](../README.md) / IQualifierTypeConfig

# Interface: IQualifierTypeConfig\<T\>

Templated configuration for [qualifier type](../../../../../classes/QualifierType.md) configuration.

## Extended by

- [`ISystemLanguageQualifierTypeConfig`](ISystemLanguageQualifierTypeConfig.md)
- [`ISystemTerritoryQualifierTypeConfig`](ISystemTerritoryQualifierTypeConfig.md)
- [`ISystemLiteralQualifierTypeConfig`](ISystemLiteralQualifierTypeConfig.md)

## Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `T` | [`JsonObject`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs) |

## Properties

| Property | Type |
| ------ | ------ |
| <a id="configuration"></a> `configuration?` | `T` |
| <a id="name"></a> `name` | `string` |
| <a id="systemtype"></a> `systemType` | `string` |
