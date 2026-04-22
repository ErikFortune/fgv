[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-res](../../../README.md) / [Bundle](../README.md) / IBundle

# Interface: IBundle

A complete resource bundle that encapsulates built resources, configuration, and metadata.
Bundles provide a portable, integrity-verified way to distribute pre-compiled resource collections.

## Properties

| Property | Type | Description |
| ------ | ------ | ------ |
| <a id="compiledcollection"></a> `compiledCollection` | [`ICompiledResourceCollection`](../../ResourceJson/namespaces/Compiled/interfaces/ICompiledResourceCollection.md) | The compiled resource collection containing all resources, conditions, and decisions. |
| <a id="config"></a> `config` | [`ISystemConfiguration`](../../Config/namespaces/Model/interfaces/ISystemConfiguration.md) | The system configuration that was used to build the resources in this bundle. |
| <a id="exportmetadata"></a> `exportMetadata?` | [`IBundleExportMetadata`](IBundleExportMetadata.md) | Optional export metadata for tracking when and how the bundle was exported. |
| <a id="metadata"></a> `metadata` | [`IBundleMetadata`](IBundleMetadata.md) | Metadata about the bundle including build date and integrity checksum. |
