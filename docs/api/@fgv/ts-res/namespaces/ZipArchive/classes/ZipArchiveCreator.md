[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-res](../../../README.md) / [ZipArchive](../README.md) / ZipArchiveCreator

# Class: ZipArchiveCreator

ZIP archive creator using fflate for universal compatibility

## Constructors

### Constructor

> **new ZipArchiveCreator**(): `ZipArchiveCreator`

#### Returns

`ZipArchiveCreator`

## Methods

### createFromBuffer()

> **createFromBuffer**(`options`, `onProgress?`): `Promise`\<[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<[`IZipArchiveResult`](../interfaces/IZipArchiveResult.md)\>\>

Create a ZIP archive buffer from a supplied buffer

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `options` | [`ZipArchiveOptions`](../type-aliases/ZipArchiveOptions.md) | Input paths and configuration |
| `onProgress?` | [`ZipArchiveProgressCallback`](../type-aliases/ZipArchiveProgressCallback.md) | Optional progress callback |

#### Returns

`Promise`\<[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<[`IZipArchiveResult`](../interfaces/IZipArchiveResult.md)\>\>

Result containing ZIP buffer and manifest
