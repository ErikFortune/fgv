[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-web-extras-argon2](../../../README.md) / [CryptoUtils](../README.md) / MultibaseSpkiPublicKey

# Type Alias: MultibaseSpkiPublicKey

> **MultibaseSpkiPublicKey** = [`Brand`](https://github.com/ErikFortune/fgv/tree/main/libraries/ts-utils/docs)\<`string`, `"MultibaseSpkiPublicKey"`\>

A multibase base64url-encoded SPKI (SubjectPublicKeyInfo) public key string —
a `'m'` multibase prefix followed by a base64url-no-pad body. Produced by
[CryptoUtils.exportPublicKeyAsMultibaseSpki](../functions/exportPublicKeyAsMultibaseSpki.md) and consumed by
[CryptoUtils.importPublicKeyFromMultibaseSpki](../functions/importPublicKeyFromMultibaseSpki.md). Obtain the brand at a
boundary via [CryptoUtils.isValidMultibaseSpkiPublicKey](../functions/isValidMultibaseSpkiPublicKey.md) or the
[CryptoUtils.Converters.multibaseSpkiPublicKey](../namespaces/Converters/variables/multibaseSpkiPublicKey.md) converter.
