[**@fgv/ts-extras**](../../../../../../README.md)

***

[@fgv/ts-extras](../../../../../../README.md) / [CryptoUtils](../../../README.md) / [KeyStore](../README.md) / KeyStore

# Class: KeyStore

Password-protected key store for managing encryption secrets.

The KeyStore provides a secure vault for storing named encryption keys.
The vault is encrypted at rest using a master password via PBKDF2 key derivation.

## Example

```typescript
// Create new key store
const keystore = KeyStore.create({ cryptoProvider: nodeCryptoProvider }).orThrow();
await keystore.initialize('master-password');

// Add secrets
await keystore.addSecret('my-key', { description: 'Production key' });

// Save to file
const fileContent = await keystore.save();

// Later: Open existing key store
const keystore2 = KeyStore.open({
  cryptoProvider: nodeCryptoProvider,
  keystoreFile: fileContent.value
}).orThrow();
await keystore2.unlock('master-password');

// Use as secret provider for encrypted file loading
const encryptionConfig = keystore2.getEncryptionConfig().orThrow();
```

## Implements

- [`IEncryptionProvider`](../../../interfaces/IEncryptionProvider.md)

## Accessors

### cryptoProvider

#### Get Signature

> **get** **cryptoProvider**(): [`ICryptoProvider`](../../../interfaces/ICryptoProvider.md)

Gets the crypto provider used by this key store.
Available regardless of lock state.

##### Returns

[`ICryptoProvider`](../../../interfaces/ICryptoProvider.md)

***

### isDirty

#### Get Signature

> **get** **isDirty**(): `boolean`

Checks if there are unsaved changes.

##### Returns

`boolean`

***

### isNew

#### Get Signature

> **get** **isNew**(): `boolean`

Whether this is a newly created key store (not opened from a file).
A new key store must be initialized with a password before use.
An opened key store must be unlocked with the existing password.

##### Returns

`boolean`

***

### isUnlocked

#### Get Signature

> **get** **isUnlocked**(): `boolean`

Checks if the key store is unlocked.

##### Returns

`boolean`

***

### state

#### Get Signature

> **get** **state**(): [`KeyStoreLockState`](../type-aliases/KeyStoreLockState.md)

Gets the current lock state.

##### Returns

[`KeyStoreLockState`](../type-aliases/KeyStoreLockState.md)

## Methods

### addSecret()

> **addSecret**(`name`, `options?`): `Promise`\<[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`IAddSecretResult`](../interfaces/IAddSecretResult.md)\>\>

Adds a new secret with a randomly generated key.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `name` | `string` | Unique name for the secret |
| `options?` | [`IAddSecretOptions`](../interfaces/IAddSecretOptions.md) | Optional description |

#### Returns

`Promise`\<[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`IAddSecretResult`](../interfaces/IAddSecretResult.md)\>\>

Success with the generated entry, Failure if locked or name invalid

***

### addSecretFromPassword()

> **addSecretFromPassword**(`name`, `password`, `options?`): `Promise`\<[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`IAddSecretFromPasswordResult`](../interfaces/IAddSecretFromPasswordResult.md)\>\>

Adds a secret derived from a password using PBKDF2.

Generates a random salt, derives a 32-byte AES-256 key from the password,
and stores it in the vault. Returns the key derivation parameters so they
can be stored alongside encrypted files, enabling decryption with just the
password (without unlocking the keystore).

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `name` | `string` | Unique name for the secret |
| `password` | `string` | Password to derive the key from |
| `options?` | [`IAddSecretFromPasswordOptions`](../interfaces/IAddSecretFromPasswordOptions.md) | Optional description, iterations, replace flag |

#### Returns

`Promise`\<[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`IAddSecretFromPasswordResult`](../interfaces/IAddSecretFromPasswordResult.md)\>\>

Success with entry and keyDerivation params, Failure if locked or invalid

***

### changePassword()

> **changePassword**(`currentPassword`, `newPassword`): `Promise`\<[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`KeyStore`\>\>

Changes the master password.
Re-encrypts the vault with the new password-derived key.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `currentPassword` | `string` | Current master password (for verification) |
| `newPassword` | `string` | New master password |

#### Returns

`Promise`\<[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`KeyStore`\>\>

Success when password changed, Failure if locked or current password incorrect

***

### encryptByName()

> **encryptByName**\<`TMetadata`\>(`secretName`, `content`, `metadata?`): `Promise`\<[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`IEncryptedFile`](../../../interfaces/IEncryptedFile.md)\<`TMetadata`\>\>\>

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

`Promise`\<[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`IEncryptedFile`](../../../interfaces/IEncryptedFile.md)\<`TMetadata`\>\>\>

Success with encrypted file structure, or Failure with error context

#### Implementation of

[`IEncryptionProvider`](../../../interfaces/IEncryptionProvider.md).[`encryptByName`](../../../interfaces/IEncryptionProvider.md#encryptbyname)

***

### getApiKey()

> **getApiKey**(`name`): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`string`\>

Retrieves an API key string by name.
Only works for secrets with type `'api-key'`.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `name` | `string` | Name of the secret |

#### Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`string`\>

Success with the API key string, Failure if not found, locked, or wrong type

***

### getEncryptionConfig()

> **getEncryptionConfig**(): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`Pick`\<[`IEncryptionConfig`](../../../interfaces/IEncryptionConfig.md), `"cryptoProvider"` \| `"secretProvider"`\>\>

Creates a partial IEncryptionConfig using this key store as the secret source.

#### Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`Pick`\<[`IEncryptionConfig`](../../../interfaces/IEncryptionConfig.md), `"cryptoProvider"` \| `"secretProvider"`\>\>

Partial config that can be spread into a full IEncryptionConfig

***

### getSecret()

> **getSecret**(`name`): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`IKeyStoreSecretEntry`](../interfaces/IKeyStoreSecretEntry.md)\>

Gets a secret by name.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `name` | `string` | Name of the secret |

#### Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`IKeyStoreSecretEntry`](../interfaces/IKeyStoreSecretEntry.md)\>

Success with secret entry, Failure if not found or locked

***

### getSecretProvider()

> **getSecretProvider**(): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`SecretProvider`](../../../type-aliases/SecretProvider.md)\>

Creates a SecretProvider function for use with IEncryptionConfig.
The returned function looks up secrets from this key store.

#### Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`SecretProvider`](../../../type-aliases/SecretProvider.md)\>

Success with SecretProvider, Failure if locked

***

### hasSecret()

> **hasSecret**(`name`): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`boolean`\>

Checks if a secret exists.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `name` | `string` | Name of the secret |

#### Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`boolean`\>

Success with boolean, Failure if locked

***

### importApiKey()

> **importApiKey**(`name`, `apiKey`, `options?`): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`IAddSecretResult`](../interfaces/IAddSecretResult.md)\>

