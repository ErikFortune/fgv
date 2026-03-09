[**@fgv/ts-extras**](../../../../README.md)

***

[@fgv/ts-extras](../../../../README.md) / [CryptoUtils](../README.md) / DirectEncryptionProvider

# Class: DirectEncryptionProvider

An [IEncryptionProvider](../interfaces/IEncryptionProvider.md) that uses a pre-supplied key and crypto provider.

This is useful when you have the raw encryption key from an external source
(e.g. a `SecretProvider` callback, password derivation, or a one-shot
operation) and don't want to open a full KeyStore.

Optionally bound to a specific secret name for safety: if a `boundSecretName`
is provided, calls to `encryptByName` with a different name will fail.

## Example

```typescript
const provider = DirectEncryptionProvider.create({
  cryptoProvider: nodeCryptoProvider,
  key: myKey,
  boundSecretName: 'my-collection'
}).orThrow();

const encrypted = await provider.encryptByName('my-collection', jsonContent);
```

## Implements

- [`IEncryptionProvider`](../interfaces/IEncryptionProvider.md)

## Accessors

### boundSecretName

#### Get Signature

> **get** **boundSecretName**(): `string` \| `undefined`

The secret name this provider is bound to, if any.

##### Returns

`string` \| `undefined`

## Methods

### encryptByName()

> **encryptByName**\<`TMetadata`\>(`secretName`, `content`, `metadata?`): `Promise`\<[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`IEncryptedFile`](../interfaces/IEncryptedFile.md)\<`TMetadata`\>\>\>

Encrypts JSON content under a named secret.

#### Type Parameters

| Type Parameter | Default type | Description |
| ------ | ------ | ------ |
| `TMetadata` | [`JsonValue`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs) |  |

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `secretName` | `string` | Name of the secret to encrypt with |
| `content` | [`JsonValue`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-json-base/docs) | JSON-safe content to encrypt |
| `metadata?` | `TMetadata` | Optional unencrypted metadata to include in the encrypted file |

#### Returns

`Promise`\<[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`IEncryptedFile`](../interfaces/IEncryptedFile.md)\<`TMetadata`\>\>\>

Success with encrypted file structure, or Failure with error context

#### Implementation of

[`IEncryptionProvider`](../interfaces/IEncryptionProvider.md).[`encryptByName`](../interfaces/IEncryptionProvider.md#encryptbyname)

***

### create()

> `static` **create**(`params`): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`DirectEncryptionProvider`\>

Creates a new DirectEncryptionProvider.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `params` | [`IDirectEncryptionProviderParams`](../interfaces/IDirectEncryptionProviderParams.md) | Provider configuration |

#### Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`DirectEncryptionProvider`\>

Success with provider, or Failure if parameters are invalid
