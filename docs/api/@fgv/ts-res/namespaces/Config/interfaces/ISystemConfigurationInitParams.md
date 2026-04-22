[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-res](../../../README.md) / [Config](../README.md) / ISystemConfigurationInitParams

# Interface: ISystemConfigurationInitParams

Parameters used to initialize a [SystemConfiguration](../classes/SystemConfiguration.md).

## Properties

| Property | Type | Description |
| ------ | ------ | ------ |
| <a id="qualifierdefaultvalues"></a> `qualifierDefaultValues?` | `Record`\<`string`, `string` \| `null`\> | Optional map of qualifier names to default values. If provided, qualifiers in the system configuration will be updated with these default values. Use `null` as the value to remove an existing default value. |
| <a id="qualifiertypefactory"></a> `qualifierTypeFactory?` | [`IConfigInitFactory`](IConfigInitFactory.md)\<[`IAnyQualifierTypeConfig`](../../QualifierTypes/namespaces/Config/type-aliases/IAnyQualifierTypeConfig.md), [`QualifierType`](../../../classes/QualifierType.md)\<[`JsonObject`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs)\>\> | - |
| <a id="resourcetypefactory"></a> `resourceTypeFactory?` | [`IConfigInitFactory`](IConfigInitFactory.md)\<[`IResourceTypeConfig`](../../ResourceTypes/namespaces/Config/interfaces/IResourceTypeConfig.md)\<[`JsonObject`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs)\>, [`ResourceType`](../../../classes/ResourceType.md)\<`unknown`\>\> | - |
