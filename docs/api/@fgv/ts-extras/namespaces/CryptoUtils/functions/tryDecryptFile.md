[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-extras](../../../README.md) / [CryptoUtils](../README.md) / tryDecryptFile

# Function: tryDecryptFile()

> **tryDecryptFile**\<`TPayload`, `TMetadata`\>(`json`, `key`, `cryptoProvider`, `payloadConverter?`, `metadataConverter?`): `Promise`\<[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<`TPayload`\>\>

Attempts to parse and decrypt a JSON object as an [encrypted file](../interfaces/IEncryptedFile.md).

## Type Parameters

| Type Parameter | Default type | Description |
| ------ | ------ | ------ |
| `TPayload` *extends* [`JsonValue`](../../../../ts-res-ui-components/type-aliases/JsonValue.md) | [`JsonValue`](../../../../ts-res-ui-components/type-aliases/JsonValue.md) | Expected type of decrypted content |
| `TMetadata` | [`JsonValue`](../../../../ts-res-ui-components/type-aliases/JsonValue.md) | Type of optional unencrypted metadata |

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `json` | [`JsonValue`](../../../../ts-res-ui-components/type-aliases/JsonValue.md) | JSON object that may be an encrypted file |
| `key` | `Uint8Array` | The decryption key (32 bytes for AES-256) |
| `cryptoProvider` | [`ICryptoProvider`](../interfaces/ICryptoProvider.md) | [Crypto provider](../interfaces/ICryptoProvider.md) to use for decryption |
| `payloadConverter?` | [`Converter`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`TPayload`, `unknown`\> | Optional converter to validate and convert decrypted content |
| `metadataConverter?` | [`Converter`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`TMetadata`, `unknown`\> | Optional converter to validate metadata before decryption |

## Returns

`Promise`\<[`Result`](../../../../ts-res-ui-components/type-aliases/Result.md)\<`TPayload`\>\>

`Success` with decrypted content, or `Failure` with an error (including if not encrypted)
