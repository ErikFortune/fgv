[**@fgv/ts-extras**](../../../../README.md)

***

[@fgv/ts-extras](../../../../README.md) / [CryptoUtils](../README.md) / createEncryptedFile

# Function: createEncryptedFile()

> **createEncryptedFile**\<`TMetadata`\>(`params`): `Promise`\<[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`IEncryptedFile`](../interfaces/IEncryptedFile.md)\<`TMetadata`\>\>\>

Creates an [encrypted file](../interfaces/IEncryptedFile.md) from JSON content.

## Type Parameters

| Type Parameter | Default type | Description |
| ------ | ------ | ------ |
| `TMetadata` | [`JsonValue`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs) | Type of optional unencrypted metadata |

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `params` | [`ICreateEncryptedFileParams`](../interfaces/ICreateEncryptedFileParams.md)\<`TMetadata`\> | Encryption parameters |

## Returns

`Promise`\<[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`IEncryptedFile`](../interfaces/IEncryptedFile.md)\<`TMetadata`\>\>\>

`Success` with encrypted file structure, or `Failure` with an error.
