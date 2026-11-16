[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-extras](../../../README.md) / [ZipFileTree](../README.md) / createZipFromFiles

# Function: createZipFromFiles()

> **createZipFromFiles**(`files`, `options?`): [`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<`Uint8Array`\<`ArrayBufferLike`\>\>

Creates a zip file from an array of files whose contents are either text or raw bytes.

## Parameters

| Parameter | Type |
| ------ | ------ |
| `files` | readonly [`IZipFile`](../interfaces/IZipFile.md)[] |
| `options?` | [`ICreateZipOptions`](../interfaces/ICreateZipOptions.md) |

## Returns

[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<`Uint8Array`\<`ArrayBufferLike`\>\>

## Remarks

String contents are encoded as UTF-8; `Uint8Array` contents are stored verbatim, so
arbitrary binary payloads round-trip through the archive unchanged.
