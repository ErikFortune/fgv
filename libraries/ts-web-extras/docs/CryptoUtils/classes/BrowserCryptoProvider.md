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

[generateUuid()](./BrowserCryptoProvider.generateUuid.md)

</td><td>



</td><td>

Generates a cryptographically random UUIDv4 using the injected

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
<tr><td>

[generateKeyPair(algorithm, extractable)](./BrowserCryptoProvider.generateKeyPair.md)

</td><td>



</td><td>

Generates a new asymmetric keypair via Web Crypto.

</td></tr>
<tr><td>

[exportPublicKeyJwk(publicKey)](./BrowserCryptoProvider.exportPublicKeyJwk.md)

</td><td>



</td><td>

Exports a public `CryptoKey` as a JSON Web Key.

</td></tr>
<tr><td>

[importPublicKeyJwk(jwk, algorithm)](./BrowserCryptoProvider.importPublicKeyJwk.md)

</td><td>



</td><td>

Imports a public-key JWK as a `CryptoKey` for the requested algorithm.

</td></tr>
<tr><td>

[exportPublicKeySpki(publicKey)](./BrowserCryptoProvider.exportPublicKeySpki.md)

</td><td>



</td><td>

Exports a public `CryptoKey` as a DER-encoded SPKI blob.

</td></tr>
<tr><td>

[importPublicKeySpki(spkiBytes, algorithm)](./BrowserCryptoProvider.importPublicKeySpki.md)

</td><td>



</td><td>

Imports a public key from a DER-encoded SPKI blob.

</td></tr>
<tr><td>

[sign(privateKey, data)](./BrowserCryptoProvider.sign.md)

</td><td>



</td><td>

Signs `data` with `privateKey` using the algorithm inferred from the key.

</td></tr>
<tr><td>

[verify(publicKey, signature, data)](./BrowserCryptoProvider.verify.md)

</td><td>



</td><td>

Verifies a signature produced by BrowserCryptoProvider.sign.

</td></tr>
<tr><td>

[timingSafeEqual(a, b)](./BrowserCryptoProvider.timingSafeEqual.md)

</td><td>



</td><td>

Compares two byte arrays in constant time.

</td></tr>
<tr><td>

[hmacSha256(key, data)](./BrowserCryptoProvider.hmacSha256.md)

</td><td>



</td><td>

Computes an HMAC-SHA256 MAC for `data` using `key`.

</td></tr>
<tr><td>

[verifyHmacSha256(key, signature, data)](./BrowserCryptoProvider.verifyHmacSha256.md)

</td><td>



</td><td>

Verifies an HMAC-SHA256 MAC in constant time.

</td></tr>
<tr><td>

[wrapBytes(plaintext, recipientPublicKey, options)](./BrowserCryptoProvider.wrapBytes.md)

</td><td>



</td><td>

Wraps `plaintext` for the holder of `recipientPublicKey` using
ECIES (ECDH P-256 + HKDF-SHA256 + AES-GCM-256).

</td></tr>
<tr><td>

[unwrapBytes(wrapped, recipientPrivateKey, options)](./BrowserCryptoProvider.unwrapBytes.md)

</td><td>



</td><td>

Unwraps a payload produced by `wrapBytes` using the recipient's private
key.

</td></tr>
</tbody></table>
