[Home](../README.md) > multibaseSpkiPublicKey

# Variable: multibaseSpkiPublicKey

Converter for CryptoUtils.MultibaseSpkiPublicKey | multibase SPKI public key strings.
Validates that the value is a string with the `'m'` multibase prefix and a well-formed
base64url-no-pad body, and yields the branded value. Fails with context on a non-string,
bad-prefix, or malformed-body input.

## Type

`Converter<MultibaseSpkiPublicKey>`
