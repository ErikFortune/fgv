[Home](../../README.md) > [CryptoUtils](../README.md) > BrowserCryptoProvider

# Class: BrowserCryptoProvider

Browser implementation of `ICryptoProvider` using the Web Crypto API.
Uses AES-256-GCM for authenticated encryption.

Note: This provider requires a browser environment with Web Crypto API support.
In Node.js 15+, Web Crypto is available via globalThis.crypto or require('crypto').webcrypto.

**Implements:** `ICryptoProvider`

## Constructors

<table><thead><tr><th>

Constructor

</th><th>

Modifiers

</th><th>

Description

</th></tr></thead>
<tbody>
<tr><td>

`constructor(cryptoApi)`

</td><td>



</td><td>

Creates a new CryptoUtils.BrowserCryptoProvider | BrowserCryptoProvider.

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

[encrypt(plaintext, key)](./BrowserCryptoProvider.encrypt.md)

</td><td>



</td><td>

Encrypts plaintext using AES-256-GCM.

</td></tr>
<tr><td>

[decrypt(encryptedData, key, iv, authTag)](./BrowserCryptoProvider.decrypt.md)

</td><td>



</td><td>

Decrypts ciphertext using AES-256-GCM.

</td></tr>
<tr><td>

[generateKey()](./BrowserCryptoProvider.generateKey.md)

</td><td>



</td><td>

Generates a random 32-byte key suitable for AES-256.

</td></tr>
<tr><td>

[deriveKey(password, salt, iterations)](./BrowserCryptoProvider.deriveKey.md)

</td><td>



</td><td>

Derives a key from a password using PBKDF2.

</td></tr>
<tr><td>

[sha256(data)](./BrowserCryptoProvider.sha256.md)

</td><td>



</td><td>

Computes a SHA-256 hash of the given data.

</td></tr>
<tr><td>

[generateRandomBytes(length)](./BrowserCryptoProvider.generateRandomBytes.md)

</td><td>



</td><td>

Generates cryptographically secure random bytes.

</td></tr>
<tr><td>

[toBase64(data)](./BrowserCryptoProvider.toBase64.md)

</td><td>



</td><td>

Encodes binary data to base64 string.

</td></tr>
<tr><td>

[fromBase64(base64)](./BrowserCryptoProvider.fromBase64.md)

</td><td>



</td><td>

Decodes base64 string to binary data.

</td></tr>
</tbody></table>
