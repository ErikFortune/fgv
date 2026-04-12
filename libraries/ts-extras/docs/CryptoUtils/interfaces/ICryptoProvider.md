[Home](../../README.md) > [CryptoUtils](../README.md) > ICryptoProvider

# Interface: ICryptoProvider

Crypto provider interface for cross-platform encryption.
Implementations provided for Node.js (crypto module) and browser (Web Crypto API).

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

[encrypt(plaintext, key)](./ICryptoProvider.encrypt.md)

</td><td>



</td><td>

Encrypts plaintext using AES-256-GCM.

</td></tr>
<tr><td>

[decrypt(encryptedData, key, iv, authTag)](./ICryptoProvider.decrypt.md)

</td><td>



</td><td>

Decrypts ciphertext using AES-256-GCM.

</td></tr>
<tr><td>

[generateKey()](./ICryptoProvider.generateKey.md)

</td><td>



</td><td>

Generates a random 32-byte key suitable for AES-256.

</td></tr>
<tr><td>

[deriveKey(password, salt, iterations)](./ICryptoProvider.deriveKey.md)

</td><td>



</td><td>

Derives a key from a password using PBKDF2.

</td></tr>
<tr><td>

[sha256(data)](./ICryptoProvider.sha256.md)

</td><td>



</td><td>

Computes a SHA-256 hash of the given data.

</td></tr>
<tr><td>

[generateRandomBytes(length)](./ICryptoProvider.generateRandomBytes.md)

</td><td>



</td><td>

Generates cryptographically secure random bytes.

</td></tr>
<tr><td>

[toBase64(data)](./ICryptoProvider.toBase64.md)

</td><td>



</td><td>

Encodes binary data to base64 string.

</td></tr>
<tr><td>

[fromBase64(base64)](./ICryptoProvider.fromBase64.md)

</td><td>



</td><td>

Decodes base64 string to binary data.

</td></tr>
</tbody></table>
