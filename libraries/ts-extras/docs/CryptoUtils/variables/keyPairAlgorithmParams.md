[Home](../../README.md) > [CryptoUtils](../README.md) > keyPairAlgorithmParams

# Variable: keyPairAlgorithmParams

Lookup table from CryptoUtils.KeyPairAlgorithm to the WebCrypto
parameters needed to drive `crypto.subtle`. Shared between every
CryptoUtils.ICryptoProvider implementation since both Node and
browser providers speak the same WebCrypto API. Exposed for downstream
provider implementations (e.g. browser-side providers in `@fgv/ts-web-extras`).

## Type

`Readonly<Record<KeyPairAlgorithm, IKeyPairAlgorithmParams>>`
