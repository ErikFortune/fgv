[Home](../../README.md) > [CryptoUtils](../README.md) > KeyStore

# Namespace: KeyStore

Key store module for password-protected secret management.

## Namespaces

<table><thead><tr><th>

Name

</th><th>

Description

</th></tr></thead>
<tbody>
<tr><td>

[Converters](./Converters/README.md)

</td><td>



</td></tr>
</tbody></table>

## Classes

<table><thead><tr><th>

Name

</th><th>

Description

</th></tr></thead>
<tbody>
<tr><td>

[KeyStore](./classes/KeyStore.md)

</td><td>

Password-protected key store for managing encryption secrets.

</td></tr>
</tbody></table>

## Interfaces

<table><thead><tr><th>

Name

</th><th>

Description

</th></tr></thead>
<tbody>
<tr><td>

[IKeyStoreSecretEntry](./interfaces/IKeyStoreSecretEntry.md)

</td><td>

A secret entry stored in the vault (in-memory representation).

</td></tr>
<tr><td>

[IKeyStoreSecretEntryJson](./interfaces/IKeyStoreSecretEntryJson.md)

</td><td>

JSON-serializable version of secret entry (for storage).

</td></tr>
<tr><td>

[IKeyStoreVaultContents](./interfaces/IKeyStoreVaultContents.md)

</td><td>

The decrypted vault contents - a versioned map of secrets.

</td></tr>
<tr><td>

[IKeyStoreFile](./interfaces/IKeyStoreFile.md)

</td><td>

The encrypted key store file format.

</td></tr>
<tr><td>

[IKeyStoreCreateParams](./interfaces/IKeyStoreCreateParams.md)

</td><td>

Parameters for creating a new key store.

</td></tr>
<tr><td>

[IKeyStoreOpenParams](./interfaces/IKeyStoreOpenParams.md)

</td><td>

Parameters for opening an existing key store.

</td></tr>
<tr><td>

[IAddSecretResult](./interfaces/IAddSecretResult.md)

</td><td>

Result of adding a secret to the key store.

</td></tr>
<tr><td>

[IAddSecretOptions](./interfaces/IAddSecretOptions.md)

</td><td>

Options for adding a secret.

</td></tr>
<tr><td>

[IImportSecretOptions](./interfaces/IImportSecretOptions.md)

</td><td>

Options for importing a secret.

</td></tr>
<tr><td>

[IAddSecretFromPasswordOptions](./interfaces/IAddSecretFromPasswordOptions.md)

</td><td>

Options for adding a secret derived from a password.

</td></tr>
<tr><td>

[IAddSecretFromPasswordResult](./interfaces/IAddSecretFromPasswordResult.md)

</td><td>

Result of adding a password-derived secret.

</td></tr>
</tbody></table>

## Type Aliases

<table><thead><tr><th>

Name

</th><th>

Description

</th></tr></thead>
<tbody>
<tr><td>

[KeyStoreFormat](./type-aliases/KeyStoreFormat.md)

</td><td>

Format version for key store files.

</td></tr>
<tr><td>

[KeyStoreSecretType](./type-aliases/KeyStoreSecretType.md)

</td><td>

Discriminator for secret types stored in the vault.

</td></tr>
<tr><td>

[KeyStoreLockState](./type-aliases/KeyStoreLockState.md)

</td><td>

Key store lock state.

</td></tr>
</tbody></table>

## Functions

<table><thead><tr><th>

Name

</th><th>

Description

</th></tr></thead>
<tbody>
<tr><td>

[isKeyStoreFile](./functions/isKeyStoreFile.md)

</td><td>

Checks if a JSON object appears to be a key store file.

</td></tr>
</tbody></table>

## Variables

<table><thead><tr><th>

Name

</th><th>

Description

</th></tr></thead>
<tbody>
<tr><td>

[KEYSTORE_FORMAT](./variables/KEYSTORE_FORMAT.md)

</td><td>

Current format version constant.

</td></tr>
<tr><td>

[DEFAULT_KEYSTORE_ITERATIONS](./variables/DEFAULT_KEYSTORE_ITERATIONS.md)

</td><td>

Default PBKDF2 iterations for key store encryption.

</td></tr>
<tr><td>

[MIN_SALT_LENGTH](./variables/MIN_SALT_LENGTH.md)

</td><td>

Minimum salt length for key derivation.

</td></tr>
<tr><td>

[allKeyStoreSecretTypes](./variables/allKeyStoreSecretTypes.md)

</td><td>

All valid key store secret types.

</td></tr>
<tr><td>

[DEFAULT_SECRET_ITERATIONS](./variables/DEFAULT_SECRET_ITERATIONS.md)

</td><td>

Default PBKDF2 iterations for secret-level key derivation.

</td></tr>
</tbody></table>
