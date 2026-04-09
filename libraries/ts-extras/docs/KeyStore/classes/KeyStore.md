[Home](../../README.md) > [KeyStore](../README.md) > KeyStore

# Class: KeyStore

Password-protected key store for managing encryption secrets.

The KeyStore provides a secure vault for storing named encryption keys.
The vault is encrypted at rest using a master password via PBKDF2 key derivation.

**Implements:** [`IEncryptionProvider`](../../interfaces/IEncryptionProvider.md)

## Properties

<table><thead><tr><th>

Property

</th><th>

Modifiers

</th><th>

Type

</th><th>

Description

</th></tr></thead>
<tbody>
<tr><td>

[isUnlocked](./KeyStore.isUnlocked.md)

</td><td>

`readonly`

</td><td>

boolean

</td><td>

Checks if the key store is unlocked.

</td></tr>
<tr><td>

[isDirty](./KeyStore.isDirty.md)

</td><td>

`readonly`

</td><td>

boolean

</td><td>

Checks if there are unsaved changes.

</td></tr>
<tr><td>

[isNew](./KeyStore.isNew.md)

</td><td>

`readonly`

</td><td>

boolean

</td><td>

Whether this is a newly created key store (not opened from a file).

</td></tr>
<tr><td>

[state](./KeyStore.state.md)

</td><td>

`readonly`

</td><td>

[KeyStoreLockState](../../type-aliases/KeyStoreLockState.md)

</td><td>

Gets the current lock state.

</td></tr>
<tr><td>

[cryptoProvider](./KeyStore.cryptoProvider.md)

</td><td>

`readonly`

</td><td>

[ICryptoProvider](../../interfaces/ICryptoProvider.md)

</td><td>

Gets the crypto provider used by this key store.

</td></tr>
</tbody></table>

## Methods

<table><thead><tr><th>

Method

</th><th>

Modifiers

</th><th>

Description

</th></tr></thead>
<tbody>
<tr><td>

[create(params)](./KeyStore.create.md)

</td><td>

`static`

</td><td>

Creates a new, empty key store.

</td></tr>
<tr><td>

[open(params)](./KeyStore.open.md)

</td><td>

`static`

</td><td>

Opens an existing encrypted key store.

</td></tr>
<tr><td>

[initialize(password)](./KeyStore.initialize.md)

</td><td>



</td><td>

Initializes a new key store with the master password.

</td></tr>
<tr><td>

[unlock(password)](./KeyStore.unlock.md)

</td><td>



</td><td>

Unlocks an existing key store with the master password.

</td></tr>
<tr><td>

[lock(force)](./KeyStore.lock.md)

</td><td>



</td><td>

Locks the key store, clearing all secrets from memory.

</td></tr>
<tr><td>

[listSecrets()](./KeyStore.listSecrets.md)

</td><td>



</td><td>

Lists all secret names in the key store.

</td></tr>
<tr><td>

[getSecret(name)](./KeyStore.getSecret.md)

</td><td>



</td><td>

Gets a secret by name.

</td></tr>
<tr><td>

[hasSecret(name)](./KeyStore.hasSecret.md)

</td><td>



</td><td>

Checks if a secret exists.

</td></tr>
<tr><td>

[addSecret(name, options)](./KeyStore.addSecret.md)

</td><td>



</td><td>

Adds a new secret with a randomly generated key.

</td></tr>
<tr><td>

[importSecret(name, key, options)](./KeyStore.importSecret.md)

</td><td>



</td><td>

Imports raw 32-byte key material into the vault.

</td></tr>
<tr><td>

[addSecretFromPassword(name, password, options)](./KeyStore.addSecretFromPassword.md)

</td><td>



</td><td>

Adds a secret derived from a password using PBKDF2.

</td></tr>
<tr><td>

[removeSecret(name)](./KeyStore.removeSecret.md)

</td><td>



</td><td>

Removes a secret by name.

</td></tr>
<tr><td>

[importApiKey(name, apiKey, options)](./KeyStore.importApiKey.md)

</td><td>



</td><td>

Imports an API key string into the vault.

</td></tr>
<tr><td>

[getApiKey(name)](./KeyStore.getApiKey.md)

</td><td>



</td><td>

Retrieves an API key string by name.

</td></tr>
<tr><td>

[listSecretsByType(type)](./KeyStore.listSecretsByType.md)

</td><td>



</td><td>

Lists secret names filtered by type.

</td></tr>
<tr><td>

[renameSecret(oldName, newName)](./KeyStore.renameSecret.md)

</td><td>



</td><td>

Renames a secret.

</td></tr>
<tr><td>

[save(password)](./KeyStore.save.md)

</td><td>



</td><td>

Saves the key store, returning the encrypted file content.

</td></tr>
<tr><td>

[changePassword(currentPassword, newPassword)](./KeyStore.changePassword.md)

</td><td>



</td><td>

Changes the master password.

</td></tr>
<tr><td>

[encryptByName(secretName, content, metadata)](./KeyStore.encryptByName.md)

</td><td>



</td><td>

Encrypts JSON content under a named secret.

</td></tr>
<tr><td>

[getSecretProvider()](./KeyStore.getSecretProvider.md)

</td><td>



</td><td>

Creates a SecretProvider function for use with IEncryptionConfig.

</td></tr>
<tr><td>

[getEncryptionConfig()](./KeyStore.getEncryptionConfig.md)

</td><td>



</td><td>

Creates a partial IEncryptionConfig using this key store as the secret source.

</td></tr>
</tbody></table>
