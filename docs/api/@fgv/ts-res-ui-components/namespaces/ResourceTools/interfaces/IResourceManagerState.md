[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-res-ui-components](../../../README.md) / [ResourceTools](../README.md) / IResourceManagerState

# Interface: IResourceManagerState

Represents the current state of the resource manager.
Tracks processing status, data, and any errors.

## Properties

| Property | Type | Description |
| ------ | ------ | ------ |
| <a id="activeconfiguration"></a> `activeConfiguration` | [`ISystemConfiguration`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-res/docs) \| `null` | The active system configuration |
| <a id="bundlemetadata"></a> `bundleMetadata` | [`IBundleMetadata`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-res/docs) \| `null` | Bundle metadata if loaded from bundle |
| <a id="error"></a> `error` | `string` \| `null` | Current error message, or null if no error |
| <a id="hasprocesseddata"></a> `hasProcessedData` | `boolean` | Whether any resource data has been successfully processed |
| <a id="isloadedfrombundle"></a> `isLoadedFromBundle` | `boolean` | Whether the current data was loaded from a bundle |
| <a id="isprocessing"></a> `isProcessing` | `boolean` | Whether the system is currently processing resources |
| <a id="processedresources"></a> `processedResources` | [`IExtendedProcessedResources`](IExtendedProcessedResources.md) \| `null` | The processed resource system, or null if not yet processed |
