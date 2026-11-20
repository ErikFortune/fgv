[**@fgv Monorepo API Documentation**](../../../../../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../../../../../README.md) / [@fgv/ts-extras-argon2](../../../../../../../README.md) / [CryptoUtils](../../../../../README.md) / [KeyStore](../../../README.md) / [Converters](../README.md) / jsonWebKeyShape

# Variable: jsonWebKeyShape

> `const` **jsonWebKeyShape**: [`Validator`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`JsonWebKey`\>

In-place shape check for a JSON Web Key. Asserts only that the input is a
non-array object whose `kty` discriminator is a string; every other JWK
field passes through untouched. This is intentionally **not** a true JWK
validator — per-algorithm correctness (RSA `n`/`e`, EC `crv`/`x`/`y`,
key-size constraints, etc.) is delegated to `crypto.subtle.importKey` at
first use, which is the authoritative checker. The "shape" suffix in the
name is the warning sign for readers expecting full validation.

## Remarks

Built with `Validators.object` (in-place, non-strict) so unknown JWK fields
survive the round-trip; the cast to `FieldValidators<JsonWebKey>` is required
only because TypeScript's mapped type demands an entry for every key in
`JsonWebKey`. At runtime the `ObjectValidator` only inspects keys present in
the field-validators map.
