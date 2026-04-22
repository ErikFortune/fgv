[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-res](../../../README.md) / [Runtime](../README.md) / IResourceResolverCreateParams

# Interface: IResourceResolverCreateParams

Parameters for creating a [ResourceResolver](../../../classes/ResourceResolver.md).

## Properties

| Property | Type | Description |
| ------ | ------ | ------ |
| <a id="contextqualifierprovider"></a> `contextQualifierProvider` | [`IContextQualifierProvider`](../namespaces/Context/type-aliases/IContextQualifierProvider.md) | The [context qualifier provider](../namespaces/Context/type-aliases/IContextQualifierProvider.md) that resolves qualifier values for the current context. |
| <a id="listener"></a> `listener?` | [`IResourceResolverCacheListener`](IResourceResolverCacheListener.md) | An optional listener for [ResourceResolver](../../../classes/ResourceResolver.md) cache activity. |
| <a id="options"></a> `options?` | [`IResourceResolverOptions`](IResourceResolverOptions.md) | Optional configuration options for the [ResourceResolver](../../../classes/ResourceResolver.md). |
| <a id="qualifiertypes"></a> `qualifierTypes` | [`ReadOnlyQualifierTypeCollector`](../../QualifierTypes/type-aliases/ReadOnlyQualifierTypeCollector.md) | The [readonly qualifier type collector](../../QualifierTypes/type-aliases/ReadOnlyQualifierTypeCollector.md) that provides qualifier implementations for condition evaluation. |
| <a id="resourcemanager"></a> `resourceManager` | [`IResourceManager`](../../../interfaces/IResourceManager.md) | The [resource manager](../../../interfaces/IResourceManager.md) that defines the resources available and provides access to qualifiers and conditions. |
