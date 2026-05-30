[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-res](../../../README.md) / [ZipArchive](../README.md) / ZipArchiveProgressCallback

# Type Alias: ZipArchiveProgressCallback()

> **ZipArchiveProgressCallback** = (`stage`, `progress`, `details`) => `void`

Progress callback for ZIP operations

## Parameters

| Parameter | Type |
| ------ | ------ |
| `stage` | `"reading-file"` \| `"parsing-zip"` \| `"loading-manifest"` \| `"loading-config"` \| `"extracting-files"` \| `"processing-resources"` \| `"creating-zip"` |
| `progress` | `number` |
| `details` | `string` |

## Returns

`void`
