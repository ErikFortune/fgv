[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-res-ui-components](../../../README.md) / [ZipTools](../README.md) / processZipResources

# Function: processZipResources()

> **processZipResources**(`fileTree`, `config?`, `o11y?`): `Promise`\<[`Result`](../../../type-aliases/Result.md)\<[`IProcessedResources`](../../ResourceTools/interfaces/IProcessedResources.md)\>\>

Helper function to process resources from ZIP data using ts-res-ui-components integration

## Parameters

| Parameter | Type | Default value |
| ------ | ------ | ------ |
| `fileTree` | [`FileTree_2`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs) | `undefined` |
| `config?` | [`ISystemConfiguration`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-res/docs) | `undefined` |
| `o11y?` | [`IObservabilityContext`](../../ObservabilityTools/interfaces/IObservabilityContext.md) | `ObservabilityTools.DefaultObservabilityContext` |

## Returns

`Promise`\<[`Result`](../../../type-aliases/Result.md)\<[`IProcessedResources`](../../ResourceTools/interfaces/IProcessedResources.md)\>\>
