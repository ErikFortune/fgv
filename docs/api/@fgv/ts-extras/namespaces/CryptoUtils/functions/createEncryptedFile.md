[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-extras](../../../README.md) / [CryptoUtils](../README.md) / createEncryptedFile

# Function: createEncryptedFile()

> **createEncryptedFile**\<`TMetadata`\>(`params`): `Promise`\<[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<[`IEncryptedFile`](../interfaces/IEncryptedFile.md)\<`TMetadata`\>\>\>

Creates an [encrypted file](../interfaces/IEncryptedFile.md) from JSON content.

## Type Parameters

| Type Parameter | Default type | Description |
| ------ | ------ | ------ |
| `TMetadata` | [`JsonValue`](../../../../ts-res-ui-components/type-aliases/JsonValue.md) | Type of optional unencrypted metadata |

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `params` | [`ICreateEncryptedFileParams`](../interfaces/ICreateEncryptedFileParams.md)\<`TMetadata`\> | Encryption parameters |

## Returns

`Promise`\<[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<[`IEncryptedFile`](../interfaces/IEncryptedFile.md)\<`TMetadata`\>\>\>

`Success` with encrypted file structure, or `Failure` with an error.
