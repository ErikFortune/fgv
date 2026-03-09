[**@fgv/ts-extras**](../../../../README.md)

***

[@fgv/ts-extras](../../../../README.md) / [CryptoUtils](../README.md) / tryDecryptFile

# Function: tryDecryptFile()

> **tryDecryptFile**\<`TPayload`, `TMetadata`\>(`json`, `key`, `cryptoProvider`, `payloadConverter?`, `metadataConverter?`): `Promise`\<[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`TPayload`\>\>

Attempts to parse and decrypt a JSON object as an [encrypted file](../interfaces/IEncryptedFile.md).

## Type Parameters

| Type Parameter | Default type | Description |
| ------ | ------ | ------ |
| `TPayload` *extends* [`JsonValue`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs) | [`JsonValue`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs) | Expected type of decrypted content |
| `TMetadata` | [`JsonValue`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs) | Type of optional unencrypted metadata |

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `json` | [`JsonValue`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs) | JSON object that may be an encrypted file |
| `key` | `Uint8Array` | The decryption key (32 bytes for AES-256) |
| `cryptoProvider` | [`ICryptoProvider`](../interfaces/ICryptoProvider.md) | [Crypto provider](../interfaces/ICryptoProvider.md) to use for decryption |
| `payloadConverter?` | [`Converter`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`TPayload`, `unknown`\> | Optional converter to validate and convert decrypted content |
| `metadataConverter?` | [`Converter`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`TMetadata`, `unknown`\> | Optional converter to validate metadata before decryption |

## Returns

`Promise`\<[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`TPayload`\>\>

`Success` with decrypted content, or `Failure` with an error (including if not encrypted)
