[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-extras](../../../README.md) / [ZipFileTree](../README.md) / IZipFile

# Interface: IZipFile

Interface for a file to be added to a zip file, whose contents are either text or
raw bytes.

## Remarks

String contents are encoded as UTF-8; `Uint8Array` contents are stored verbatim.

## Properties

| Property | Modifier | Type |
| ------ | ------ | ------ |
| <a id="property-contents"></a> `contents` | `readonly` | `string` \| `Uint8Array`\<`ArrayBufferLike`\> |
| <a id="property-path"></a> `path` | `readonly` | `string` |
