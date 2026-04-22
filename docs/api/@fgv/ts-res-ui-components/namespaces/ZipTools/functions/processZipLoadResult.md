[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-res-ui-components](../../../README.md) / [ZipTools](../README.md) / processZipLoadResult

# Function: processZipLoadResult()

> **processZipLoadResult**(`zipResult`, `overrideConfig?`, `o11y?`): `Promise`\<[`Result`](../../../type-aliases/Result.md)\<[`IProcessedResources`](../../ResourceTools/interfaces/IProcessedResources.md)\>\>

Helper function to process resources from a ZIP load result

## Parameters

| Parameter | Type | Default value |
| ------ | ------ | ------ |
| `zipResult` | \{ `config?`: [`ISystemConfiguration`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-res/docs); `fileTree`: [`FileTree_2`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs); \} | `undefined` |
| `zipResult.config?` | [`ISystemConfiguration`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-res/docs) | `undefined` |
| `zipResult.fileTree?` | [`FileTree_2`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs) | `undefined` |
| `overrideConfig?` | [`ISystemConfiguration`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-res/docs) | `undefined` |
| `o11y?` | [`IObservabilityContext`](../../ObservabilityTools/interfaces/IObservabilityContext.md) | `ObservabilityTools.DefaultObservabilityContext` |

## Returns

`Promise`\<[`Result`](../../../type-aliases/Result.md)\<[`IProcessedResources`](../../ResourceTools/interfaces/IProcessedResources.md)\>\>
