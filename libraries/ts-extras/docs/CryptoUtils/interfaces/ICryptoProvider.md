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

[generateUuid()](./ICryptoProvider.generateUuid.md)

</td><td>



</td><td>

Generates a cryptographically random UUIDv4 using the provider's
underlying source of randomness.

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
<tr><td>

[generateKeyPair(algorithm, extractable)](./ICryptoProvider.generateKeyPair.md)

</td><td>



</td><td>

Generates a new asymmetric keypair for the requested algorithm.

</td></tr>
<tr><td>

[exportPublicKeyJwk(publicKey)](./ICryptoProvider.exportPublicKeyJwk.md)

</td><td>



</td><td>

Exports the public half of a keypair as a JSON Web Key.

</td></tr>
<tr><td>

[importPublicKeyJwk(jwk, algorithm)](./ICryptoProvider.importPublicKeyJwk.md)

</td><td>



</td><td>

Re-imports a public-key JWK as a `CryptoKey` usable for verification or

</td></tr>
<tr><td>

[exportPublicKeySpki(publicKey)](./ICryptoProvider.exportPublicKeySpki.md)

</td><td>



</td><td>

Exports a public `CryptoKey` as a DER-encoded SPKI (SubjectPublicKeyInfo) blob.

</td></tr>
<tr><td>

[importPublicKeySpki(spkiBytes, algorithm)](./ICryptoProvider.importPublicKeySpki.md)

</td><td>



</td><td>

Imports a public key from a DER-encoded SPKI blob.

</td></tr>
<tr><td>

[wrapBytes(plaintext, recipientPublicKey, options)](./ICryptoProvider.wrapBytes.md)

</td><td>



</td><td>

Wraps `plaintext` for delivery to the holder of the private key paired
with `recipientPublicKey`.

</td></tr>
<tr><td>

[unwrapBytes(wrapped, recipientPrivateKey, options)](./ICryptoProvider.unwrapBytes.md)

</td><td>



</td><td>

Inverse of CryptoUtils.ICryptoProvider.wrapBytes | wrapBytes.

</td></tr>
<tr><td>

[sign(privateKey, data)](./ICryptoProvider.sign.md)

</td><td>



</td><td>

Signs `data` with `privateKey` using the algorithm inferred from the key.

</td></tr>
<tr><td>

[verify(publicKey, signature, data)](./ICryptoProvider.verify.md)

</td><td>



</td><td>

Verifies a signature produced by ICryptoProvider.sign.

</td></tr>
<tr><td>

[timingSafeEqual(a, b)](./ICryptoProvider.timingSafeEqual.md)

</td><td>



</td><td>

Compares two byte arrays in constant time.

</td></tr>
<tr><td>

[hmacSha256(key, data)](./ICryptoProvider.hmacSha256.md)

</td><td>



</td><td>

Computes an HMAC-SHA256 authentication code for `data` using `key`.

</td></tr>
<tr><td>

[verifyHmacSha256(key, signature, data)](./ICryptoProvider.verifyHmacSha256.md)

</td><td>



</td><td>

Verifies an HMAC-SHA256 authentication code in constant time.

</td></tr>
</tbody></table>
