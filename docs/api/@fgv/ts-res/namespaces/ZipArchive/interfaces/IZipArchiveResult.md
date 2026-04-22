[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-res](../../../README.md) / [ZipArchive](../README.md) / IZipArchiveResult

# Interface: IZipArchiveResult

Result of ZIP archive buffer creation

## Properties

| Property | Type | Description |
| ------ | ------ | ------ |
| <a id="manifest"></a> `manifest` | [`IZipArchiveManifest`](../namespaces/Json/interfaces/IZipArchiveManifest.md) | Archive manifest with metadata |
| <a id="size"></a> `size` | `number` | Total ZIP size in bytes |
| <a id="zipbuffer"></a> `zipBuffer` | `Uint8Array` | Raw ZIP data buffer |
