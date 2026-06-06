[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-res](../../../README.md) / [Runtime](../README.md) / ICompiledResourceCollectionCreateParams

# Interface: ICompiledResourceCollectionCreateParams

Interface for parameters to create a [CompiledResourceCollection](../classes/CompiledResourceCollection.md).

## Properties

| Property | Type | Description |
| ------ | ------ | ------ |
| <a id="compiledcollection"></a> `compiledCollection` | [`ICompiledResourceCollection`](../../ResourceJson/namespaces/Compiled/interfaces/ICompiledResourceCollection.md) | The compiled resource collection data. |
| <a id="qualifiertypes"></a> `qualifierTypes` | [`IReadOnlyResultMap`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`string`, [`QualifierType`](../../../classes/QualifierType.md)\<[`JsonObject`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs)\>\> | Map of qualifier type names to qualifier type objects. |
| <a id="resourcetypes"></a> `resourceTypes` | [`IReadOnlyResultMap`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`string`, [`ResourceType`](../../../classes/ResourceType.md)\<`unknown`\>\> | Map of resource type names to resource type objects. |
