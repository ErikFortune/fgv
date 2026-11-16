[**@fgv Monorepo API Documentation**](../../../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../../../README.md) / [@fgv/ts-extras-argon2](../../../../../README.md) / [CryptoUtils](../../../README.md) / [Converters](../README.md) / multibaseSpkiPublicKey

# Variable: multibaseSpkiPublicKey

> `const` **multibaseSpkiPublicKey**: [`Converter`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<[`MultibaseSpkiPublicKey`](../../../type-aliases/MultibaseSpkiPublicKey.md)\>

Converter for [multibase SPKI public key](../../../type-aliases/MultibaseSpkiPublicKey.md) strings.
Validates that the value is a string with the `'m'` multibase prefix and a well-formed
base64url-no-pad body, and yields the branded value. Fails with context on a non-string,
bad-prefix, or malformed-body input.