Imports an API key string into the vault.
The string is UTF-8 encoded and stored with type `'api-key'`.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `name` | `string` | Unique name for the secret |
| `apiKey` | `string` | The API key string |
| `options?` | [`IImportSecretOptions`](../interfaces/IImportSecretOptions.md) | Optional description, whether to replace existing |

#### Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`IAddSecretResult`](../interfaces/IAddSecretResult.md)\>

Success with entry, Failure if locked, empty, or exists and !replace

***

### importSecret()

> **importSecret**(`name`, `key`, `options?`): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`IAddSecretResult`](../interfaces/IAddSecretResult.md)\>

Imports an existing secret key.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `name` | `string` | Unique name for the secret |
| `key` | `Uint8Array` | The 32-byte AES-256 key |
| `options?` | [`IImportSecretOptions`](../interfaces/IImportSecretOptions.md) | Optional description, whether to replace existing |

#### Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`IAddSecretResult`](../interfaces/IAddSecretResult.md)\>

Success with entry, Failure if locked, key invalid, or exists and !replace

***

### initialize()

> **initialize**(`password`): `Promise`\<[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`KeyStore`\>\>

Initializes a new key store with the master password.
Generates a random salt for key derivation.
Only valid for newly created (not opened) key stores.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `password` | `string` | The master password |

#### Returns

`Promise`\<[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`KeyStore`\>\>

Success with this instance when initialized, Failure if already initialized or opened

***

### listSecrets()

> **listSecrets**(): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<readonly `string`[]\>

Lists all secret names in the key store.

#### Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<readonly `string`[]\>

Success with array of secret names, Failure if locked

***

### listSecretsByType()

> **listSecretsByType**(`type`): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<readonly `string`[]\>

Lists secret names filtered by type.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `type` | [`KeyStoreSecretType`](../type-aliases/KeyStoreSecretType.md) | The secret type to filter by |

#### Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<readonly `string`[]\>

Success with array of matching secret names, Failure if locked

***

### lock()

> **lock**(`force?`): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`KeyStore`\>

Locks the key store, clearing all secrets from memory.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `force?` | `boolean` | If true, discards unsaved changes |

#### Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`KeyStore`\>

Success when locked, Failure if unsaved changes and !force

***

### removeSecret()

> **removeSecret**(`name`): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`IKeyStoreSecretEntry`](../interfaces/IKeyStoreSecretEntry.md)\>

Removes a secret by name.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `name` | `string` | Name of the secret to remove |

#### Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`IKeyStoreSecretEntry`](../interfaces/IKeyStoreSecretEntry.md)\>

Success with removed entry, Failure if not found or locked

***

### renameSecret()

> **renameSecret**(`oldName`, `newName`): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`IKeyStoreSecretEntry`](../interfaces/IKeyStoreSecretEntry.md)\>

Renames a secret.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `oldName` | `string` | Current name |
| `newName` | `string` | New name |

#### Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`IKeyStoreSecretEntry`](../interfaces/IKeyStoreSecretEntry.md)\>

Success with updated entry, Failure if source not found, target exists, or locked

***

### save()

> **save**(`password`): `Promise`\<[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`IKeyStoreFile`](../interfaces/IKeyStoreFile.md)\>\>

Saves the key store, returning the encrypted file content.
Requires the master password to encrypt.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `password` | `string` | The master password |

#### Returns

`Promise`\<[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`IKeyStoreFile`](../interfaces/IKeyStoreFile.md)\>\>

Success with IKeyStoreFile, Failure if locked

***

### unlock()

> **unlock**(`password`): `Promise`\<[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`KeyStore`\>\>

Unlocks an existing key store with the master password.
Decrypts the vault and loads secrets into memory.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `password` | `string` | The master password |

#### Returns

`Promise`\<[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`KeyStore`\>\>

Success with this instance when unlocked, Failure if password incorrect

***

### create()

> `static` **create**(`params`): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`KeyStore`\>

Creates a new, empty key store.
Call `initialize(password)` to set the master password.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `params` | [`IKeyStoreCreateParams`](../interfaces/IKeyStoreCreateParams.md) | Creation parameters |

#### Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`KeyStore`\>

Success with new KeyStore instance, or Failure if parameters invalid

***

### open()

> `static` **open**(`params`): [`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`KeyStore`\>

Opens an existing encrypted key store.
Call `unlock(password)` to decrypt and access secrets.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `params` | [`IKeyStoreOpenParams`](../interfaces/IKeyStoreOpenParams.md) | Open parameters including the encrypted file |

#### Returns

[`Result`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`KeyStore`\>

Success with KeyStore instance, or Failure if file format invalid
