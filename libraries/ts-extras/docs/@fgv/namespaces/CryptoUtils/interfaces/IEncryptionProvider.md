[**@fgv/ts-extras**](../../../../README.md)

***

[@fgv/ts-extras](../../../../README.md) / [CryptoUtils](../README.md) / IEncryptionProvider

# Interface: IEncryptionProvider

High-level interface for encrypting JSON content by secret name.

This abstraction unifies two common encryption workflows:
- **KeyStore**: looks up the named secret and crypto provider from the vault
- **DirectEncryptionProvider**: uses a pre-supplied key and crypto provider,
  optionally bound to a specific secret name for safety

Callers that need to encrypt (e.g. `EditableCollection.save()`) depend on
this interface rather than on `KeyStore` directly, allowing mix-and-match.

## Methods

### encryptByName()

> **encryptByName**\<`TMetadata`\>(`secretName`, `content`, `metadata?`): `Promise`\<[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`IEncryptedFile`](IEncryptedFile.md)\<`TMetadata`\>\>\>

Encrypts JSON content under a named secret.

#### Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| `TMetadata` | [`JsonValue`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs) |

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `secretName` | `string` | Name of the secret to encrypt with |
| `content` | [`JsonValue`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs) | JSON-safe content to encrypt |
| `metadata?` | `TMetadata` | Optional unencrypted metadata to include in the encrypted file |

#### Returns

`Promise`\<[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`IEncryptedFile`](IEncryptedFile.md)\<`TMetadata`\>\>\>

Success with encrypted file structure, or Failure with error context
