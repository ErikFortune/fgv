[**@fgv Monorepo API Documentation**](../../../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../../../README.md) / [@fgv/ts-web-extras-argon2](../../../../../README.md) / [CryptoUtils](../../../README.md) / [KeyStore](../README.md) / KeyStore

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

## Remarks

SECURITY — private-key escrow. By default an asymmetric keypair's private
key lives only in the per-device [CryptoUtils.KeyStore.IPrivateKeyStorage](../interfaces/IPrivateKeyStorage.md)
backend; the vault carries only the public JWK, so a vault recovered on a new
device reconstitutes with no private keys (a lost device is a lost identity).
`addKeyPair(name, { escrow: true })` opts into carrying an encrypted private-key
copy inside the vault ciphertext, so the vault file plus the master password can
recover the identity on a fresh device via `getKeyPair(name, { rehydrate: true })`.

When escrow is used, **the master password becomes the sole gate** protecting a
private signing/decryption key that was previously unrecoverable from the vault.
Configure escrow-bearing stores with a strong KDF — an Argon2id-derived master
key or a high-iteration PBKDF2 count — and treat the vault file accordingly.

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

### addKeyPair()

> **addKeyPair**(`name`, `options`): `Promise`\<[`Result`](../../../../../../ts-res-ui-components/type-aliases/Result.md)\<[`IAddKeyPairResult`](../interfaces/IAddKeyPairResult.md)\>\>

Adds a new asymmetric keypair to the vault. Storage-first: the private key
is stored under a freshly-minted `id` before the public-key vault entry is
committed. If the storage call fails, no vault entry is written and the
operation returns Failure.

When `replace: true` displaces an existing entry (asymmetric or symmetric),
a fresh `id` is minted; the displaced entry's resources are released
best-effort. Failure of the storage delete is reported via `warning` on the
result but does not roll back the replacement.

Requires a [CryptoUtils.KeyStore.IPrivateKeyStorage](../interfaces/IPrivateKeyStorage.md) backend
supplied at construction.

Extractability of the generated private key defaults to the storage
backend's [CryptoUtils.KeyStore.IPrivateKeyStorage.supportsNonExtractable](../interfaces/IPrivateKeyStorage.md#property-supportsnonextractable).
`options.extractable` overrides that default for this key only; requesting
`extractable: false` against a backend that cannot store non-extractable
keys fails loudly rather than silently generating an extractable key.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `name` | `string` | Unique name for the entry |
| `options` | [`IAddKeyPairOptions`](../interfaces/IAddKeyPairOptions.md) | Algorithm, optional description, replace flag, extractable override |

#### Returns

`Promise`\<[`Result`](../../../../../../ts-res-ui-components/type-aliases/Result.md)\<[`IAddKeyPairResult`](../interfaces/IAddKeyPairResult.md)\>\>

Success with the new entry, Failure if locked, no provider, storage write failed,
or the requested extractability cannot be honored by the backend

***

### addSecret()

> **addSecret**(`name`, `options?`): `Promise`\<[`Result`](../../../../../../ts-res-ui-components/type-aliases/Result.md)\<[`IAddSecretResult`](../interfaces/IAddSecretResult.md)\>\>

Adds a new secret with a randomly generated key.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `name` | `string` | Unique name for the secret |
| `options?` | [`IAddSecretOptions`](../interfaces/IAddSecretOptions.md) | Optional description |

#### Returns

`Promise`\<[`Result`](../../../../../../ts-res-ui-components/type-aliases/Result.md)\<[`IAddSecretResult`](../interfaces/IAddSecretResult.md)\>\>

Success with the generated entry, Failure if locked or name invalid

***

### addSecretFromPassword()

> **addSecretFromPassword**(`name`, `password`, `options?`): `Promise`\<[`Result`](../../../../../../ts-res-ui-components/type-aliases/Result.md)\<[`IAddSecretFromPasswordResult`](../interfaces/IAddSecretFromPasswordResult.md)\>\>

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

`Promise`\<[`Result`](../../../../../../ts-res-ui-components/type-aliases/Result.md)\<[`IAddSecretFromPasswordResult`](../interfaces/IAddSecretFromPasswordResult.md)\>\>

