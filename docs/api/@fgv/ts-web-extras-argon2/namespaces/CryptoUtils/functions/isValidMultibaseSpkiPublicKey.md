[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-web-extras-argon2](../../../README.md) / [CryptoUtils](../README.md) / isValidMultibaseSpkiPublicKey

# Function: isValidMultibaseSpkiPublicKey()

> **isValidMultibaseSpkiPublicKey**(`value`): `value is MultibaseSpkiPublicKey`

Type guard for [CryptoUtils.MultibaseSpkiPublicKey](../type-aliases/MultibaseSpkiPublicKey.md): a string matching
[CryptoUtils.MultibaseSpkiPublicKeyRegExp](../variables/MultibaseSpkiPublicKeyRegExp.md) (multibase `'m'` prefix + a
non-empty base64url-no-pad body) whose body also satisfies the base64url-no-pad
length rule shared with [CryptoUtils.base64UrlNoPadDecode](base64UrlNoPadDecode.md). This is a
structural *shape* check, not full validation — it does not decode the DER SPKI
or verify the key material/algorithm (a malformed-but-well-shaped string fails
later, with clear context, in [CryptoUtils.importPublicKeyFromMultibaseSpki](importPublicKeyFromMultibaseSpki.md)).

## Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `value` | `unknown` | The value to test. |

## Returns

`value is MultibaseSpkiPublicKey`

`true` if `value` is a well-formed multibase SPKI public key string.
