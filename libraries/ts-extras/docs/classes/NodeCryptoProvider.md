[Home](../README.md) > NodeCryptoProvider

# Class: NodeCryptoProvider

Node.js implementation of CryptoUtils.ICryptoProvider using the built-in crypto module.
Uses AES-256-GCM for authenticated encryption.

**Implements:** [`ICryptoProvider`](../interfaces/ICryptoProvider.md)

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

`constructor()`

</td><td>



</td><td>



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

[encrypt(plaintext, key)](./NodeCryptoProvider.encrypt.md)

</td><td>



</td><td>

Encrypts plaintext using AES-256-GCM.

</td></tr>
<tr><td>

[decrypt(encryptedData, key, iv, authTag)](./NodeCryptoProvider.decrypt.md)

</td><td>



</td><td>

Decrypts ciphertext using AES-256-GCM.

</td></tr>
<tr><td>

[generateKey()](./NodeCryptoProvider.generateKey.md)

</td><td>



</td><td>

Generates a random 32-byte key suitable for AES-256.

</td></tr>
<tr><td>

[deriveKey(password, salt, iterations)](./NodeCryptoProvider.deriveKey.md)

</td><td>



</td><td>

Derives a key from a password using PBKDF2.

</td></tr>
<tr><td>

[sha256(data)](./NodeCryptoProvider.sha256.md)

</td><td>



</td><td>

Computes a SHA-256 hash of the given data.

</td></tr>
<tr><td>

[generateRandomBytes(length)](./NodeCryptoProvider.generateRandomBytes.md)

</td><td>



</td><td>

Generates cryptographically secure random bytes.

</td></tr>
<tr><td>

[generateUuid()](./NodeCryptoProvider.generateUuid.md)

</td><td>



</td><td>

Generates a cryptographically random UUIDv4 via the platform Web Crypto API.

</td></tr>
<tr><td>

[toBase64(data)](./NodeCryptoProvider.toBase64.md)

</td><td>



</td><td>

Encodes binary data to base64 string.

</td></tr>
<tr><td>

[fromBase64(base64)](./NodeCryptoProvider.fromBase64.md)

</td><td>



</td><td>

Decodes base64 string to binary data.

</td></tr>
<tr><td>

[generateKeyPair(algorithm, extractable)](./NodeCryptoProvider.generateKeyPair.md)

</td><td>



</td><td>

Generates a new asymmetric keypair using Node's WebCrypto.

</td></tr>
<tr><td>

[exportPublicKeyJwk(publicKey)](./NodeCryptoProvider.exportPublicKeyJwk.md)

</td><td>



</td><td>

Exports a public `CryptoKey` as a JSON Web Key.

</td></tr>
<tr><td>

[importPublicKeyJwk(jwk, algorithm)](./NodeCryptoProvider.importPublicKeyJwk.md)

</td><td>



</td><td>

Imports a public-key JWK as a `CryptoKey` for the requested algorithm.

</td></tr>
<tr><td>

[exportPublicKeySpki(publicKey)](./NodeCryptoProvider.exportPublicKeySpki.md)

</td><td>



</td><td>

Exports a public `CryptoKey` as a DER-encoded SPKI blob.

</td></tr>
<tr><td>

[importPublicKeySpki(spkiBytes, algorithm)](./NodeCryptoProvider.importPublicKeySpki.md)

</td><td>



</td><td>

Imports a public key from a DER-encoded SPKI blob.

</td></tr>
<tr><td>

[sign(privateKey, data)](./NodeCryptoProvider.sign.md)

</td><td>



</td><td>

Signs `data` with `privateKey` using the algorithm inferred from the key.

</td></tr>
<tr><td>

[verify(publicKey, signature, data)](./NodeCryptoProvider.verify.md)

</td><td>



</td><td>

Verifies a signature produced by NodeCryptoProvider.sign.

</td></tr>
<tr><td>

[timingSafeEqual(a, b)](./NodeCryptoProvider.timingSafeEqual.md)

</td><td>



</td><td>

Compares two byte arrays in constant time using Node's native
`crypto.timingSafeEqual`.

</td></tr>
<tr><td>

[hmacSha256(key, data)](./NodeCryptoProvider.hmacSha256.md)

</td><td>



</td><td>

Computes an HMAC-SHA256 MAC for `data` using `key`.

</td></tr>
<tr><td>

[verifyHmacSha256(key, signature, data)](./NodeCryptoProvider.verifyHmacSha256.md)

</td><td>



</td><td>

Verifies an HMAC-SHA256 MAC in constant time.

</td></tr>
<tr><td>

[wrapBytes(plaintext, recipientPublicKey, options)](./NodeCryptoProvider.wrapBytes.md)

</td><td>



</td><td>

Wraps `plaintext` for the holder of `recipientPublicKey` using
ECIES (ECDH P-256 + HKDF-SHA256 + AES-GCM-256).

</td></tr>
<tr><td>

[unwrapBytes(wrapped, recipientPrivateKey, options)](./NodeCryptoProvider.unwrapBytes.md)

</td><td>



</td><td>

Unwraps a payload produced by `wrapBytes` using the recipient's private
key.

</td></tr>
</tbody></table>
