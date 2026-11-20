[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-res](../../../README.md) / [Resources](../README.md) / IDeltaGeneratorParams

# Interface: IDeltaGeneratorParams

Interface for parameters to create a [DeltaGenerator](../classes/DeltaGenerator.md).

## Properties

| Property | Type | Description |
| ------ | ------ | ------ |
| <a id="property-baselineresolver"></a> `baselineResolver` | [`IResourceResolver`](../../../interfaces/IResourceResolver.md) | The baseline resource resolver to compare against. |
| <a id="property-deltaresolver"></a> `deltaResolver` | [`IResourceResolver`](../../../interfaces/IResourceResolver.md) | The delta resource resolver containing changes. |
| <a id="property-logger"></a> `logger?` | [`ILogger`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs) | Optional logger for status and error reporting. |
| <a id="property-resourcemanager"></a> `resourceManager` | [`ResourceManagerBuilder`](../../../classes/ResourceManagerBuilder.md) | The resource manager to clone and update. |
