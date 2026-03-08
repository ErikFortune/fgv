[**@fgv/ts-extras**](../../../../README.md)

***

[@fgv/ts-extras](../../../../README.md) / [CryptoUtils](../README.md) / IEncryptionConfig

# Interface: IEncryptionConfig

Configuration for encrypted file handling during loading.

## Properties

| Property | Modifier | Type | Description |
| ------ | ------ | ------ | ------ |
| <a id="cryptoprovider"></a> `cryptoProvider` | `readonly` | [`ICryptoProvider`](ICryptoProvider.md) | Crypto provider implementation (Node.js or browser). |
| <a id="ondecryptionerror"></a> `onDecryptionError?` | `readonly` | [`EncryptedFileErrorMode`](../type-aliases/EncryptedFileErrorMode.md) | Behavior when decryption fails (default: 'fail'). |
| <a id="onmissingkey"></a> `onMissingKey?` | `readonly` | [`EncryptedFileErrorMode`](../type-aliases/EncryptedFileErrorMode.md) | Behavior when decryption key is missing (default: 'fail'). |
| <a id="secretprovider"></a> `secretProvider?` | `readonly` | [`SecretProvider`](../type-aliases/SecretProvider.md) | Alternative: dynamic secret provider function. Called when a secret is not found in the secrets array. |
| <a id="secrets"></a> `secrets?` | `readonly` | readonly [`INamedSecret`](INamedSecret.md)[] | Named secrets available for decryption. |
