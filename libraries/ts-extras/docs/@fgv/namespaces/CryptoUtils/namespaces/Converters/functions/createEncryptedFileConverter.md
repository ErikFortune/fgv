[**@fgv/ts-extras**](../../../../../../README.md)

***

[@fgv/ts-extras](../../../../../../README.md) / [CryptoUtils](../../../README.md) / [Converters](../README.md) / createEncryptedFileConverter

# Function: createEncryptedFileConverter()

> **createEncryptedFileConverter**\<`TMetadata`\>(`metadataConverter?`): [`Converter`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`IEncryptedFile`](../../../interfaces/IEncryptedFile.md)\<`TMetadata`\>\>

Creates a converter for [encrypted files](../../../interfaces/IEncryptedFile.md) with optional typed metadata.

## Type Parameters

| Type Parameter | Default type | Description |
| ------ | ------ | ------ |
| `TMetadata` | [`JsonValue`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs) | Type of optional unencrypted metadata |

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `metadataConverter?` | [`Converter`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`TMetadata`, `unknown`\> | Optional converter for validating metadata field |

## Returns

[`Converter`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`IEncryptedFile`](../../../interfaces/IEncryptedFile.md)\<`TMetadata`\>\>

A converter that validates and converts encrypted file structures
