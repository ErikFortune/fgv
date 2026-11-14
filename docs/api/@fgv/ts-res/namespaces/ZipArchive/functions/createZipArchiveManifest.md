[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-res](../../../README.md) / [ZipArchive](../README.md) / createZipArchiveManifest

# Function: createZipArchiveManifest()

> **createZipArchiveManifest**(`inputType`, `originalPath`, `archivePath`, `configPath?`): [`IZipArchiveManifest`](../namespaces/Json/interfaces/IZipArchiveManifest.md)

Create a ZIP archive manifest object

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `inputType` | `"file"` \| `"directory"` | Type of input (file or directory) |
| `originalPath` | `string` | Original file/directory path |
| `archivePath` | `string` | Path within the archive |
| `configPath?` | `string` | Optional configuration file path |

## Returns

[`IZipArchiveManifest`](../namespaces/Json/interfaces/IZipArchiveManifest.md)

ZIP archive manifest
