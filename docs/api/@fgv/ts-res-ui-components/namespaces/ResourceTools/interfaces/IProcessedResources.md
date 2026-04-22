[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-res-ui-components](../../../README.md) / [ResourceTools](../README.md) / IProcessedResources

# Interface: IProcessedResources

Represents a fully processed ts-res system ready for use.
Contains both the runtime system components and the compiled resource collection.
This is the primary data structure used by all UI components.

## Extended by

- [`IExtendedProcessedResources`](IExtendedProcessedResources.md)

## Properties

| Property | Type | Description |
| ------ | ------ | ------ |
| <a id="compiledcollection"></a> `compiledCollection` | [`ICompiledResourceCollection`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-res/docs) | Compiled version of the resource collection for efficient resolution |
| <a id="resolver"></a> `resolver` | [`ResourceResolver`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-res/docs) | Resource resolver for runtime resource resolution |
| <a id="resourcecount"></a> `resourceCount` | `number` | Total count of resources in the system |
| <a id="summary"></a> `summary` | `object` | Summary information about the resource system |
| `summary.errorCount` | `number` | Number of errors encountered during processing |
| `summary.resourceIds` | `string`[] | Array of all resource identifiers |
| `summary.totalResources` | `number` | Total number of resources |
| `summary.warnings` | `string`[] | Array of warning messages from processing |
| <a id="system"></a> `system` | `object` | Core ts-res system components |
| `system.contextQualifierProvider` | [`ValidatingSimpleContextQualifierProvider`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-res/docs) | Provider for validating and managing runtime context |
| `system.importManager` | [`ImportManager`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-res/docs) | Manager for handling resource imports |
| `system.qualifiers` | [`IReadOnlyQualifierCollector`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-res/docs) | Collection of qualifier declarations |
| `system.qualifierTypes` | [`ReadOnlyQualifierTypeCollector`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-res/docs) | Collection of qualifier type definitions |
| `system.resourceManager` | [`ResourceManagerBuilder`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-res/docs) | Primary resource manager for building and managing resources |
| `system.resourceTypes` | [`ReadOnlyResourceTypeCollector`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-res/docs) | Collection of resource type definitions |
