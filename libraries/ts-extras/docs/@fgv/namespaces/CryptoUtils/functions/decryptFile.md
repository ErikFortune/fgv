[**@fgv/ts-extras**](../../../../README.md)

***

[@fgv/ts-extras](../../../../README.md) / [CryptoUtils](../README.md) / decryptFile

# Function: decryptFile()

> **decryptFile**\<`TPayload`\>(`file`, `key`, `cryptoProvider`, `payloadConverter?`): `Promise`\<[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`TPayload`\>\>

Decrypts an [encrypted file](../interfaces/IEncryptedFile.md) and returns the JSON content.

## Type Parameters

| Type Parameter | Default type | Description |
| ------ | ------ | ------ |
| `TPayload` *extends* [`JsonValue`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs) | [`JsonValue`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs) | Expected type of decrypted content |

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `file` | [`IEncryptedFile`](../interfaces/IEncryptedFile.md)\<`unknown`\> | The encrypted file structure |
| `key` | `Uint8Array` | The decryption key (32 bytes for AES-256) |
| `cryptoProvider` | [`ICryptoProvider`](../interfaces/ICryptoProvider.md) | [Crypto provider](../interfaces/ICryptoProvider.md) to use for decryption |
| `payloadConverter?` | [`Converter`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`TPayload`, `unknown`\> | Optional converter to validate and convert decrypted content |

## Returns

`Promise`\<[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`TPayload`\>\>

`Success` with decrypted content, or `Failure` with an error.
