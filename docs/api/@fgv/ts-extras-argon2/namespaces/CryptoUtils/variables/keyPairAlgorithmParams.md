[**@fgv Monorepo API Documentation**](../../../../../README.md)

***

[@fgv Monorepo API Documentation](../../../../../README.md) / [@fgv/ts-extras-argon2](../../../README.md) / [CryptoUtils](../README.md) / keyPairAlgorithmParams

# Variable: keyPairAlgorithmParams

> `const` **keyPairAlgorithmParams**: `Readonly`\<`Record`\<[`KeyPairAlgorithm`](../type-aliases/KeyPairAlgorithm.md), [`IKeyPairAlgorithmParams`](../interfaces/IKeyPairAlgorithmParams.md)\>\>

Lookup table from [CryptoUtils.KeyPairAlgorithm](../type-aliases/KeyPairAlgorithm.md) to the WebCrypto
parameters needed to drive `crypto.subtle`. Shared between every
[CryptoUtils.ICryptoProvider](../interfaces/ICryptoProvider.md) implementation since both Node and
browser providers speak the same WebCrypto API. Exposed for downstream
provider implementations (e.g. browser-side providers in `@fgv/ts-web-extras`).
