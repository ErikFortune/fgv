[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-res](../../../README.md) / [ZipArchive](../README.md) / IZipArchiveLoadResult

# Interface: IZipArchiveLoadResult

Result of ZIP archive loading

## Properties

| Property | Type | Description |
| ------ | ------ | ------ |
| <a id="config"></a> `config` | [`ISystemConfiguration`](../../Config/namespaces/Model/interfaces/ISystemConfiguration.md) \| `undefined` | Loaded configuration |
| <a id="directory"></a> `directory` | [`IImportedDirectory`](../namespaces/Json/interfaces/IImportedDirectory.md) \| `undefined` | Directory structure if available |
| <a id="files"></a> `files` | [`IImportedFile`](../namespaces/Json/interfaces/IImportedFile.md)[] | All files extracted from the archive |
| <a id="manifest"></a> `manifest` | [`IZipArchiveManifest`](../namespaces/Json/interfaces/IZipArchiveManifest.md) \| `undefined` | Parsed archive manifest |
