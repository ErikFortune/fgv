[Home](../../../README.md) > [CryptoUtils](../../README.md) > [KeyStore](../README.md) > jsonWebKeyShape

# Variable: jsonWebKeyShape

In-place shape check for a JSON Web Key. Asserts only that the input is a
non-array object whose `kty` discriminator is a string; every other JWK
field passes through untouched. This is intentionally **not** a true JWK
validator — per-algorithm correctness (RSA `n`/`e`, EC `crv`/`x`/`y`,
key-size constraints, etc.) is delegated to `crypto.subtle.importKey` at
first use, which is the authoritative checker. The "shape" suffix in the
name is the warning sign for readers expecting full validation.

## Type

`Validator<JsonWebKey>`
