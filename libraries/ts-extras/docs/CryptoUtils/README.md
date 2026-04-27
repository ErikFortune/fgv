[Home](../README.md) > CryptoUtils

# Namespace: CryptoUtils

Crypto utilities for encrypted file handling and key management.

## Namespaces

<table><thead><tr><th>

Name

</th><th>

Description

</th></tr></thead>
<tbody>
<tr><td>

[Constants](./Constants/README.md)

</td><td>



</td></tr>
<tr><td>

[KeyStore](./KeyStore/README.md)

</td><td>

Key store module for password-protected secret management.

</td></tr>
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

[DirectEncryptionProvider](./classes/DirectEncryptionProvider.md)

</td><td>

An IEncryptionProvider that uses a pre-supplied key and crypto provider.

</td></tr>
<tr><td>

[NodeCryptoProvider](./classes/NodeCryptoProvider.md)

</td><td>

Node.js implementation of CryptoUtils.ICryptoProvider using the built-in crypto module.

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

[INamedSecret](./interfaces/INamedSecret.md)

</td><td>

Named secret for encryption/decryption.

</td></tr>
<tr><td>

[IEncryptionResult](./interfaces/IEncryptionResult.md)

</td><td>

Result of an encryption operation.

</td></tr>
<tr><td>

[IKeyDerivationParams](./interfaces/IKeyDerivationParams.md)

</td><td>

Key derivation parameters stored in encrypted files.

</td></tr>
<tr><td>

[IEncryptedFile](./interfaces/IEncryptedFile.md)

</td><td>

Generic encrypted file format.

</td></tr>
<tr><td>

[ICryptoProvider](./interfaces/ICryptoProvider.md)

</td><td>

Crypto provider interface for cross-platform encryption.

</td></tr>
<tr><td>

[IEncryptionProvider](./interfaces/IEncryptionProvider.md)

</td><td>

High-level interface for encrypting JSON content by secret name.

</td></tr>
<tr><td>

[IEncryptionConfig](./interfaces/IEncryptionConfig.md)

</td><td>

Configuration for encrypted file handling during loading.

</td></tr>
<tr><td>

[IDirectEncryptionProviderParams](./interfaces/IDirectEncryptionProviderParams.md)

</td><td>

Parameters for creating a DirectEncryptionProvider.

</td></tr>
<tr><td>

[IKeyPairAlgorithmParams](./interfaces/IKeyPairAlgorithmParams.md)

</td><td>

WebCrypto parameters for a single CryptoUtils.KeyPairAlgorithm.

</td></tr>
<tr><td>

[ICreateEncryptedFileParams](./interfaces/ICreateEncryptedFileParams.md)

</td><td>

Parameters for creating an CryptoUtils.IEncryptedFile | encrypted file.

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

[EncryptionAlgorithm](./type-aliases/EncryptionAlgorithm.md)

</td><td>

Supported encryption algorithms.

</td></tr>
<tr><td>

[EncryptedFileFormat](./type-aliases/EncryptedFileFormat.md)

</td><td>

Format version for encrypted files.

</td></tr>
<tr><td>

[KeyPairAlgorithm](./type-aliases/KeyPairAlgorithm.md)

</td><td>

Asymmetric keypair algorithms supported by the crypto provider.

</td></tr>
<tr><td>

[KeyDerivationFunction](./type-aliases/KeyDerivationFunction.md)

</td><td>

Supported key derivation functions.

</td></tr>
<tr><td>

[EncryptedFileErrorMode](./type-aliases/EncryptedFileErrorMode.md)

</td><td>

Behavior when an encrypted file cannot be decrypted.

</td></tr>
<tr><td>

[SecretProvider](./type-aliases/SecretProvider.md)

</td><td>

Function type for dynamic secret retrieval.

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

[isEncryptedFile](./functions/isEncryptedFile.md)

</td><td>

Checks if a JSON object appears to be an encrypted file.

</td></tr>
<tr><td>

[createEncryptedFile](./functions/createEncryptedFile.md)

</td><td>

Creates an CryptoUtils.IEncryptedFile | encrypted file from JSON content.

</td></tr>
<tr><td>

[decryptFile](./functions/decryptFile.md)

</td><td>

Decrypts an CryptoUtils.IEncryptedFile | encrypted file and returns the JSON content.

</td></tr>
<tr><td>

[fromBase64](./functions/fromBase64.md)

</td><td>

Decodes a base64 string to a `Uint8Array`.

</td></tr>
<tr><td>

[toBase64](./functions/toBase64.md)

</td><td>

Encodes a `Uint8Array` to a base64 string.

</td></tr>
<tr><td>

[tryDecryptFile](./functions/tryDecryptFile.md)

</td><td>

Attempts to parse and decrypt a JSON object as an CryptoUtils.IEncryptedFile | encrypted file.

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

[allKeyPairAlgorithms](./variables/allKeyPairAlgorithms.md)

</td><td>

All valid key pair algorithms.

</td></tr>
<tr><td>

[keyPairAlgorithmParams](./variables/keyPairAlgorithmParams.md)

</td><td>

Lookup table from CryptoUtils.KeyPairAlgorithm to the WebCrypto
parameters needed to drive `crypto.subtle`.

</td></tr>
<tr><td>

[nodeCryptoProvider](./variables/nodeCryptoProvider.md)

</td><td>

Singleton instance of CryptoUtils.NodeCryptoProvider.

</td></tr>
</tbody></table>