Success with entry and keyDerivation params, Failure if locked or invalid

***

### addSecretFromPasswordArgon2id()

> **addSecretFromPasswordArgon2id**(`name`, `password`, `argon2idProvider`, `options?`): `Promise`\<[`Result`](../../../../../../ts-res-ui-components/type-aliases/Result.md)\<[`IAddSecretFromPasswordResult`](../interfaces/IAddSecretFromPasswordResult.md)\>\>

Adds a secret derived from a password using Argon2id (RFC 9106).

The Argon2id provider must be supplied explicitly; the KeyStore does not
hold one by default (consumers opt in by depending on the argon2 package).

Returns the key derivation parameters so callers can store them alongside
encrypted artifacts, enabling future re-derivation and verification.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `name` | `string` | Unique name for the secret |
| `password` | `string` | Password or passphrase |
| `argon2idProvider` | [`IArgon2idProvider`](../../../interfaces/IArgon2idProvider.md) | Argon2id provider (Node or Browser implementation) |
| `options?` | [`IAddSecretFromPasswordArgon2idOptions`](../interfaces/IAddSecretFromPasswordArgon2idOptions.md) | Optional: Argon2id params (defaults to ARGON2ID_OWASP_MIN), description, replace flag |

#### Returns

`Promise`\<[`Result`](../../../../../../ts-res-ui-components/type-aliases/Result.md)\<[`IAddSecretFromPasswordResult`](../interfaces/IAddSecretFromPasswordResult.md)\>\>

Success with entry and keyDerivation params, Failure if locked or invalid

***

### changePassword()

> **changePassword**(`currentPassword`, `newPassword`): `Promise`\<[`Result`](../../../../../../ts-res-ui-components/type-aliases/Result.md)\<`KeyStore_2`\>\>

Changes the master password.
Re-encrypts the vault with the new password-derived key.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `currentPassword` | `string` | Current master password (for verification) |
| `newPassword` | `string` | New master password |

#### Returns

`Promise`\<[`Result`](../../../../../../ts-res-ui-components/type-aliases/Result.md)\<`KeyStore_2`\>\>

Success when password changed, Failure if locked or current password incorrect

***

### encryptByName()

> **encryptByName**\<`TMetadata`\>(`secretName`, `content`, `metadata?`): `Promise`\<[`Result`](../../../../../../ts-res-ui-components/type-aliases/Result.md)\<[`IEncryptedFile`](../../../interfaces/IEncryptedFile.md)\<`TMetadata`\>\>\>

Encrypts JSON content under a named secret.

#### Type Parameters

| Type Parameter | Default type |
| ------ | ------ |
| <a id="type-parameter-tmetadata"></a> `TMetadata` | [`JsonValue`](../../../../../../ts-res-ui-components/type-aliases/JsonValue.md) |

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `secretName` | `string` | Name of the secret to encrypt with |
| `content` | [`JsonValue`](../../../../../../ts-res-ui-components/type-aliases/JsonValue.md) | JSON-safe content to encrypt |
| `metadata?` | `TMetadata` | Optional unencrypted metadata to include in the encrypted file |

#### Returns

`Promise`\<[`Result`](../../../../../../ts-res-ui-components/type-aliases/Result.md)\<[`IEncryptedFile`](../../../interfaces/IEncryptedFile.md)\<`TMetadata`\>\>\>

Success with encrypted file structure, or Failure with error context

#### Implementation of

