[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-res-ui-components](../../../README.md) / [TsResTools](../README.md) / createTsResSystemFromConfig

# Function: createTsResSystemFromConfig()

> **createTsResSystemFromConfig**(`systemConfig?`, `qualifierTypeFactory?`, `resourceTypeFactory?`): [`Result`](../../../type-aliases/Result.md)\<\{ `contextQualifierProvider`: [`ValidatingSimpleContextQualifierProvider`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-res/docs); `importManager`: [`ImportManager`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-res/docs); `qualifiers`: [`IReadOnlyQualifierCollector`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-res/docs); `qualifierTypes`: [`ReadOnlyQualifierTypeCollector`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-res/docs); `resourceManager`: [`ResourceManagerBuilder`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-res/docs); `resourceTypes`: [`ReadOnlyResourceTypeCollector`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-res/docs); \}\>

**`Internal`**

## Parameters

| Parameter | Type |
| ------ | ------ |
| `systemConfig?` | [`ISystemConfiguration`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-res/docs) |
| `qualifierTypeFactory?` | [`IConfigInitFactory`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-res/docs)\<[`IAnyQualifierTypeConfig`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-res/docs), [`QualifierType`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-res/docs)\<[`JsonObject`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs)\>\> |
| `resourceTypeFactory?` | [`IConfigInitFactory`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-res/docs)\<[`IResourceTypeConfig`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-res/docs)\<[`JsonObject`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs)\>, [`ResourceType`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-res/docs)\<`unknown`\>\> |

## Returns

[`Result`](../../../type-aliases/Result.md)\<\{ `contextQualifierProvider`: [`ValidatingSimpleContextQualifierProvider`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-res/docs); `importManager`: [`ImportManager`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-res/docs); `qualifiers`: [`IReadOnlyQualifierCollector`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-res/docs); `qualifierTypes`: [`ReadOnlyQualifierTypeCollector`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-res/docs); `resourceManager`: [`ResourceManagerBuilder`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-res/docs); `resourceTypes`: [`ReadOnlyResourceTypeCollector`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-res/docs); \}\>
