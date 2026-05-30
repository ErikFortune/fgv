[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-res](../../../README.md) / [ZipArchive](../README.md) / ZipArchiveLoader

# Class: ZipArchiveLoader

ZIP archive loader extending ts-extras foundation

## Constructors

### Constructor

> **new ZipArchiveLoader**(): `ZipArchiveLoader`

#### Returns

`ZipArchiveLoader`

## Methods

### loadFromBuffer()

> **loadFromBuffer**(`buffer`, `options`, `onProgress?`): `Promise`\<[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<[`IZipArchiveLoadResult`](../interfaces/IZipArchiveLoadResult.md)\>\>

Load ZIP archive from ArrayBuffer (Universal)

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `buffer` | `ArrayBuffer` | ZIP data buffer |
| `options` | [`IZipArchiveLoadOptions`](../interfaces/IZipArchiveLoadOptions.md) | Loading options |
| `onProgress?` | [`ZipArchiveProgressCallback`](../type-aliases/ZipArchiveProgressCallback.md) | Optional progress callback |

#### Returns

`Promise`\<[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<[`IZipArchiveLoadResult`](../interfaces/IZipArchiveLoadResult.md)\>\>

Result containing loaded archive data

***

### loadFromFile()

> **loadFromFile**(`file`, `options`, `onProgress?`): `Promise`\<[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<[`IZipArchiveLoadResult`](../interfaces/IZipArchiveLoadResult.md)\>\>

Load ZIP archive from File object (Browser)

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `file` | `File` | File object from file input |
| `options` | [`IZipArchiveLoadOptions`](../interfaces/IZipArchiveLoadOptions.md) | Loading options |
| `onProgress?` | [`ZipArchiveProgressCallback`](../type-aliases/ZipArchiveProgressCallback.md) | Optional progress callback |

#### Returns

`Promise`\<[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<[`IZipArchiveLoadResult`](../interfaces/IZipArchiveLoadResult.md)\>\>

Result containing loaded archive data