[`IEncryptionProvider`](../../../interfaces/IEncryptionProvider.md).[`encryptByName`](../../../interfaces/IEncryptionProvider.md#encryptbyname)

***

### getApiKey()

> **getApiKey**(`name`): [`Result`](../../../../../../ts-res-ui-components/type-aliases/Result.md)\<`string`\>

Retrieves an API key string by name.
Only works for secrets with type `'api-key'`.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `name` | `string` | Name of the secret |

#### Returns

[`Result`](../../../../../../ts-res-ui-components/type-aliases/Result.md)\<`string`\>

Success with the API key string, Failure if not found, locked, or wrong type

***

### getEncryptionConfig()

> **getEncryptionConfig**(): [`Result`](../../../../../../ts-res-ui-components/type-aliases/Result.md)\<`Pick`\<[`IEncryptionConfig`](../../../interfaces/IEncryptionConfig.md), `"secretProvider"` \| `"cryptoProvider"`\>\>

Creates a partial IEncryptionConfig using this key store as the secret source.

#### Returns

[`Result`](../../../../../../ts-res-ui-components/type-aliases/Result.md)\<`Pick`\<[`IEncryptionConfig`](../../../interfaces/IEncryptionConfig.md), `"secretProvider"` \| `"cryptoProvider"`\>\>

Partial config that can be spread into a full IEncryptionConfig

***

### getKeyPair()

> **getKeyPair**(`name`, `options?`): `Promise`\<[`Result`](../../../../../../ts-res-ui-components/type-aliases/Result.md)\<\{ `privateKey`: `CryptoKey`; `publicKey`: `CryptoKey`; \}\>\>

Retrieves the keypair for an asymmetric-keypair entry. The private key is
loaded from [CryptoUtils.KeyStore.IPrivateKeyStorage](../interfaces/IPrivateKeyStorage.md) on every call —
the keystore never caches private `CryptoKey` references between calls.
The public key is re-imported from the vault's JWK so callers always
receive a `CryptoKey` rather than the JWK form.

With `options.rehydrate: true`, if the storage backend holds no blob for
the entry's `id` and the entry carries an `escrowedPrivateKeyJwk` (see
`addKeyPair(name, { escrow: true })`), the escrowed JWK is imported and
stored under the entry's `id` before being returned — recovering the
private key on a fresh device from the vault plus master password. This is
fill-a-gap only: an existing storage blob is never overwritten.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `name` | `string` | Name of the entry |
| `options?` | [`IGetKeyPairOptions`](../interfaces/IGetKeyPairOptions.md) | Optional [CryptoUtils.KeyStore.IGetKeyPairOptions](../interfaces/IGetKeyPairOptions.md) (currently the `rehydrate` escrow-recovery flag). |

#### Returns

`Promise`\<[`Result`](../../../../../../ts-res-ui-components/type-aliases/Result.md)\<\{ `privateKey`: `CryptoKey`; `publicKey`: `CryptoKey`; \}\>\>

Success with `{ publicKey, privateKey }`, Failure if not found,
locked, wrong type, no provider, or storage load (and any escrow
rehydration) failed.

***

### getPublicKeyJwk()

> **getPublicKeyJwk**(`name`): [`Result`](../../../../../../ts-res-ui-components/type-aliases/Result.md)\<`JsonWebKey`\>

Returns the public-key JWK for an asymmetric-keypair entry.
Available without [CryptoUtils.KeyStore.IPrivateKeyStorage](../interfaces/IPrivateKeyStorage.md) since the
public key lives in the vault metadata directly.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `name` | `string` | Name of the entry |

#### Returns

[`Result`](../../../../../../ts-res-ui-components/type-aliases/Result.md)\<`JsonWebKey`\>

Success with the JWK, Failure if not found, locked, or wrong type

***

### getSecret()

> **getSecret**(`name`): [`Result`](../../../../../../ts-res-ui-components/type-aliases/Result.md)\<[`IKeyStoreEntry`](../type-aliases/IKeyStoreEntry.md)\>

Gets a secret by name. Returns the [discriminated union](../type-aliases/IKeyStoreEntry.md)
— callers must check `entry.type` before accessing `key`/`id` since asymmetric
entries carry no raw key material.

SECURITY: for an escrow-enabled asymmetric-keypair entry the returned object
carries `escrowedPrivateKeyJwk` in cleartext (same custody class as
`publicKeyJwk`, gated by the same unlock) — do not log or serialize a
`getSecret()` result casually.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `name` | `string` | Name of the secret |

#### Returns

[`Result`](../../../../../../ts-res-ui-components/type-aliases/Result.md)\<[`IKeyStoreEntry`](../type-aliases/IKeyStoreEntry.md)\>

Success with secret entry, Failure if not found or locked

***

### getSecretBytes()

> **getSecretBytes**(`name`): [`Result`](../../../../../../ts-res-ui-components/type-aliases/Result.md)\<`Uint8Array`\<`ArrayBufferLike`\>\>

