[Home](../README.md) > MultibaseSpkiPublicKeyRegExp

# Variable: MultibaseSpkiPublicKeyRegExp

The structural *shape* of a CryptoUtils.MultibaseSpkiPublicKey: the
multibase `'m'` prefix followed by a non-empty base64url-no-pad body
(`A-Z`, `a-z`, `0-9`, `-`, `_`).

This is a shape prefilter, not full validation: it does not decode the DER
SPKI or verify the key material or algorithm (that happens in
CryptoUtils.importPublicKeyFromMultibaseSpki). The authoritative guard
is CryptoUtils.isValidMultibaseSpkiPublicKey, which enforces this
pattern **and** additionally rejects a body whose length is an impossible
base64 remainder. Exposed for callers that need the pattern directly (e.g. a
JSON-schema `pattern` field); prefer the guard/converter for validation.

## Type

`RegExp`
