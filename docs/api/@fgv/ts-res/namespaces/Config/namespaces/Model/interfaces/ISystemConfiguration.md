[**@fgv Monorepo API Documentation**](../../../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../../../README.md) / [@fgv/ts-res](../../../../../README.md) / [Config](../../../README.md) / [Model](../README.md) / ISystemConfiguration

# Interface: ISystemConfiguration

System configuration for both runtime or build.

## Properties

| Property | Type | Description |
| ------ | ------ | ------ |
| <a id="property-description"></a> `description?` | `string` | Optional description explaining the purpose and use case of the configuration. |
| <a id="property-name"></a> `name?` | `string` | Optional human-readable name for the configuration. |
| <a id="property-qualifiers"></a> `qualifiers` | [`IQualifierDecl`](../../../../Qualifiers/interfaces/IQualifierDecl.md)[] | Qualifier declarations that define the available qualifiers in the system. |
| <a id="property-qualifiertypes"></a> `qualifierTypes` | [`IAnyQualifierTypeConfig`](../../../../QualifierTypes/namespaces/Config/type-aliases/IAnyQualifierTypeConfig.md)[] | Qualifier type configurations that define the available qualifier types in the system. |
| <a id="property-resourcetypes"></a> `resourceTypes` | [`IResourceTypeConfig`](../../../../ResourceTypes/namespaces/Config/interfaces/IResourceTypeConfig.md)\<[`JsonObject`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs)\>[] | Resource type configurations that define the available resource types in the system. |