Retrieves the raw stored bytes for a symmetric entry, returned verbatim
(never UTF-8 decoded). Intended for `'opaque'` entries but works for any
symmetric type; asymmetric-keypair entries carry no raw key material and
are rejected.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `name` | `string` | Name of the secret |

#### Returns

[`Result`](../../../../../../ts-res-ui-components/type-aliases/Result.md)\<`Uint8Array`\<`ArrayBufferLike`\>\>

Success with a copy of the stored bytes, Failure if not found,
locked, or the entry is asymmetric

***

### getSecretProvider()

> **getSecretProvider**(): [`Result`](../../../../../../ts-res-ui-components/type-aliases/Result.md)\<[`SecretProvider`](../../../type-aliases/SecretProvider.md)\>

Creates a SecretProvider function for use with IEncryptionConfig.
The returned function looks up secrets from this key store.

#### Returns

[`Result`](../../../../../../ts-res-ui-components/type-aliases/Result.md)\<[`SecretProvider`](../../../type-aliases/SecretProvider.md)\>

Success with SecretProvider, Failure if locked

***

### hasSecret()

> **hasSecret**(`name`): [`Result`](../../../../../../ts-res-ui-components/type-aliases/Result.md)\<`boolean`\>

Checks if a secret exists.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `name` | `string` | Name of the secret |

#### Returns

[`Result`](../../../../../../ts-res-ui-components/type-aliases/Result.md)\<`boolean`\>

Success with boolean, Failure if locked

***

### importApiKey()

> **importApiKey**(`name`, `apiKey`, `options?`): `Promise`\<[`Result`](../../../../../../ts-res-ui-components/type-aliases/Result.md)\<[`IAddSecretResult`](../interfaces/IAddSecretResult.md)\>\>

Imports an API key string into the vault.
The string is UTF-8 encoded and stored with type `'api-key'`.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `name` | `string` | Unique name for the secret |
| `apiKey` | `string` | The API key string |
| `options?` | [`IImportSecretOptions`](../interfaces/IImportSecretOptions.md) | Optional description, whether to replace existing |

#### Returns

`Promise`\<[`Result`](../../../../../../ts-res-ui-components/type-aliases/Result.md)\<[`IAddSecretResult`](../interfaces/IAddSecretResult.md)\>\>

Success with entry, Failure if locked, empty, or exists and !replace

***

### importSecret()

> **importSecret**(`name`, `key`, `options?`): `Promise`\<[`Result`](../../../../../../ts-res-ui-components/type-aliases/Result.md)\<[`IAddSecretResult`](../interfaces/IAddSecretResult.md)\>\>

Imports raw 32-byte key material into the vault.

Always validates that the key is exactly 32 bytes (AES-256). The optional
`type` field is a classification label stored with the entry; it does not
change the validation rules.  For importing UTF-8 API key strings (variable
length), use [KeyStore.importApiKey](#importapikey) instead.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `name` | `string` | Unique name for the secret |
| `key` | `Uint8Array` | The 32-byte AES-256 key material |
| `options?` | [`IImportKeyOptions`](../interfaces/IImportKeyOptions.md) | Optional type classification, description, whether to replace existing |

#### Returns

`Promise`\<[`Result`](../../../../../../ts-res-ui-components/type-aliases/Result.md)\<[`IAddSecretResult`](../interfaces/IAddSecretResult.md)\>\>

Success with entry, Failure if locked, key invalid, or exists and !replace

***

### importSecretBytes()

> **importSecretBytes**(`name`, `bytes`, `options?`): `Promise`\<[`Result`](../../../../../../ts-res-ui-components/type-aliases/Result.md)\<[`IAddSecretResult`](../interfaces/IAddSecretResult.md)\>\>

Imports arbitrary raw bytes into the vault with type `'opaque'`.

Unlike [KeyStore.importSecret](#importsecret) (which enforces a 32-byte AES-256 key)
and [KeyStore.importApiKey](#importapikey) (which UTF-8 encodes a string), this
accepts a byte buffer of any length and stores it verbatim — including
embedded NUL bytes. Use it for byte blobs that are neither a fixed-size key
nor a UTF-8 string (e.g. a serialized credential bundle), so they are not
mistyped as `'api-key'`.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `name` | `string` | Unique name for the secret |
| `bytes` | `Uint8Array` | The raw bytes to store |
| `options?` | [`IImportSecretBytesOptions`](../interfaces/IImportSecretBytesOptions.md) | Optional description, initial metadata, whether to replace existing |

#### Returns

`Promise`\<[`Result`](../../../../../../ts-res-ui-components/type-aliases/Result.md)\<[`IAddSecretResult`](../interfaces/IAddSecretResult.md)\>\>

Success with entry, Failure if locked, empty, or exists and !replace

***

### initialize()

> **initialize**(`password`): `Promise`\<[`Result`](../../../../../../ts-res-ui-components/type-aliases/Result.md)\<`KeyStore_2`\>\>

Initializes a new key store with the master password.
Generates a random salt for key derivation.
Only valid for newly created (not opened) key stores.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `password` | `string` | The master password |

#### Returns

`Promise`\<[`Result`](../../../../../../ts-res-ui-components/type-aliases/Result.md)\<`KeyStore_2`\>\>

Success with this instance when initialized, Failure if already initialized or opened

***

### listSecrets()

> **listSecrets**(): [`Result`](../../../../../../ts-res-ui-components/type-aliases/Result.md)\<readonly `string`[]\>

Lists all secret names in the key store.

#### Returns

[`Result`](../../../../../../ts-res-ui-components/type-aliases/Result.md)\<readonly `string`[]\>

Success with array of secret names, Failure if locked

***

### listSecretsByType()

> **listSecretsByType**(`type`): [`Result`](../../../../../../ts-res-ui-components/type-aliases/Result.md)\<readonly `string`[]\>

Lists secret names filtered by type.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `type` | [`KeyStoreSecretType`](../type-aliases/KeyStoreSecretType.md) | The secret type to filter by |

#### Returns

[`Result`](../../../../../../ts-res-ui-components/type-aliases/Result.md)\<readonly `string`[]\>

Success with array of matching secret names, Failure if locked

***

### lock()

> **lock**(`force?`): [`Result`](../../../../../../ts-res-ui-components/type-aliases/Result.md)\<`KeyStore_2`\>

Locks the key store, clearing all secrets from memory.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `force?` | `boolean` | If true, discards unsaved changes |

#### Returns

[`Result`](../../../../../../ts-res-ui-components/type-aliases/Result.md)\<`KeyStore_2`\>

Success when locked, Failure if unsaved changes and !force

***

### removeSecret()

> **removeSecret**(`name`): `Promise`\<[`Result`](../../../../../../ts-res-ui-components/type-aliases/Result.md)\<[`IRemoveSecretResult`](../interfaces/IRemoveSecretResult.md)\>\>

Removes a secret by name. Vault-first: the in-memory vault entry is dropped
before any storage cleanup runs. For asymmetric-keypair entries, best-effort
calls [CryptoUtils.KeyStore.IPrivateKeyStorage](../interfaces/IPrivateKeyStorage.md).delete on the entry's
`id`; a failure is reported via `warning` on the result but does not roll
back the vault removal.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `name` | `string` | Name of the secret to remove |

#### Returns

`Promise`\<[`Result`](../../../../../../ts-res-ui-components/type-aliases/Result.md)\<[`IRemoveSecretResult`](../interfaces/IRemoveSecretResult.md)\>\>

Success with removed entry (and optional warning), Failure if not found or locked

***

### renameSecret()

> **renameSecret**(`oldName`, `newName`): [`Result`](../../../../../../ts-res-ui-components/type-aliases/Result.md)\<[`IKeyStoreEntry`](../type-aliases/IKeyStoreEntry.md)\>

Renames a secret.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `oldName` | `string` | Current name |
| `newName` | `string` | New name |

#### Returns

[`Result`](../../../../../../ts-res-ui-components/type-aliases/Result.md)\<[`IKeyStoreEntry`](../type-aliases/IKeyStoreEntry.md)\>

Success with updated entry, Failure if source not found, target exists, or locked

***

### save()

> **save**(`password`): `Promise`\<[`Result`](../../../../../../ts-res-ui-components/type-aliases/Result.md)\<[`IKeyStoreFile`](../interfaces/IKeyStoreFile.md)\>\>

Saves the key store, returning the encrypted file content.
Requires the master password to encrypt.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `password` | `string` | The master password |

#### Returns

`Promise`\<[`Result`](../../../../../../ts-res-ui-components/type-aliases/Result.md)\<[`IKeyStoreFile`](../interfaces/IKeyStoreFile.md)\>\>

Success with IKeyStoreFile, Failure if locked

***

### saveWithKey()

> **saveWithKey**(`derivedKey`): `Promise`\<[`Result`](../../../../../../ts-res-ui-components/type-aliases/Result.md)\<[`IKeyStoreFile`](../interfaces/IKeyStoreFile.md)\>\>

Saves the key store using a pre-derived key, bypassing PBKDF2 key
derivation. Use this when the derived key has been stored externally
(e.g., in another key store) and the original password is no longer
available.

The supplied key must be the same key that was (or would be) derived
from the master password using the key store's PBKDF2 parameters.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `derivedKey` | `Uint8Array` | The pre-derived master key (32 bytes for AES-256) |

#### Returns

`Promise`\<[`Result`](../../../../../../ts-res-ui-components/type-aliases/Result.md)\<[`IKeyStoreFile`](../interfaces/IKeyStoreFile.md)\>\>

Success with IKeyStoreFile, Failure if locked or key invalid

***

### setSecretMetadata()

> **setSecretMetadata**(`name`, `value`): [`Result`](../../../../../../ts-res-ui-components/type-aliases/Result.md)\<[`IKeyStoreSymmetricEntry`](../interfaces/IKeyStoreSymmetricEntry.md)\>

Replaces the mutable metadata on a symmetric entry and stamps `updatedAt`
with the current timestamp. Does NOT touch the secret `key` bytes — the
material reads back identically afterward.

Metadata is non-secret by contract but physically lives inside the vault
ciphertext (see [CryptoUtils.KeyStore.IKeyStoreSymmetricEntry.metadata](../interfaces/IKeyStoreSymmetricEntry.md#property-metadata)).

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `name` | `string` | Name of the secret to update |
| `value` | [`JsonValue`](../../../../../../ts-res-ui-components/type-aliases/JsonValue.md) | New metadata value (replaces any prior metadata) |

#### Returns

[`Result`](../../../../../../ts-res-ui-components/type-aliases/Result.md)\<[`IKeyStoreSymmetricEntry`](../interfaces/IKeyStoreSymmetricEntry.md)\>

Success with the updated entry, Failure if not found, locked, or
the entry is asymmetric

***

### unlock()

> **unlock**(`password`): `Promise`\<[`Result`](../../../../../../ts-res-ui-components/type-aliases/Result.md)\<`KeyStore_2`\>\>

Unlocks an existing key store with the master password.
Decrypts the vault and loads secrets into memory.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `password` | `string` | The master password |

#### Returns

`Promise`\<[`Result`](../../../../../../ts-res-ui-components/type-aliases/Result.md)\<`KeyStore_2`\>\>

Success with this instance when unlocked, Failure if password incorrect

***

### unlockWithKey()

> **unlockWithKey**(`derivedKey`): `Promise`\<[`Result`](../../../../../../ts-res-ui-components/type-aliases/Result.md)\<`KeyStore_2`\>\>

Unlocks an existing key store with a pre-derived key, bypassing
PBKDF2 key derivation. Use this when the derived key has been
stored externally (e.g., in another key store) and the original
password is no longer available.

The supplied key must have been derived from the correct password
using the key store file's own PBKDF2 parameters (salt and
iteration count).

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `derivedKey` | `Uint8Array` | The pre-derived master key (32 bytes for AES-256) |

#### Returns

`Promise`\<[`Result`](../../../../../../ts-res-ui-components/type-aliases/Result.md)\<`KeyStore_2`\>\>

Success with this instance when unlocked, Failure if key is incorrect

***

### verifySecretFromPassword()

> **verifySecretFromPassword**(`name`, `password`, `keyDerivation`): `Promise`\<[`Result`](../../../../../../ts-res-ui-components/type-aliases/Result.md)\<`boolean`\>\>

Verifies that a candidate password derives the same key material currently
stored under `name`, using the supplied
[key derivation parameters](../../../type-aliases/IKeyDerivationParams.md).

The keystore does not persist per-slot key derivation parameters with the
entry — callers receive them from `addSecretFromPassword` and store them
alongside the encrypted artifact (or wherever else makes sense). Pass
those same parameters here for verification.

Re-derives a key from `password` + `keyDerivation`, then compares it to
the stored key material in constant time. Restricted to entries of type
`'encryption-key'` — the type produced by `addSecretFromPassword`. Other
symmetric types (`'api-key'`) and asymmetric entries are rejected so
the boolean result reflects "this slot accepts this password" rather
than an incidental byte-equality match against unrelated material.

Note: the keystore does not currently flag whether an `'encryption-key'`
entry was actually password-derived (vs. random via `addSecret` or raw
via `importSecret`). A `true` result therefore means "the candidate
password produces the same 32 bytes currently stored", which is what
the equivalent consumer-side helper (`verifyGatePassword`) already
implies for entries it manages.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `name` | `string` | Name of the secret to verify against |
| `password` | `string` | Candidate password to test |
| `keyDerivation` | [`IKeyDerivationParams`](../../../type-aliases/IKeyDerivationParams.md) | The key derivation parameters returned by `addSecretFromPassword` when the secret was created. Only `kdf: 'pbkdf2'` is supported. |

#### Returns

`Promise`\<[`Result`](../../../../../../ts-res-ui-components/type-aliases/Result.md)\<`boolean`\>\>

Success(true) when the candidate matches the stored key,
Success(false) when it does not, Failure if locked, secret missing,
wrong type, unsupported `kdf`, or key derivation fails

***

### verifySecretFromPasswordArgon2id()

> **verifySecretFromPasswordArgon2id**(`name`, `password`, `argon2idProvider`, `keyDerivation`): `Promise`\<[`Result`](../../../../../../ts-res-ui-components/type-aliases/Result.md)\<`boolean`\>\>

Verifies a candidate password against an Argon2id-derived entry using the
supplied key derivation parameters. Constant-time comparison.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `name` | `string` | Name of the secret to verify against |
| `password` | `string` | Candidate password to test |
| `argon2idProvider` | [`IArgon2idProvider`](../../../interfaces/IArgon2idProvider.md) | Argon2id provider (must produce bit-identical output for identical inputs) |
| `keyDerivation` | [`IArgon2idKeyDerivationParams`](../../../interfaces/IArgon2idKeyDerivationParams.md) | The Argon2id key derivation parameters returned by `addSecretFromPasswordArgon2id` |

#### Returns

`Promise`\<[`Result`](../../../../../../ts-res-ui-components/type-aliases/Result.md)\<`boolean`\>\>

Success(true) if candidate matches stored key, Success(false) if not,
Failure if locked, secret missing, wrong type, or derivation fails

***

### create()

> `static` **create**(`params`): [`Result`](../../../../../../ts-res-ui-components/type-aliases/Result.md)\<`KeyStore_2`\>

Creates a new, empty key store.
Call `initialize(password)` to set the master password.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `params` | [`IKeyStoreCreateParams`](../interfaces/IKeyStoreCreateParams.md) | Creation parameters |

#### Returns

[`Result`](../../../../../../ts-res-ui-components/type-aliases/Result.md)\<`KeyStore_2`\>

Success with new KeyStore instance, or Failure if parameters invalid

***

### open()

> `static` **open**(`params`): [`Result`](../../../../../../ts-res-ui-components/type-aliases/Result.md)\<`KeyStore_2`\>

Opens an existing encrypted key store.
Call `unlock(password)` to decrypt and access secrets.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `params` | [`IKeyStoreOpenParams`](../interfaces/IKeyStoreOpenParams.md) | Open parameters including the encrypted file |

#### Returns

[`Result`](../../../../../../ts-res-ui-components/type-aliases/Result.md)\<`KeyStore_2`\>

Success with KeyStore instance, or Failure if file format invalid
